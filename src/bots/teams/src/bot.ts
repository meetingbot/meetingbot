import fs from "fs";
import puppeteer from "puppeteer";
import { launch, getStream, wss } from "puppeteer-stream";
import crypto from "crypto";
import { BotConfig, EventCode } from "../../src/types";
import { Bot } from "../../src/bot";

export class TeamsBot extends Bot {
  recordingPath: string;
  contentType: string;
  url: string;
  participants: string[];
  participantsIntervalId: NodeJS.Timeout;

  constructor(
    botSettings: BotConfig,
    onEvent: (eventType: EventCode, data?: any) => Promise<void>
  ) {
    super(botSettings, onEvent);
    this.recordingPath = "./recording.webm";
    this.contentType = "video/webm";
    this.url = `https://teams.microsoft.com/v2/?meetingjoin=true#/l/meetup-join/19:meeting_${this.settings.meetingInfo.meetingId}@thread.v2/0?context=%7b%22Tid%22%3a%22${this.settings.meetingInfo.tenantId}%22%2c%22Oid%22%3a%22${this.settings.meetingInfo.organizerId}%22%7d&anon=true`;
    this.participants = [];
    this.participantsIntervalId = setInterval(() => {}, 0);
  }

  getRecordingPath(): string {
    return this.recordingPath;
  }

  getContentType(): string {
    return this.contentType;
  }

  async run() {
    const file = fs.createWriteStream(this.recordingPath);

    const leaveButtonSelector =
      'button[aria-label="Leave (Ctrl+Shift+H)"], button[aria-label="Leave (⌘+Shift+H)"]';

    // Launch the browser and open a new blank page
    const browser = await launch({
      executablePath: puppeteer.executablePath(),
      headless: "new",
      // args: ["--use-fake-ui-for-media-stream"],
      args: ["--no-sandbox"],
      protocolTimeout: 0,
    });

    // Parse the URL
    const urlObj = new URL(this.url);

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
      .fill(this.settings.botDisplayName ?? "Meeting Bot");

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
          this.settings.automaticLeave.waitingRoomTimeout > 60 * 1000
            ? `${
                this.settings.automaticLeave.waitingRoomTimeout / 60 / 1000
              } minute(s)`
            : `${
                this.settings.automaticLeave.waitingRoomTimeout / 1000
              } second(s)`
        }`
      );

      // if in the waiting room, wait for the waiting room timeout
      timeout = this.settings.automaticLeave.waitingRoomTimeout; // in milliseconds
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

        this.participants = currentParticipants;
      } catch (error) {
        console.log("Error getting participants:", error);
      }
    };

    // Get initial participants list
    await updateParticipants();

    // Then check for participants every heartbeatInterval milliseconds
    this.participantsIntervalId = setInterval(
      updateParticipants,
      this.settings.heartbeatInterval
    );

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
    clearInterval(this.participantsIntervalId);

    // Stop recording
    await stream.destroy();
    file.close();
    console.log("Recording finished");

    // Upload recording to S3
    console.log("Uploading recording to S3...");
    const fileContent = await fs.promises.readFile(this.recordingPath);
    const uuid = crypto.randomUUID();
    const key = `recordings/${uuid}-teams-recording.webm`;

    console.log("Closing browser");
    // Close the browser
    await browser.close();
    (await wss).close();
  }
}
