import { expect, test } from "@playwright/test";

test("landing page renders and switches interface direction", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /Build the CV|اصنع/i })).toBeVisible();

  const localeGroup = page.locator("header").getByRole("group", { name: /Language|اللغة/i });
  await localeGroup.getByRole("button", { name: "AR" }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1, name: /اصنع/i })).toBeVisible();
});

test("protected routes redirect unauthenticated users to sign-in", async ({ page }) => {
  for (const route of ["/dashboard", "/chat/new"]) {
    await page.goto(route);

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { level: 1, name: /Access|دخول|الاستوديو/i })).toBeVisible();
    await expect(page.getByLabel(/Email|البريد/i)).toBeVisible();
  }
});
