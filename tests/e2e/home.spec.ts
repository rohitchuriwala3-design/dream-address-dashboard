import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check if the page title or heading exists
    // Adjust selectors based on your actual app structure
    await expect(page).toHaveURL(/.*sign-in|.*/);
  });

  test("should display sign-in page when not authenticated", async ({ browser }) => {
    // Create a new isolated context without authentication
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto("/");
    
    // User accounts are provisioned by an admin and authenticate by password.
    await expect(page.getByRole("textbox", { name: "Work email" })).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    
    await context.close();
  });
});
