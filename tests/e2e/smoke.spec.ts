import { expect, test } from "@playwright/test";

test("landing page renders and switches interface direction", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /Ofuqi|أُفُقي/ })).toBeVisible();

  const localeGroup = page.getByRole("group", { name: /Language|اللغة/i }).first();
  await localeGroup.getByRole("button", { name: "AR" }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1, name: /أُفُقي/ })).toBeVisible();
});

test("protected routes redirect unauthenticated users to sign-in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1, name: /Welcome back|أهلا بعودتك/i })).toBeVisible();
  await expect(page.getByLabel(/Email|البريد/i)).toBeVisible();
});
