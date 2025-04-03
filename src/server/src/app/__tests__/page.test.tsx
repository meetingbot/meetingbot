// Mock the auth and API modules
jest.mock("../../server/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("../../trpc/server", () => ({
  api: {
    apiKeys: {
      getApiKeyCount: {
        prefetch: jest.fn(),
      },
    },
  },
}));

// Mock the Dashboard and WelcomeDashboard components
jest.mock("../components/Dashboard", () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard">Dashboard Component</div>,
}));

jest.mock("../components/WelcomeDashboard", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="welcome-dashboard">Welcome Dashboard Component</div>
  ),
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../page";
import { auth } from "../../server/auth";
import { api } from "../../trpc/server";

// Clear mock data before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("Home", () => {
  it("If the user has not yet created an API key, they will see the Welcome Dashboard", async () => {
    // ARRANGE
    // Mock auth to return null (not logged in)
    // @ts-expect-error - We're mocking the auth function for testing
    jest.mocked(auth).mockResolvedValue(null);

    // Mock the API prefetch
    jest
      .mocked(api.apiKeys.getApiKeyCount.prefetch)
      .mockResolvedValue(undefined);

    // ACT
    render(await Home());

    // ASSERT
    expect(screen.getByTestId("welcome-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });
});
