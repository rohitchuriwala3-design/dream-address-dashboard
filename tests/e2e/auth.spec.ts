import { test, expect } from "@playwright/test";

// These tests must run WITHOUT stored auth state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  test("shows the admin-provisioned email and password sign-in form", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Sign in to Nexus 360" })).toBeVisible();
    await expect(page.getByLabel("Work email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText(/account created by your administrator/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up|create account/i })).toHaveCount(0);
  });

  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("rejects public account creation", async ({ request }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Unapproved Signup",
        email: "unapproved@example.test",
        password: "test-password-that-is-never-used",
      },
    });
    expect(response.ok()).toBeFalsy();
  });
});
