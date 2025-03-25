// Mock Puppeteer-stream (called in ../zoom/src/bot.ts)
const puppeteerStreamMock = {
    launch: jest.fn(() => ({
        defaultBrowserContext: jest.fn(() => ({
            clearPermissionOverrides: jest.fn(),
            overridePermissions: jest.fn(),
        })),
        newPage: jest.fn(() => ({
            goto: jest.fn(),
            waitForSelector: jest.fn(() => ({
                contentFrame: jest.fn(() => ({
                    waitForSelector: jest.fn(),
                    click: jest.fn(),
                    type: jest.fn(),
                })),
            })),
        })),
    })),
    getStream: jest.fn(() => ({
        pipe: jest.fn(),
        destroy: jest.fn(),
    })),
    wss: jest.fn(() => ({
        close: jest.fn(),
    })),
};

export default puppeteerStreamMock;