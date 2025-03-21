import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("Landing Page", () => {
  test("should display correct heading", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Meeting Bot");
  });

  test("should display docs link", async ({ page }) => {
    await expect(page.getByLabel("Main").getByRole("list")).toContainText(
      "Docs",
    );
  });

  test("should display community link", async ({ page }) => {
    await expect(page.getByRole("main")).toContainText("Join Community");
  });

  test("can navigate to API docs", async ({ page }) => {
    await page.getByRole("link", { name: "View Documentation" }).click();
    await expect(page.locator("h2")).toContainText("MeetingBot API");
  });

  test("should display sign in button ", async ({ page }) => {
    await expect(page.locator("body")).toContainText("Sign In");
  });
});
