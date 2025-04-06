import { jest } from '@jest/globals';

// Log reading in a file -- pass back empty file content
const readFileSync = jest.fn((path: string) => {
    console.log('Mocking Reading In a file:', path);
    return Buffer.from('some-file-content');
});

// Mock Async promises
const promises = {

    // Override the unlink method to log the path being unlinked
    unlink: jest.fn(async (path: string) => {
        console.log('Mocking Unlinking a file:', path);
        return Promise.resolve();
    }),
};

export { readFileSync, promises };