import { chromium } from "playwright-extra";
import { Browser, Page } from "playwright";
import { saveVideo, PageVideoCapture } from "playwright-video";
import { CaptureOptions } from "playwright-video/build/PageVideoCapture";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { setTimeout } from "timers/promises";
import { BotConfig, EventCode } from "../../src/types";
import { Bot } from "../../src/bot";
import * as fs from 'fs';

// Use Stealth
const stealthPlugin = StealthPlugin();
stealthPlugin.enabledEvasions.delete("iframe.contentWindow");
stealthPlugin.enabledEvasions.delete("media.codecs");
chromium.use(stealthPlugin);

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

const enterNameField = 'input[type="text"][aria-label="Your name"]';
const askToJoinButton = '//button[.//span[text()="Ask to join"]]';
const gotKickedDetector = '//button[.//span[text()="Return to home screen"]]';
const leaveButton = `//button[@aria-label="Leave call"]`;
const peopleButton = `//button[@aria-label="People"]`;
const onePersonRemainingField = '//span[.//div[text()="Contributors"]]//div[text()="1"]';
const muteButton = `[aria-label*="Turn off mic"]`; // *= -> conatins
const cameraOffButton = `[aria-label*="Turn off camera"]`;

const randomDelay = (amount: number) =>
  (2 * Math.random() - 1) * (amount / 10) + amount;


// Ensure Typescript doesn't complain about the global exposed functions that will be setup.
declare global {
  interface Window {
    saveChunk: (chunk: number[]) => void;
    stopRecording: () => void;

    setParticipantCount: (count: number) => void;
    addParticipantCount: (count: number) => void;

    recorder: MediaRecorder | undefined;
  }
}


export class MeetsBot extends Bot {
  browserArgs: string[];
  meetingURL: string;
  browser!: Browser;
  page!: Page;
  recorder: PageVideoCapture | undefined;
  kicked: boolean = false;
  recordingPath: string;

  private recordBuffer: Buffer[] = [];
  private startedRecording: boolean = false;

  private participantCount: number = 0;
  private timeAloneStarted: number = Infinity;

  constructor(
    botSettings: BotConfig,
    onEvent: (eventType: EventCode, data?: any) => Promise<void>
  ) {
    super(botSettings, onEvent);
    this.recordingPath = "/recording/recording.mp4";

    this.browserArgs = [
      "--incognito",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-infobars",
      // "--use-fake-device-for-media-stream",

      "--use-fake-ui-for-media-stream",
      "--use-file-for-fake-video-capture=/dev/null",
      "--use-file-for-fake-audio-capture=/dev/null",
    ];

    this.meetingURL = botSettings.meetingInfo.meetingUrl!;
    this.kicked = false;
    this.startedRecording = false;
  }

  // Send a Pulse to Server
  async sendHeartbeat() {
    // TODO: Replace with Send to Websocket connection
    console.log("heartbeat");
  }

  async run(): Promise<void> {
    await this.joinMeeting();
    await this.meetingActions();
  }

  getRecordingPath(): string {
    return this.recordingPath;
  }

  getContentType(): string {
    return "video/mp4";
  }

