import { chromium } from 'playwright-extra';
import { Browser, Page } from 'playwright';
import { saveVideo, PageVideoCapture } from 'playwright-video';
import { CaptureOptions } from 'playwright-video/build/PageVideoCapture';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { setTimeout } from 'timers/promises';
import { EventCode } from '../../../backend/src/db/schema';

// Use Stealth
const stealthPlugin = StealthPlugin();
stealthPlugin.enabledEvasions.delete('iframe.contentWindow');
stealthPlugin.enabledEvasions.delete('media.codecs');
chromium.use(stealthPlugin);

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

const enterNameField = 'input[type="text"][aria-label="Your name"]';
const askToJoinButton = '//button[.//span[text()="Ask to join"]]';
const gotKickedDetector = '//button[.//span[text()="Return to home screen"]]';
const leaveButton = `//button[@aria-label="Leave call"]`
const peopleButton = `//button[@aria-label="People"]`
const onePersonRemainingField = '//span[.//div[text()="Contributors"]]//div[text()="1"]'

const randomDelay = (amount: number) => (2*Math.random() - 1) * (amount/10) + amount;  



export class MeetingBot {

    browserArgs: string[];
    meetingURL: string;
    readonly settings: { [key: string]: any }
    onEvent?: (eventType: EventCode, data?: any) => Promise<void>;

    // These properties are initialized in joinMeeting()
    browser!: Browser;
    page!: Page;
    recorder: PageVideoCapture | undefined;
    state: number = 0;
    state_message: string = '';

    kicked: boolean = false;
    

    //
    //
    //
    //
    constructor(meetingURL: string, botSettings: { [key: string]: any }, onEvent?: (eventType: EventCode, data?: any) => Promise<void>) {

        this.browserArgs = [
            '--incognito',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-infobars',
            "--use-fake-device-for-media-stream",
            "--use-fake-ui-for-media-stream",
            "--use-file-for-fake-video-capture=/dev/null",
            "--use-file-for-fake-audio-capture=/dev/null",
            ...(botSettings?.additionalBrowserSettings ?? [])
        ]

        this.settings = botSettings;
        this.meetingURL = meetingURL;
        this.onEvent = onEvent;
        // Set
        this.settings = botSettings; 
        this.meetingURL = meetingURL;

        // ...
        this.state = 0;
        this.state_message = 'Waiting for Setup';

        this.kicked = false;
    }

    // Send a Pulse to Server
    async sendHeartbeat () {

        // TODO: Replace with Send to Websocket connection
        console.log(this.state, this.state_message);

    }

