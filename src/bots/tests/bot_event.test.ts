


import { MeetsBot } from "../meet/src/bot";
import * as dotenv from 'dotenv';
import { BotConfig } from "../src/types";
import { TeamsBot } from "../teams/src/bot";
import { ZoomBot } from "../zoom/src/bot";
import { beforeAll, beforeEach, afterEach, afterAll, jest, describe, expect, it } from '@jest/globals';
import exp from "constants";

// 
// Bot Exiit Tests as described in Section 2.1.2.5
// Of our System Verification and Validation Document.
// 


// Create Mock Configs
dotenv.config({ path: 'test.env' });

describe('Meet Event Tests', () => {

    let bot: MeetsBot;
    let addParticipant: () => Promise<void>;
    let removeParticipant: () => Promise<void>;

    // Create the bot for each
    beforeEach(async () => {

        // Create Mock Configs
        const mockMeetConfig = {
            id: 0,
            meetingInfo: JSON.parse(process.env.MEET_TEST_MEETING_INFO || '{}'),
            automaticLeave: {
                // automaticLeave: null, //Not included to see what happens on a bad config
            }
        } as BotConfig;

        // Create Bot
        bot = new MeetsBot(mockMeetConfig, async (eventType: string, data: any) => { });

        // Mock Bot Recording -- never actually record
        jest.spyOn(bot, "startRecording").mockImplementation(async () => {
            console.log("Mock startRecording called");
        });
        jest.spyOn(bot, "stopRecording").mockImplementation(async () => {
            console.log("Mock stopRecording called");
            return 0;
        });
        jest.spyOn(bot, "leaveMeeting").mockImplementation(async () => {
            console.log("Mock leaveMeeting called");
            return 0; // don't actually leave any meeting
        });

        // Keep track
        jest.spyOn(bot, 'endLife');

        // Kicked right away.
        jest.spyOn(bot, 'checkKicked').mockImplementation(async () => {
            console.log("Mock checkKicked called");
            return true;
        });


        // Launch a browser, don't go to any page 
        await bot.launchBrowser();

        // Replace implementation of page functions (we don't care about navigation)
        jest.spyOn(bot.page, 'waitForSelector').mockImplementation(async (selector: string) => {
            console.log(`Mock waitForSelector called with selector: ${selector}`);
            return Promise.resolve({} as any); // Mock the resolved value
        });
        jest.spyOn(bot.page, 'click').mockImplementation(async () => {
            return Promise.resolve({} as any); // Mock the resolved value
        });

        // Set a DOM so bot can detect a person joining
        await bot.page.setContent(`<div aria-label="Participants">
            <!-- Initial participants -->
        </div>`);

        // Functions
        addParticipant = async () => {
            // Simulate a participant joining
            await bot.page.evaluate(() => {
                const peopleList = document.querySelector('[aria-label="Participants"]');
                const participant = document.createElement("div");
                participant.setAttribute("data-participant-id", `participant-${peopleList?.childNodes.length ?? 0}`);
                peopleList?.appendChild(participant);
            });
            await bot.page.waitForTimeout(30);
        }

        removeParticipant = async () => {
            // Simulate a participant leaving
            await bot.page.evaluate(() => {
                const peopleList = document.querySelector('[aria-label="Participants"]');
                const participant = peopleList?.querySelector(`[data-participant-id="participant-${(peopleList?.childNodes.length ?? 1) -1}"]`);
                participant?.remove();
            });
            await bot.page.waitForTimeout(30);
        }

    })

    // Cleanup
    afterEach(async () => {

        // ensure the bot is closed after each test
        await bot.endLife();

        // Remove mocks
        jest.clearAllMocks();
    });

    /**
     * Check if a bot can detect a person joining
     */
    it("Detect a Person Joining", async () => {

        // Setup Functions. Bot will get kicked rightaway.
        await bot.meetingActions();

        await addParticipant(); // Add first participant
        
        // Verify participant count after participants join
        expect(bot.participantCount).toBe(1);
        
        await addParticipant(); // Add next
        expect(bot.participantCount).toBe(2);

        await addParticipant(); // Add next
        await addParticipant(); // Add next
        await addParticipant(); // Add next
        expect(bot.participantCount).toBe(5);

    }, 60000);

    
    /**
     * Check if a bot can detect a person joining
     */
    it("Detect a Person Leaving", async () => {

        // Setup Functions. Bot will get kicked rightaway.
        await bot.meetingActions();

        await addParticipant(); // Add first participant
        await addParticipant();
        await addParticipant(); 
        
        // Verify participant count after participants join
        expect(bot.participantCount).toBe(3);
        
        // See if can detect removing
        await removeParticipant(); 
        expect(bot.participantCount).toBe(2);
        
        await removeParticipant();
        expect(bot.participantCount).toBe(1);

    }, 60000);

    it.skip('Detect a Participant Media Share Start', () => {
        // No functionality yet.
    })

    it.skip('Detect a Participant Media Share Stop', () => {
        // No functionality yet.
    })

});