  async joinMeeting() {
    // Launch the browser and open a new blank page
    this.browser = await chromium.launch({
      headless: false,
      args: this.browserArgs,
    });

    // Unpack Dimensions
    const vp = { width: 1280, height: 720 };

    // Create Browser Context
    const context = await this.browser.newContext({
      permissions: ["camera", "microphone"],
      userAgent: userAgent,
      viewport: vp,
    });

    // Create Page, Go to
    this.page = await context.newPage();
    await this.page.waitForTimeout(randomDelay(1000));

    // Inject anti-detection code using addInitScript
    await this.page.addInitScript(() => {
      // Disable navigator.webdriver to avoid detection
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });

      // Override navigator.plugins to simulate real plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          { name: "Chrome PDF Plugin" },
          { name: "Chrome PDF Viewer" },
        ],
      });

      // Override navigator.languages to simulate real languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      // Override other properties
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 }); // Fake number of CPU cores
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 }); // Fake memory size
      Object.defineProperty(window, "innerWidth", { get: () => 1920 }); // Fake screen resolution
      Object.defineProperty(window, "innerHeight", { get: () => 1080 });
      Object.defineProperty(window, "outerWidth", { get: () => 1920 });
      Object.defineProperty(window, "outerHeight", { get: () => 1080 });
    });

    await this.page.mouse.move(10, 672);
    await this.page.mouse.move(102, 872);
    await this.page.mouse.move(114, 1472);
    await this.page.waitForTimeout(300);
    await this.page.mouse.move(114, 100);
    await this.page.mouse.click(100, 100);

    await this.page.goto(this.meetingURL, { waitUntil: "networkidle" });

    const name = this.settings.botDisplayName || "MeetingBot";

    console.log("Waiting for the input field to be visible...");
    await this.page.waitForSelector(enterNameField);

    console.log("Waiting for 1 seconds...");
    await this.page.waitForTimeout(randomDelay(1000));

    console.log("Filling the input field with the name...");
    await this.page.fill(enterNameField, name);


    // TODO: Mute Self - Turn Off Camera
    console.log('Turning Off Camera and Microphone ...');
    await this.page.waitForTimeout(randomDelay(500));
    await this.page.click(muteButton);
    await this.page.waitForTimeout(10);
    await this.page.click(cameraOffButton);
    await this.page.waitForTimeout(randomDelay(100));

    console.log('Waiting for the "Ask to join" button...');
    await this.page.waitForSelector(askToJoinButton, { timeout: 60000 });

    console.log('Clicking the "Ask to join" button...');
    await this.page.click(askToJoinButton);

    //Should Exit after 1 Minute
    console.log("Awaiting Entry ....");
    const timeout = this.settings.automaticLeave.waitingRoomTimeout; // in milliseconds

    // wait for the leave button to appear (meaning we've joined the meeting)
    await this.page.waitForSelector(leaveButton, {
      timeout: timeout,
    });


    console.log("Joined Call.");

    // Report JOINING_CALL event
    await this.onEvent(EventCode.JOINING_CALL);

    return 0;
  }

  async startRecording() {

    console.log('Attempting to start the recording ...');

    // Lock - for debugging
    if (this.startedRecording) return 0;
    this.startedRecording = true;

    console.log('Exposing Functions ...')

    // Expose Function to Save Chunks
    await this.page.exposeFunction('saveChunk', async (chunk: any) => {
      this.recordBuffer.push(Buffer.from(chunk));
    });

    // Expose Function to Stop Recording & Save as File
    await this.page.exposeFunction('stopRecording', async () => {
      console.log('Recording Stop Initiated with recorder.stop().')
      await this.saveRecording();
    });


    //Access Browser Media APIS
    console.log('Starting Window Details ...')
    await this.page.evaluate(() => {
      (async () => {

        try {
          console.log('Starting the Recording..')
          // Start Recording Stream
          const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 1, // Force audio to come from the browser only
            },
            video: {
              displaySurface: "window" // Capture only the current window
            }
          });

          // Remove microphone input, keep only system audio
          stream.getAudioTracks().forEach(track => {
            if (track.label.toLowerCase().includes("microphone")) {
              stream.removeTrack(track);
            }
          });

          // Store MediaRecorder instance inside `window`
          Object.assign(window, {
            recorder: new MediaRecorder(stream, {
              mimeType: "video/webm; codecs=opus",
              audioBitsPerSecond: 128000,
            })
          });

          if (!window.recorder) {
            throw new Error('Could not create MediaRecorder instance');
          }

          window.recorder.ondataavailable = async (e: BlobEvent) => {

            //Get a buffer
            const buffer = await e.data.arrayBuffer();
            window.saveChunk?.(Array.from(new Uint8Array(buffer))); //Send Chunk

          };

          window.recorder.onstop = async () => {
            console.log('Recording Stopped... attempting to save recording.')
            await window.stopRecording?.();
          }

          // Start Recording
          window.recorder.start(1000); // 1 second chunks
          console.log('Recording Started.')

          // Catch Error - End
        } catch (e) {
          console.error('Error Starting Recording:', e);
        }
      })(); // immediatly invoke

      console.log('Entered Evaluate Function ...')
    });


    console.log('Potentially Done.')

    return 0;
  }

  async saveRecording() {

    if (this.recordBuffer.length == 0) {
      console.log('No recording chunks to save.');
      return 1;
    }

    fs.writeFileSync(this.getRecordingPath(), Buffer.concat(this.recordBuffer), 'binary');
    console.log('Recording saved to:', this.getRecordingPath());
  }

  async stopRecording() {

    console.log('Attempting to stop the recording ...');

    await this.page.evaluate(async () => {

      console.log(window.recorder);

      // Error case
      if (!window.recorder) {
        console.log('Cannot stop recording as recording has not been started.')
        return 1;
      }

      await window.recorder.stop();
      window.recorder = undefined;
      console.log('Stopped Recording.')
    });

    return 0;
  }

  async meetingActions() {
    // Meeting Join Actions
    console.log("Clicking People Button...");
    await this.page.waitForSelector(peopleButton);
    await this.page.click(peopleButton);

    // Wait for the people panel to be visible
    await this.page.waitForSelector('[aria-label="Participants"]', {
      state: "visible",
    });

    // Start Recording, Yes by default
    console.log("Starting Recording");
    this.startRecording();

    // Set up participant monitoring

    // Monitor for participants joining
    await this.page.exposeFunction(
      "onParticipantJoin",
      async (participantId: string) => {
        await this.onEvent(EventCode.PARTICIPANT_JOIN, { participantId });
      }
    );

    // Monitor for participants leaving
    await this.page.exposeFunction(
      "onParticipantLeave",
      async (participantId: string) => {
        await this.onEvent(EventCode.PARTICIPANT_LEAVE, { participantId });
      }
    );


    // Expose function to update participant count
    await this.page.exposeFunction("addParticipantCount", (count: number) => {
      this.participantCount += count;
      console.log("Updated Participant Count:", this.participantCount);

      if (this.participantCount == 1) {
        this.timeAloneStarted = Date.now();
      } else {
        this.timeAloneStarted = Infinity;
      }
    });

    // Add mutation observer for participant list
    await this.page.evaluate(() => {

      const peopleList = document.querySelector('[aria-label="Participants"]');
      if (!peopleList) {
        console.error("Could not find participants list element");
        return;
      }

      // Initialize participant count
      const initialParticipants = peopleList.querySelectorAll('[data-participant-id]').length;
      window.addParticipantCount(initialParticipants); // initially 0
      console.log(`Initial participant count: ${initialParticipants}`);

      // Set up mutation observer
      console.log("Setting up mutation observer on participants list");
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node: any) => {
              if (
                node.getAttribute &&
                node.getAttribute("data-participant-id")
              ) {
                console.log(
                  "Participant joined:",
                  node.getAttribute("data-participant-id")
                );
                // @ts-ignore
                window.onParticipantJoin(
                  node.getAttribute("data-participant-id")
                );
                window.addParticipantCount(1);
              }
            });
            mutation.removedNodes.forEach((node: any) => {
              if (
                node.getAttribute &&
                node.getAttribute("data-participant-id")
              ) {
                console.log(
                  "Participant left:",
                  node.getAttribute("data-participant-id")
                );
                // @ts-ignore
                window.onParticipantLeave(
                  node.getAttribute("data-participant-id")
                );
                window.addParticipantCount(-1);
              }
            });
          }
        });
      });
      observer.observe(peopleList, { childList: true, subtree: true });
    });

    // Loop -- check for end meeting conditions every second
    console.log("Waiting until a leave condition is fulfilled..");
    while (true) {

      // Check if it's only me in the meeting
      console.log('Checking if 1 Person Remaining ...', this.participantCount);
      if (this.participantCount === 1) {

        const leaveMs = this.settings.automaticLeave.everyoneLeftTimeout;
        const msDiff = Date.now() - this.timeAloneStarted;
        console.log(`Only me left in the meeting. Waiting for timeout time to have allocated (${msDiff / 1000} / ${leaveMs / 1000}s) ...`);

        if (msDiff > leaveMs) {
          console.log('Only one participant remaining for more than alocated time, leaving the meeting.');
          break;
        }
      }

      // Got kicked -- no longer in the meeting
      // console.log('Checking for Return to Home ...')
      if (await this.page.locator(gotKickedDetector).count().catch(() => 0) > 0) {
        this.kicked = true;
        console.log('Kicked 0');
        break;
      }

      console.log('Checking for hidden leave button ...')
      if (await this.page.locator(leaveButton).isHidden({ timeout: 500 }).catch(() => true)) {
        this.kicked = true;
        console.log('Kicked 2');
        break;
      }
      console.log('Checking for removed from meeting text ...')
      if (await this.page.locator('text="You\'ve been removed from the meeting"').isVisible({ timeout: 500 }).catch(() => false)) {
        this.kicked = true;
        console.log('Kicked 3');
        break;
      }

      // Reset Loop
      console.log('Waiting 5 seconds.')
      await setTimeout(5000); //5 second loop
    }

    // Exit
    console.log("Starting End Life Actions ...");
    await this.leaveMeeting();
    return 0;
  }

  async leaveMeeting() {

    // Ensure Recording is done
    console.log('Stopping Recording ...')
    await this.stopRecording();
    console.log('Done.')

    // Try and Find the leave button, press. Otherwise, just delete the browser.
    try {
      console.log("Trying to leave the call ...")
      await this.page.click(leaveButton, { timeout: 1000 }); //Short Attempt
      console.log('Left Call.')
    } catch (e) {
      console.log('Attempted to Leave Call - couldn\'t (probably aleready left).')
    }

    await this.browser.close();
    console.log("Closed Browser.");

    return 0;
  }
}