    //
    //
    //
    //
    async joinMeeting() {

        // Launch the browser and open a new blank page
        this.browser = await chromium.launch({
            headless: false,
            args: this.browserArgs
        });

        // Unpack Dimensions
        const vp = this.settings.viewport || { width: 1280, height: 720 };

        // Create Browser Context
        const context = await this.browser.newContext({
            permissions: ['camera', 'microphone'],
            userAgent: userAgent,
            viewport: vp,
        });

        // Create Page, Go to
        this.page = await context.newPage();
        await this.page.waitForTimeout(randomDelay(1000));
        
        // Inject anti-detection code using addInitScript
        await this.page.addInitScript(() => {
            // Disable navigator.webdriver to avoid detection
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

            // Override navigator.plugins to simulate real plugins
            Object.defineProperty(navigator, 'plugins', { get: () => [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }] });

            // Override navigator.languages to simulate real languages
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

            // Override other properties
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 }); // Fake number of CPU cores
            Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }); // Fake memory size
            Object.defineProperty(window, 'innerWidth', { get: () => 1920 }); // Fake screen resolution
            Object.defineProperty(window, 'innerHeight', { get: () => 1080 });
            Object.defineProperty(window, 'outerWidth', { get: () => 1920 });
            Object.defineProperty(window, 'outerHeight', { get: () => 1080 });
        });
        
        await this.page.mouse.move(10, 672)
        await this.page.mouse.move(102, 872)
        await this.page.mouse.move(114, 1472)
        await this.page.waitForTimeout(300);
        await this.page.mouse.move(114, 100)
        await this.page.mouse.click(100, 100);

        await this.page.goto(this.meetingURL, { waitUntil: 'networkidle' });

        const name = this.settings.name || 'MeetingBot';

        console.log('Waiting for the input field to be visible...');
        await this.page.waitForSelector(enterNameField);

        console.log('Waiting for 1 seconds...');
        await this.page.waitForTimeout(randomDelay(1000));

        console.log('Filling the input field with the name...');
        await this.page.fill(enterNameField, name);

        console.log('Waiting for the "Ask to join" button...');
        await this.page.waitForSelector(askToJoinButton, { timeout: 60000 });

        console.log('Clicking the "Ask to join" button...');
        await this.page.click(askToJoinButton);

        //Should Exit after 1 Minute
        console.log('Awaiting Entry ....')
        await this.page.waitForSelector(leaveButton, { timeout: 60000 })

        console.log('Joined Call.')
        return 0;
    }

    async startRecording() {

        // Set Default Recording Options
        const recordingOptions: CaptureOptions = this.settings.recordingOptions ||
        {
            followPopups: true,
            fps: 25,
        }

        // Save the Recorder
        this.recorder = await saveVideo(this.page, this.settings.recordingPath, recordingOptions);
        return 0;
    }

    async stopRecording() {

        // Error case
        if (!this.recorder) {
            console.log('Cannot stop recording as recording has not been started.')
            return 1;
        }

        // Stop the Recording & Drop Reference
        await this.recorder.stop();
        this.recorder = undefined;

        return 0;
    }


    async meetingActions() {

        // Meeting Join Actions
        console.log('Clicking People Button...')
        await this.page.waitForSelector(peopleButton)
        await this.page.click(peopleButton);

        // Wait for the people panel to be visible
        await this.page.waitForSelector('[aria-label="Participants"]', { state: 'visible' });

        // Start Recording, Yes by default
        console.log('Starting Recording')
        if (this.settings.recordMeeting || true)
            this.startRecording();

        // Set up participant monitoring
        if (this.onEvent) {
            // Monitor for participants joining
            await this.page.exposeFunction('onParticipantJoin', async (participantId: string) => {
                if (this.onEvent) {
                    await this.onEvent('PARTICIPANT_JOIN', { participantId });
                }
            });

            // Monitor for participants leaving
            await this.page.exposeFunction('onParticipantLeave', async (participantId: string) => {
                if (this.onEvent) {
                    await this.onEvent('PARTICIPANT_LEAVE', { participantId });
                }
            });

            // Add mutation observer for participant list
            await this.page.evaluate(() => {
                const peopleList = document.querySelector('[aria-label="Participants"]');
                if (!peopleList) {
                    console.error('Could not find participants list element');
                    return;
                }
                console.log('Setting up mutation observer on participants list');
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach((node: any) => {
                                if (node.getAttribute && node.getAttribute('data-participant-id')) {
                                    console.log('Participant joined:', node.getAttribute('data-participant-id'));
                                    // @ts-ignore
                                    window.onParticipantJoin(node.getAttribute('data-participant-id'));
                                }
                            });
                            mutation.removedNodes.forEach((node: any) => {
                                if (node.getAttribute && node.getAttribute('data-participant-id')) {
                                    console.log('Participant left:', node.getAttribute('data-participant-id'));
                                    // @ts-ignore
                                    window.onParticipantLeave(node.getAttribute('data-participant-id'));
                                }
                            });
                        }
                    });
                });
                observer.observe(peopleList, { childList: true, subtree: true });
            });
        }

        // Loop -- check for end meeting conditions every second
        console.log('Waiting until a leave condition is fulfilled..')
        while (true) {

            // Check if it's only me in the meeting
            if (await this.page.locator(onePersonRemainingField).count() > 0) break;
            
            // Got kicked
            if (await this.page.locator(gotKickedDetector).count() > 0) {
                this.kicked = true;
                console.log('Kicked');
                break;
            }
            
            // Reset Loop
            await setTimeout(1000); //1 second loop
        }
    

        // Exit
        console.log('Starting End Life Actions ...')
        await this.leaveMeeting();
        return 0;
    }


    async leaveMeeting() {

        // Ensure Recording is done
        console.log('Stopping Recording ...')
        await this.stopRecording();
        console.log('Done.')

        // Try and Find the leave button, press. Otherwise, just delete the browser.
        if (await this.page.locator(leaveButton).count() > 0) {
            console.log("Trying to leave the call ...")
            await this.page.click(leaveButton);
            console.log('Left Call.')
        }

        await this.browser.close();
        console.log('Closed Browser.')

        return 0;
    }
}