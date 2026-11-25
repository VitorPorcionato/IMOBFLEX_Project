import { test, expect } from "@playwright/test";
const homeLink = (page) =>
  page.getByRole("link", { name: "Voltar para a home", exact: true });

test("home has no back arrow; all other public pages return directly home", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await expect(homeLink(page)).toHaveCount(0);
  for (const path of [
    "/sobre",
    "/contato",
    "/imoveis?purpose=SALE&q=Campinas",
    "/login",
    "/cadastro",
    "/privacidade",
    "/central-privacidade",
  ]) {
    await page.goto(path);
    await expect(homeLink(page)).toHaveAttribute("href", "/");
    await homeLink(page).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(homeLink(page)).toHaveCount(0);
  }
});

test("return home works by keyboard regardless of the previous page", async ({
  page,
}) => {
  await page.goto("/sobre");
  await page.goto("/contato");
  await homeLink(page).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await expect(homeLink(page)).toHaveCount(0);
});

test("assistant sits beside WhatsApp and the open panel stays inside the screen", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const width of [320, 390, 768, 1025, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(homeLink(page)).toBeVisible();
    const home = await homeLink(page).boundingBox();
    expect(home.width).toBeGreaterThanOrEqual(44);
    expect(home.height).toBeGreaterThanOrEqual(44);
    const launcher = page.getByRole("button", {
      name: "Abrir assistente Imobflex",
      exact: true,
    });
    const chat = await launcher.boundingBox();
    const whatsapp = await page.locator(".whatsapp-float").boundingBox();
    expect(chat.x + chat.width + 8).toBeLessThanOrEqual(whatsapp.x);
    expect(
      Math.abs(chat.y + chat.height / 2 - whatsapp.y - whatsapp.height / 2),
    ).toBeLessThanOrEqual(2);
    await launcher.click();
    const panel = await page
      .getByRole("dialog", { name: "Assistente Imobflex" })
      .boundingBox();
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(width);
    expect(panel.y).toBeGreaterThanOrEqual(0);
    expect(panel.y + panel.height).toBeLessThanOrEqual(chat.y - 8);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
  }
});