// ===============================================================================================================================================================
// ===============================================================================================================================================================
// ===============================================================================================================================================================
// ===============================================================================================================================================================

describe('Zoom Event Tests', () => {
    let bot: ZoomBot;
    let addParticipant: () => Promise<void>;
    let removeParticipant: () => Promise<void>;

    // Create the bot for each
    beforeEach(async () => {

        // Create a Zoom Bot
        bot = new ZoomBot({
            id: 0,
            meetingInfo: JSON.parse(process.env.ZOOM_TEST_MEETING_INFO || '{}'),
            automaticLeave: {
                // automaticLeave: null, //Not included to see what happens on a bad config
            },
        } as BotConfig, async (eventType: string, data: any) => { });

        // Mock

        // Functions
        addParticipant = async () => {};
        removeParticipant = async () => {};
    });

    afterEach(async () => {
        // ensure the bot is closed after each test
        await bot.endLife();

        // Remove mocks
        jest.clearAllMocks();
    });

    it.skip("Detect a Person Joining", async () => {
        // Empty, no functionality yet.
    });
    
    it.skip("Detect a Person Leaving", async () => {
        // Empty, no functionality yet.
    });

    
    it.skip('Detect a Participant Media Share Start', () => {
        // No functionality yet.
    })

    it.skip('Detect a Participant Media Share Stop', () => {
        // No functionality yet.
    })

});

// ===============================================================================================================================================================
// ===============================================================================================================================================================
// ===============================================================================================================================================================
// ===============================================================================================================================================================

describe('Teams Event Tests', () => {
    let bot: TeamsBot;
    let addParticipant: () => Promise<void>;
    let removeParticipant: () => Promise<void>;

    // Create the bot for each
    beforeEach(async () => {

        // Create a Zoom Bot
        bot = new TeamsBot({
            id: 0,
            meetingInfo: JSON.parse(process.env.TEAMS_TEST_MEETING_INFO || '{}'),
            automaticLeave: {
                // automaticLeave: null, //Not included to see what happens on a bad config
            },
        } as BotConfig, async (eventType: string, data: any) => { });

        // Mock

        // Functions
        addParticipant = async () => {};
        removeParticipant = async () => {};
    });

    afterEach(async () => {
        // ensure the bot is closed after each test
        await bot.endLife();

        // Remove mocks
        jest.clearAllMocks();
    });

    it.skip("Detect a Person Joining", async () => {
        // Empty, no functionality yet.
    });
    
    it.skip("Detect a Person Leaving", async () => {
        // Empty, no functionality yet.
    });

    it.skip('Detect a Participant Media Share Start', () => {
        // No functionality yet.
    })

    it.skip('Detect a Participant Media Share Stop', () => {
        // No functionality yet.
    })

});