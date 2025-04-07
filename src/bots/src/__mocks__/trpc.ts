import { jest } from '@jest/globals';
console.log('Mocking trpc.ts');

export const trpc = {
    transformer: jest.fn(() => {}),
    links: [
        {
            url: jest.fn(() => {return 'http://localhost:3001/api/trpc'}),
        }
    ],
    bots: {
        heartbeat: {
            mutate: jest.fn(() => {
                console.log("Mock heartbeat mutate called");
                return new Promise((resolve) => {
                    resolve({});
                });
            }),
        },
        reportEvent: {
            mutate: jest.fn(() => {
                console.log("Mock reportEvent mutate called");
                return new Promise((resolve) => {
                    resolve({});
                });
            })
        },
        updateBotStatus: {
            mutate: jest.fn(() => {
                console.log("Mock reportEvent mutate called");
                return new Promise((resolve) => {
                    resolve({});
                });
            })
        }
    }
};