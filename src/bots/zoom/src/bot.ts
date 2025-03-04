import fs from "fs";
import puppeteer from "puppeteer";
import { launch, getStream, wss } from "puppeteer-stream";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { BotConfig, EventCode } from "../../src/types";
import { Bot } from "../../src/bot";
import path from "path";

export class ZoomBot extends Bot {
  recordingPath: string;
  contentType: string;
  url: string;

  constructor(
    botSettings: BotConfig,
    onEvent: (eventType: EventCode, data?: any) => Promise<void>
  ) {
    super(botSettings, onEvent);
    this.recordingPath = path.resolve(__dirname, "recording.mp4");
    this.contentType = "video/mp4";
    this.url = `https://app.zoom.us/wc/${this.settings.meetingInfo.meetingId}/join?fromPWA=1&pwd=${this.settings.meetingInfo.meetingPassword}`;
  }

  async run() {
    const file = fs.createWriteStream(this.recordingPath);

    // Launch a browser and open the meeting

    const browser = await launch({
      executablePath: puppeteer.executablePath(),
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--use-fake-device-for-media-stream",
        // "--use-fake-ui-for-media-stream"
      ],
    });

    // Create a URL object from the url
    const urlObj = new URL(this.url);

    const context = browser.defaultBrowserContext();
    context.clearPermissionOverrides();
    context.overridePermissions(urlObj.origin, ["camera", "microphone"]);

    // Opens a new page
    const page = await browser.newPage();

    // Navigates to the url
    await page.goto(urlObj.href);

    // Waits for the page's iframe to load
    const iframe = await page.waitForSelector(".pwa-webclient__iframe");
    const frame = await iframe?.contentFrame();

    if (frame) {
      // Wait for things to load
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Waits for mute button to be clickable and clicks it
      await new Promise((resolve) => setTimeout(resolve, 700)); // TODO: remove this line later
      await frame.waitForSelector('button[aria-label="Mute"]');
      await frame.click('button[aria-label="Mute"]');
      console.log("Muted");

      // Waits for the stop video button to be clickable and clicks it
      await new Promise((resolve) => setTimeout(resolve, 700)); // TODO: remove this line later
      await frame.waitForSelector('button[aria-label="Stop Video"]');
      await frame.click('button[aria-label="Stop Video"]');
      console.log("Stopped video");

      // Waits for the input field and types the name from the config
      await frame.waitForSelector("#input-for-name");
      await frame.type("#input-for-name", this.settings.botDisplayName);
      console.log("Typed name");

      // Clicks the join button
      await frame.waitForSelector("button.zm-btn.preview-join-button");
      await frame.click("button.zm-btn.preview-join-button");
      console.log("Joined the meeting");

      // Wait for the leave button to appear and be properly labeled before starting recording
      await new Promise((resolve) => setTimeout(resolve, 1400)); // Needed to wait for the aria-label to be properly attached
      await frame.waitForSelector('button[aria-label="Leave"]');
      console.log("Leave button found and labeled, ready to start recording");
    }

    // Start the recording
    const stream = await getStream(page, { audio: true, video: true });
    console.log("Recording...");

    // Pipe the stream to the file
    stream.pipe(file);

    // Constantly check if the meeting has ended every second
    const checkMeetingEnd = async () => {
      // Wait for the "Ok" button to appear which indicates the meeting is over
      const okButton = await frame?.waitForSelector(
        "button.zm-btn.zm-btn-legacy.zm-btn--primary.zm-btn__outline--blue",
        { timeout: 3600000 }
      );

      if (okButton) {
        console.log("Meeting ended");
        // Click the button to leave the meeting
        await okButton.click();

        // End the recording and close the file
        stream.destroy();
        file.close();

        // Close the browser
        await browser.close();
        (await wss).close();
      } else {
        setTimeout(checkMeetingEnd, 1000); // Check every second
      }
    };

    // Start the meeting end check
    await checkMeetingEnd();
  }

  getRecordingPath(): string {
    return this.recordingPath;
  }

  getContentType(): string {
    return this.contentType;
  }
}
