import { test, expect } from "@playwright/test";

test.describe("IntelliGrid AI — Control Centre End-to-End Workflows", () => {
  test("renders control centre sign in page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Control centre sign in")).toBeVisible();
    await expect(page.getByText("Select Authorized Personnel Profile")).toBeVisible();
  });

  test("rejects empty password login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Enter control centre" }).click();
    await expect(page.getByText("Please enter your account passphrase.")).toBeVisible();
  });
});
