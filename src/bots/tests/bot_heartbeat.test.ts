import { MeetsBot } from "../meet/src/bot";
import * as dotenv from 'dotenv';
import { BotConfig } from "../src/types";
import { TeamsBot } from "../teams/src/bot";
import { ZoomBot } from "../zoom/src/bot";
import { beforeAll, beforeEach, afterEach, afterAll, jest, describe, expect, it } from '@jest/globals';
import exp from "constants";

// Use the Mocked TRPC
jest.mock('../src/trpc');

// Excplicit mock build-in module required for jest to work with process
jest.mock('process');

import { startHeartbeat } from "../src/monitoring";
import { trpc } from "../src/trpc";
import { uploadRecordingToS3 } from "../src/s3";

// 
// Bot Exiit Tests as described in Section 2.1.2.6
// Of our System Verification and Validation Document.
// 

// Keep reference
const mockBot = {
    run: jest.fn(() => {
        console.log("Mock bot run called");
        return new Promise((resolve) => {
            resolve({});
        });
    }),
    getSpeakerTimeframes: jest.fn(() => {
        console.log("Mock bot getSpeakerTimeframes called");
        return [];
    }),
    endLife: jest.fn(() => {
        console.log("Mock bot endLife called");
        return new Promise((resolve) => {
            resolve({});
        });
    }),
    screenshot: jest.fn(() => {
        console.log("Mock bot screenshot called");
        return new Promise((resolve) => {
            resolve({});
        });
    }),

};

// One time mocks
jest.mock("../src/bot", () => ({
    createBot: jest.fn(() => {

        console.log("Mock createBot called, passing back mock object");
        return mockBot;
    }),
}));

jest.mock('../src/s3', () => ({
    createS3Client: jest.fn(() => {
        console.log("Mock createS3Client called");
        return {}
    }),
    uploadRecordingToS3: jest.fn((s3, bot) => {
        console.log("Mock uploadRecordingToS3 called");
        return new Promise((resolve) => {
            resolve({});
        });
    }),
}));

describe('Heartbeat Tests', () => {

    let controller: AbortController;
    let botId = -1;

    beforeEach(() => {
        controller = new AbortController();
    })

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test (incl. counters)
    })

    it('Start and Stop Heartbeat 1000ms', async () => {

        // 1 second
        const testInterval = 1000;

        // Start the heartbeat
        startHeartbeat(botId, controller.signal, testInterval);

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

        // Stop the heartbeat
        controller.abort();

        expect(controller.signal.aborted).toBe(true); // Check if the signal is aborted
        expect(trpc.bots.heartbeat.mutate).toHaveBeenCalledTimes(5); // Check if trpc was called    }, 10000); // 10 seconds to allow for the heartbeat to run
    }, 10000); // 10 seconds to allow for the heartbeat to run

    it('Start and Stop Heartbeat 5000ms', async () => {

        // 1 second
        const testInterval = 5000;

        // Start the heartbeat
        startHeartbeat(botId, controller.signal, testInterval);

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

        // Stop the heartbeat
        controller.abort();

        expect(controller.signal.aborted).toBe(true); // Check if the signal is aborted
        expect(trpc.bots.heartbeat.mutate).toHaveBeenCalledTimes(1); // Check if trpc was called

    }, 10000); // 10 seconds to allow for the heartbeat to run
});

describe('Main function tests', () => {

    let exitCode: string | number | null | undefined = undefined;

    beforeEach(() => {
        // Mock environment variables
        process.env.BOT_DATA = JSON.stringify({
            id: 123,
            platform: "mock-platform",
            heartbeatInterval: 200,
        });
        process.env.AWS_BUCKET_NAME = "mock-bucket";
        process.env.AWS_REGION = "mock-region";
        process.env.AWS_ACCESS_KEY_ID = "mock-access-key";
        process.env.AWS_SECRET_ACCESS_KEY = "mock-secret-key";

        exitCode = undefined;
    });

    afterEach(() => {
        // Restore the original process.exit implementation
        jest.clearAllMocks();
        exitCode = undefined;
    });


    it('Test Main Function Heartbeat Starts and Stops', async () => {

        const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
            console.log('Setting exitCode', code);
            exitCode = code;
            console.log(`Mock process.exit called with code "${code}"`);
            return undefined as never; // You need as never so the test can complete -- otherwise jest short circuts.
        });

        // Test Main
        const { main } = await import('../src/index');
        await main();

        expect(mockExit).toHaveBeenCalledWith(0);
        expect(exitCode).toBe(0); // Check if exit code is 0
        expect(trpc.bots.heartbeat.mutate).toHaveBeenCalled(); // Check if trpc was called
        expect(trpc.bots.reportEvent.mutate).toHaveBeenCalled(); // Check if trpc was called

        expect(mockBot.run).toHaveBeenCalled();
        expect(uploadRecordingToS3).toHaveBeenCalled(); // Check if uploadRecordingToS3 was called
        

    }, 10000); // 10 seconds to allow for the heartbeat to run

});