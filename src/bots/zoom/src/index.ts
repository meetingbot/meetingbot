import fs from "fs";
import puppeteer from "puppeteer";
import { launch, getStream, wss } from "puppeteer-stream";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Url from Zoom meeting
const url =
    "https://us05web.zoom.us/j/87363005197?pwd=PiCHwemSxPbCy8G2NCduOootSWiVmd.1";

// Parse the url to get the web meeting url
const parseZoomUrl = (input: string): string => {
  const urlObj = new URL(input);
  const meetingId = urlObj.pathname.split('/')[2];
  const params = new URLSearchParams(urlObj.search);
  const pwd = params.get('pwd');
  return `https://app.zoom.us/wc/${meetingId}/join?fromPWA=1&pwd=${pwd}`;
};

console.log(parseZoomUrl(url));

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
  
  const recordingPath = __dirname + "/recording.mp4";
  const file = fs.createWriteStream(recordingPath);

// Launch a browser and open the meeting
(async () => {
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
  const urlObj = new URL(parseZoomUrl(url));

  const context = browser.defaultBrowserContext();
  context.clearPermissionOverrides();
  context.overridePermissions(urlObj.origin, ["camera", "microphone"]);

  // Opens a new page
  const page = await browser.newPage();

  // Navigates to the url
  await page.goto(urlObj.href);

  // Waits for the page's iframe to load
  const iframe = await page.waitForSelector('.pwa-webclient__iframe');
  const frame = await iframe?.contentFrame();

  if (frame) {
    // Wait for things to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Waits for mute button to be clickable and clicks it
    await new Promise(resolve => setTimeout(resolve, 700)); // TODO: remove this line later
    await frame.waitForSelector('button[aria-label="Mute"]');
    await frame.click('button[aria-label="Mute"]');
    console.log("Muted");
    
    // Waits for the stop video button to be clickable and clicks it
    await new Promise(resolve => setTimeout(resolve, 700)); // TODO: remove this line later
    await frame.waitForSelector('button[aria-label="Stop Video"]');
    await frame.click('button[aria-label="Stop Video"]');
    console.log("Stopped video");
    
    // Waits for the input field and types the name
    await frame.waitForSelector("#input-for-name");
    await frame.type("#input-for-name", "Meeting Bot");
    console.log("Typed name");
    
    
    // Clicks the join button
    await frame.waitForSelector("button.zm-btn.preview-join-button");
    await frame.click("button.zm-btn.preview-join-button");
    console.log("Joined the meeting");
    
    // Wait for the leave button to appear and be properly labeled before starting recording
    await new Promise(resolve => setTimeout(resolve, 700)); // Needed to wait for the aria-label to be properly attached
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
      'button.zm-btn.zm-btn-legacy.zm-btn--primary.zm-btn__outline--blue',
      { timeout: 3600000 }
    );

    if (okButton) {
      console.log("Meeting ended");
      // Click the button to leave the meeting
      await okButton.click();

      // End the recording and close the file
      stream.destroy();
      file.close();
      console.log("Recording saved");

      // Upload recording to S3
  console.log("Uploading recording to S3...");
  const fileContent = await fs.promises.readFile(recordingPath);
  const uuid = crypto.randomUUID();
  const key = `recordings/${uuid}-zoom-recording.mp4`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: "video/mp4",
      })
    );
    console.log(`Successfully uploaded recording to S3: ${key}`);

    // Clean up local file
    await fs.promises.unlink(recordingPath);
  } catch (error) {
    console.error("Error uploading to S3:", error);
  }


      // Close the browser
      await browser.close();
      (await wss).close();
    } else {
      setTimeout(checkMeetingEnd, 1000); // Check every second
    }
  };

  // Start the meeting end check
  checkMeetingEnd();
})();