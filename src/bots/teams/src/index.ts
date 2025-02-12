import fs from "fs";
import puppeteer from "puppeteer";
import { launch, getStream, wss } from "puppeteer-stream";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";
import { BotConfig } from "../../../backend/src/db/schema";
// Load environment variables
dotenv.config();

const requiredEnvVars = [
  "BOT_DATA",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_BUCKET_NAME",
  "AWS_REGION",
] as const;

// Check all required environment variables are present
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// load config.json
const botData: BotConfig = JSON.parse(process.env.BOT_DATA!);
const { meetingInfo, botDisplayName, heartbeatInterval, automaticLeave } =
  botData;
const { meetingId, organizerId, tenantId } = meetingInfo;
const { waitingRoomTimeout } = automaticLeave;

const url = `https://teams.microsoft.com/v2/?meetingjoin=true#/l/meetup-join/19:meeting_${meetingId}@thread.v2/0?context=%7b%22Tid%22%3a%22${tenantId}%22%2c%22Oid%22%3a%22${organizerId}%22%7d&anon=true`;

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const recordingPath = __dirname + "/recording.webm";
const file = fs.createWriteStream(recordingPath);

const leaveButtonSelector =
  'button[aria-label="Leave (Ctrl+Shift+H)"], button[aria-label="Leave (⌘+Shift+H)"]';

//initialize global variable
let participants: string[] = [];
let participantsIntervalId: NodeJS.Timeout;

(async () => {
  const intervalId = setInterval(() => {
    console.log(
      `[${new Date().toISOString()}] Bot is running, participants: ${participants.join(
        ", "
      )}`
    );
    // trpc.bots.heartbeat
    //   .mutate({
    //     id: parseInt(process.env.BOT_ID || "0"),
    //     events: [],
    //   })
    //   .then((response) => {
    //     console.log(
    //       `[${new Date().toISOString()}] Heartbeat success: ${response.success}`
    //     );
    //   });
  }, heartbeatInterval); // Logs every heartbeatInterval milliseconds

  try {
    // Launch the browser and open a new blank page
    const browser = await launch({
      executablePath: puppeteer.executablePath(),
      headless: "new",
      // args: ["--use-fake-ui-for-media-stream"],
      args: ["--no-sandbox"],
      protocolTimeout: 0,
    });

    // Parse the URL
    const urlObj = new URL(url);

    // Override camera and microphone permissions
    const context = browser.defaultBrowserContext();
    context.clearPermissionOverrides();
    context.overridePermissions(urlObj.origin, ["camera", "microphone"]);

    // Open a new page
    const page = await browser.newPage();

    // Log all console messages
    page.on("console", (msg) =>
      console.log("\x1b[36m[BROWSER CONSOLE]\x1b[0m", msg.text())
    );

    // Navigate the page to a URL
    await page.goto(urlObj.href);

    // Fill in the display name
    await page
      .locator(`[data-tid="prejoin-display-name-input"]`)
      .fill(botDisplayName ?? "Meeting Bot");

    // Mute microphone before joining
    await page.locator(`[data-tid="toggle-mute"]`).click();

    // Join the meeting
    await page.locator(`[data-tid="prejoin-join-button"]`).click();

    // Wait until join button is disabled or disappears
    await page.waitForFunction(
      (selector) => {
        const joinButton = document.querySelector(selector);
        return !joinButton || joinButton.hasAttribute("disabled");
      },
      {},
      '[data-tid="prejoin-join-button"]'
    );

    // Check if we're in a waiting room by checking if the join button exists and is disabled
    const joinButton = await page.$('[data-tid="prejoin-join-button"]');
    const isWaitingRoom =
      joinButton &&
      (await joinButton.evaluate((button) => button.hasAttribute("disabled")));

    let timeout = 30000; // if not in the waiting room, wait 30 seconds to join the meeting
    if (isWaitingRoom) {
      console.log(
        `Joined waiting room, will wait for ${
          waitingRoomTimeout > 60 * 1000
            ? `${waitingRoomTimeout / 60 / 1000} minute(s)`
            : `${waitingRoomTimeout / 1000} second(s)`
        }`
      );

      // if in the waiting room, wait for the waiting room timeout
      timeout = waitingRoomTimeout; // in milliseconds
    }

    // wait for the leave button to appear (meaning we've joined the meeting)
    await page.waitForSelector(leaveButtonSelector, {
      timeout: timeout,
    });
    console.log("Successfully joined meeting");

    // Click the people button
    console.log("Opening the participants list");
    await page.locator('[aria-label="People"]').click();

    // Wait for the attendees tree to appear
    console.log("Waiting for the attendees tree to appear");
    const tree = await page.waitForSelector('[role="tree"]');
    console.log("Attendees tree found");

    const updateParticipants = async () => {
      try {
        const currentParticipants = await page.evaluate(() => {
          const participantsList = document.querySelector('[role="tree"]');
          if (!participantsList) {
            console.log("No participants list found");
            return [];
          }

          const currentElements = Array.from(
            participantsList.querySelectorAll(
              '[data-tid^="participantsInCall-"]'
            )
          );

          return currentElements
            .map((el) => {
              const nameSpan = el.querySelector("span[title]");
              return (
                nameSpan?.getAttribute("title") ||
                nameSpan?.textContent?.trim() ||
                ""
              );
            })
            .filter((name) => name);
        });

        participants = currentParticipants;
      } catch (error) {
        console.log("Error getting participants:", error);
      }
    };

    // Get initial participants list
    await updateParticipants();

    // Then check for participants every heartbeatInterval milliseconds
    participantsIntervalId = setInterval(updateParticipants, heartbeatInterval);

    // Get the stream
    const stream = await getStream(page, { audio: true, video: true });

    // Pipe the stream to a file
    console.log("Recording...");
    stream.pipe(file);

    // Then wait for meeting to end by watching for the "Leave" button to disappear
    await page.waitForFunction(
      (selector) => !document.querySelector(selector),
      { timeout: 0 }, // wait indefinitely
      leaveButtonSelector
    );
    console.log("Meeting ended");

    // Clear the participants checking interval
    clearInterval(participantsIntervalId);

    // Stop recording
    await stream.destroy();
    file.close();
    console.log("Recording finished");

    // Upload recording to S3
    console.log("Uploading recording to S3...");
    const fileContent = await fs.promises.readFile(recordingPath);
    const uuid = crypto.randomUUID();
    const key = `recordings/${uuid}-teams-recording.webm`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Body: fileContent,
          ContentType: "video/webm",
        })
      );
      console.log(`Successfully uploaded recording to S3: ${key}`);

      // Clean up local file
      await fs.promises.unlink(recordingPath);
    } catch (error) {
      console.error("Error uploading to S3:", error);
    }

    console.log("Closing browser");
    // Close the browser
    await browser.close();
    (await wss).close();

    // Clean up interval before exiting
    clearInterval(intervalId);
  } catch (error) {
    // Clean up interval if there's an error
    clearInterval(intervalId);
    throw error;
  }
})();
