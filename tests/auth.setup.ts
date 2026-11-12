import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@nextcrm.app";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "test-e2e-password-only";

setup("authenticate", async ({ page, context }) => {
  const response = await context.request.post("/api/auth/sign-in/email", {
    data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto("/en");
  await page.waitForURL(
    (url) => /^\/(en|cs|de|uk)(\/|$)/.test(url.pathname) && !url.pathname.includes("sign-in"),
    { timeout: 15000 }
  );
  await context.storageState({ path: authFile });
});
