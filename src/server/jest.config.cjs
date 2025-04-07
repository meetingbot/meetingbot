const { default: nextJest } = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    // Tell Jest to ignore node_modules except for specific packages that use ES modules
    "node_modules/(?!(@testcontainers|testcontainers|yaml|docker-compose|postgres-js)/)",
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx", ".mts"],
  transform: {
    "^.+\\.(ts|tsx|mts)$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
