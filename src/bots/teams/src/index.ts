import fs from "fs";
import puppeteer from "puppeteer";
import { launch, getStream, wss } from "puppeteer-stream";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
// load config.json
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

const meetingId = config.meeting_info.meeting_id;
const organizerId = config.meeting_info.organizer_id;
const tenantId = config.meeting_info.tenant_id;
const displayName = config.bot_display_name;
const callbackUrl = config.callback_url;

if (typeof meetingId !== "string") {
  throw new Error("Invalid meeting ID in config.json");
} else if (typeof organizerId !== "string") {
  throw new Error("Invalid organizer ID in config.json");
} else if (typeof tenantId !== "string") {
  throw new Error("Invalid tenant ID in config.json");
} else if (displayName != null && typeof displayName !== "string") {
  throw new Error("Invalid display name in config.json");
} else if (callbackUrl != null && typeof callbackUrl !== "string") {
  throw new Error("Invalid callback URL in config.json");
}

const url = `https://teams.microsoft.com/v2/?meetingjoin=true#/l/meetup-join/19:meeting_${meetingId}@thread.v2/0?context=%7b%22Tid%22%3a%22${tenantId}%22%2c%22Oid%22%3a%22${organizerId}%22%7d&anon=true`;

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_BUCKET_NAME ||
  !process.env.AWS_REGION
) {
  throw new Error("Missing environment variables");
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const recordingPath = __dirname + "/recording.webm";
const file = fs.createWriteStream(recordingPath);

const leaveButtonSelector =
  'button[aria-label="Leave (Ctrl+Shift+H)"], button[aria-label="Leave (⌘+Shift+H)"]';

(async () => {
  // Launch the browser and open a new blank page
  const browser = await launch({
    executablePath: puppeteer.executablePath(),
    headless: "new",
    // args: ["--use-fake-ui-for-media-stream"],
    args: ["--no-sandbox"],
  });

  // Parse the URL
  const urlObj = new URL(url);

  // Override camera and microphone permissions
  const context = browser.defaultBrowserContext();
  context.clearPermissionOverrides();
  context.overridePermissions(urlObj.origin, ["camera", "microphone"]);

  // Open a new page
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(urlObj.href);

  // Fill in the display name
  await page
    .locator(`[data-tid="prejoin-display-name-input"]`)
    .fill(displayName ?? "Meeting Bot");

  // Mute microphone before joining
  await page.locator(`[data-tid="toggle-mute"]`).click();

  // Join the meeting
  await page.locator(`[data-tid="prejoin-join-button"]`).click();

  // Listen for changes to the people in the meeting
  page.locator(`aria-label="People"`).on("DOMSubtreeModified", async (e) => {
    console.log("People changed");
    console.log(e);
  });

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

  let timeout = 30000;
  if (isWaitingRoom) {
    console.log("Joined waiting room");
    timeout = 0; // wait indefinitely in the waiting room
  }

  // First wait for the leave button to appear (meaning we've joined the meeting)
  await page.waitForSelector(leaveButtonSelector, {
    timeout: timeout,
  });
  console.log("Successfully joined meeting");

  // Get the stream
  const stream = await getStream(page, { audio: true, video: true });

  // Pipe the stream to a file
  console.log("Recording...");
  stream.pipe(file);

  // Then wait for meeting to end by watching for the "Leave" button to disappear
  await page.waitForFunction(
    (selector) => !document.querySelector(selector),
    {},
    leaveButtonSelector
  );
  console.log("Meeting ended");

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

  // call callback url if it exists
  if (callbackUrl) {
    await fetch(callbackUrl, {
      method: "POST",
      body: JSON.stringify({ key }),
    });
  }
})();
