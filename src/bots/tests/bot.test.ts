import { createBot, Bot } from "../src/bot";
import { MeetsBot } from "../meet/src/bot";
import { BotConfig } from "../src/types";
import { ZoomBot } from "../zoom/src/bot";
import { TeamsBot } from "../teams/src/bot";


// 
// Bot Creation Tests as described in Section 2.1.2.1
// Of our System Verification and Validation Document.
// 

describe('Bot Creation from given data', () => {

    /**
     * Create a meets bot
     */
    it("Create Meets Bot", () => {

        const mockBotData = {
            id: 0,
            meetingInfo: {
                platform: "google",
            },
        } as BotConfig;

        createBot(mockBotData).then((bot: Bot) => {
            expect(bot).toBeInstanceOf(MeetsBot);
        });
    });

    /**
     * Creates a Zoom Bot
     */
    it("Create Zoom Bot", () => {

        const mockBotData = {
            id: 0,
            meetingInfo: {
                platform: "zoom",
            },
        } as BotConfig;

        createBot(mockBotData).then((bot: Bot) => {
            expect(bot).toBeInstanceOf(ZoomBot);
        });
    });

    /**
     * Creates a teams bot
     */
    it("Create Teams Bot", () => {

        const mockBotData = {
            id: 0,
            meetingInfo: {
                platform: "teams",
            },
        } as BotConfig;

        createBot(mockBotData).then((bot: Bot) => {
            expect(bot).toBeInstanceOf(TeamsBot);
        });
    });

});

describe('Bot fails creation from invalid data', () => {

    /**
     * Create a bot with invalid data
     */
    it("Create Bot with invalid data (empty meetingInfo)", async () => {

        const mockBotData = {
            id: 0,
            meetingInfo: {},
        } as BotConfig;


        await expect(async () => {
            await createBot(mockBotData);
        }).rejects.toThrow();
    });

    it("Create Bot with invalid data (missing meetingInfo)", async () => {

        const mockBotData = {
            id: 0
        } as BotConfig;

        await expect(async () => {
            await createBot(mockBotData);
        }).rejects.toThrow();
    });

    /**
     * Create a bot with invalid data
     */
    it("Create Bot with invalid data (no platform, but some other data)", async () => {

        const mockBotData = {
            id: 0,
            meetingInfo: {
                meetingUrl: "https://example.com",
            },
        } as BotConfig;


        await expect(async () => {
            await createBot(mockBotData);
        }).rejects.toThrow();
    });

});