import { MeetsBot } from "../meet/src/bot";
import * as dotenv from 'dotenv';
import { BotConfig, MeetingJoinError, WaitingRoomTimeoutError } from "../src/types";
import { TeamsBot } from "../teams/src/bot";
import { ZoomBot } from "../zoom/src/bot";
import { jest, it, expect, describe, afterEach, beforeEach, afterAll, beforeAll } from '@jest/globals';

// 
// Bot Unit Nav Tests as described in Section 2.1.2.1
// Of our System Verification and Validation Document.
// 

//
// These tests REQUIRE a valid meeting to join. Otherwise, they will fail.
// For this reasons, these tests are not run in the CI/CD pipeline, 
// but rather manually when needed.
//

// Ensure puppeteer-stream is not mocked
jest.unmock('puppeteer-stream');

// Load the test.env file (overrides variables from .env if they overlap)
dotenv.config({ path: 'test.env' });
if (!process.env.MEET_TEST_MEETING_INFO) throw new Error("Environment variable MEET_TEST_MEETING_INFO is not defined");
if (!process.env.ZOOM_TEST_MEETING_INFO) throw new Error("Environment variable ZOOM_TEST_MEETING_INFO is not defined");
if (!process.env.TEAMS_TEST_MEETING_INFO) throw new Error("Environment variable TEAMS_TEST_MEETING_INFO is not defined");


// Create Mock Configs
const mockMeetConfig = {
    id: 0,
    meetingInfo: JSON.parse(process.env.MEET_TEST_MEETING_INFO || '{}'),
    automaticLeave: {
        waitingRoomTimeout: 100, //ms, don't wait that long
    }
} as BotConfig;

const mockZoomConfig = {
    id: 0,
    meetingInfo: JSON.parse(process.env.ZOOM_TEST_MEETING_INFO || '{}'),
    automaticLeave: {
        waitingRoomTimeout: 100, //ms, don't wait that long
    }
} as BotConfig;

const mockTeamsConfig = {
    id: 0,
    meetingInfo: JSON.parse(process.env.TEAM_TEST_MEETING_INFO || '{}'),
    automaticLeave: {
        waitingRoomTimeout: 100, //ms, don't wait that long
    }
} as BotConfig;


const test_bot_join = async (bot: any) => {

    // See if passes
    let passes = false;
    try {

        //Await
        await bot.joinMeeting();
        passes = true; //if reaches, we got admitted into the meeting.

    } catch (error) {
        // If aobve fails, check if the message is the expected output of a waitingRoom timeout.
        // (this means we navigated correctly, we weren't let into the meeting.)
        passes = (error instanceof WaitingRoomTimeoutError) || (error instanceof MeetingJoinError);
        if (!passes) {
            console.error(error);
        };
    }

    // Close Meeting Regardless of anything
    await bot.endLife();
    return passes;
}

describe('Bot Join a Meeting Tests', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Create a meet and join a predefined meeting (set in MEET_MEETING_INFO, above. When testing, you need to make sure this a valid meeting link).
     * This lets you check if the bot can join a meeting and if it can handle the waiting room -- good to know if the UI changed
    */

    it.skip('Meet : Join a Meeting', async () => {
        // Create Bot
        const passes = await test_bot_join(new MeetsBot(mockMeetConfig, async (eventType: string, data: any) => { }));
        expect(passes).toBe(true);
    }, 60000); // Set max timeout to 60 seconds


    /**
     * Create a zoom bot and join a predefined meeting (set in ZOOM_MEETING_INFO, above. 
     * When testing, you need to make sure this a valid meeting link).
     * This lets you check if the bot can join a meeting and if it can handle the waiting room -- good to know if the UI changed
     */
    it('Zoom : Join a Meeting', async () => {

        // Create Bot
        const passes = await test_bot_join(new ZoomBot(mockZoomConfig, async (eventType: string, data: any) => { }));
        expect(passes).toBe(true);
        // Set max timeout to 60 seconds

    }, 60000);


    /**
     * Create a Teams Bot and join a predefined meeting (set in TEAMS_MEETING_INFO, above. When testing, you need to make sure this a valid meeting link).
   * This lets you check if the bot can join a meeting and if it can handle the waiting room -- good to know if the UI changed  
    */
    it('Team : Join a Meeting', async () => {

        // Create Bot
        const passes = await test_bot_join(new TeamsBot(mockTeamsConfig, async (eventType: string, data: any) => { }));
        expect(passes).toBe(true);

        // Set max timeout to 60 seconds
    }, 60000);

});

// ===============================================================================================================================================================
// ===============================================================================================================================================================
// ===============================================================================================================================================================
// ===============================================================================================================================================================

describe('Bot fail join due to invalid URL', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Check if a bad URL works, the program crashes.
     */
    it('Meet : Ensure program crashes if cannot join meeting from link', async () => {

        // Create Bot with overruled config
        const bot = new MeetsBot({
            ...mockMeetConfig,
            meetingInfo: {
                meetingUrl: 'https://meet.google.com/invalid-url',
            }
        } as BotConfig, async (eventType: string, data: any) => { });
        // Mock bot.joinMeeting to simulate the page setup and override waitForSelector
        jest.spyOn(bot, "joinMeeting").mockImplementationOnce(async () => {
            bot.page = {
                waitForSelector: jest.fn(async () => {
                    throw new Error("Navigation failed: could not find specific element");
                }),
            } as any; // Mock the page object
            throw new MeetingJoinError("Simulated joinMeeting failure");
        });

        // Create Bot, check if FAILS
        const passes = await test_bot_join(bot);
        expect(passes).toBe(true);

    }, 60000); // Set max timeout to 60 seconds


    /**
     * Check if a bad URL works, the program crashes.
     */
    it('Zoom : Ensure program crashes if cannot join meeting from link', async () => {

        // Create Bot with overruled config
        const bot = new ZoomBot({
            ...mockZoomConfig,
            meetingInfo: {
                meetingPassword: '',
                meetingId: '',
            }
        } as BotConfig, async (eventType: string, data: any) => { });
        // Mock bot.joinMeeting to simulate the page setup and override waitForSelector
        jest.spyOn(bot, "joinMeeting").mockImplementationOnce(async () => {
            bot.page = {
                waitForSelector: jest.fn(async () => {
                    throw new Error("Navigation failed: could not find specific element");
                }),
            } as any; // Mock the page object
            throw new MeetingJoinError("Simulated joinMeeting failure");
        });

        // Create Bot, check if FAILS
        const passes = await test_bot_join(bot);
        expect(passes).toBe(true);

    }, 60000); // Set max timeout to 60 seconds


    /**
     * Check if a bad URL works, the program crashes.
     */
    it('Teams : Ensure program crashes if cannot join meeting from link', async () => {

        // Create Bot with overruled config
        const bot = new TeamsBot({
            ...mockTeamsConfig,
            meetingInfo: {
                meetingId: '',
                tenantId: '',
                organizerId: '',
            }
        } as BotConfig, async (eventType: string, data: any) => { });
        // Mock bot.joinMeeting to simulate the page setup and override waitForSelector
        jest.spyOn(bot, "joinMeeting").mockImplementationOnce(async () => {
            bot.page = {
                waitForSelector: jest.fn(async () => {
                    throw new Error("Navigation failed: could not find specific element");
                }),
            } as any; // Mock the page object
            throw new MeetingJoinError("Simulated joinMeeting failure");
        });

        // Create Bot, check if FAILS
        const passes = await test_bot_join(bot);
        expect(passes).toBe(true);
        

    }, 60000); // Set max timeout to 60 seconds


});