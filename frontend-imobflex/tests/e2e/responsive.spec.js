import { test, expect } from "@playwright/test";
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "imobflex_privacy",
      value: encodeURIComponent(
        JSON.stringify({
          version: 1,
          optional: false,
          expires: Date.now() + 86400000,
        }),
      ),
      domain: "127.0.0.1",
      path: "/",
    },
    {
      name: "imobflex_privacy",
      value: encodeURIComponent(
        JSON.stringify({
          version: 1,
          optional: false,
          expires: Date.now() + 86400000,
        }),
      ),
      domain: "localhost",
      path: "/",
    },
  ]);
});

test("brand, menu, WhatsApp and layout across breakpoint boundaries", async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const width of [320, 390, 640, 641, 768, 1024, 1025, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/imoveis", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/Imobflex/);
    await expect(page.locator(".brand")).toContainText("Imobflex");
    const chat = page.getByRole("link", {
      name: "Falar pelo WhatsApp",
      exact: true,
    });
    await expect(chat).toBeVisible();
    await expect(chat).toHaveAttribute("target", "_blank");
    await expect(chat).toHaveAttribute("rel", "noopener noreferrer");
    const href = new URL(await chat.getAttribute("href"));
    expect(href.pathname).toBe("/5511976086540");
    expect(href.searchParams.get("text")).toBe(
      "Olá! Gostaria de mais informações sobre os imóveis da Imobflex.",
    );
    const box = await chat.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const columns = await page
      .locator(".properties")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
    expect(columns).toBe(width <= 640 ? 1 : width <= 1024 ? 2 : 3);
    if (width <= 1024) {
      const toggle = page.getByRole("button", { name: "Abrir menu" });
      await toggle.click();
      await expect(
        page.getByRole("navigation", { name: "Navegação móvel" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await toggle.click();
      await page
        .getByRole("navigation", { name: "Navegação móvel" })
        .getByRole("link", { name: "A imobiliária" })
        .click();
      await expect(page).toHaveURL(/sobre/);
      await expect(
        page.getByRole("button", { name: "Abrir menu" }),
      ).toHaveAttribute("aria-expanded", "false");
    }
  }
});

test("public pages fit a narrow phone and images load", async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 320, height: 780 });
  const paths = ["/", "/sobre", "/cadastro", "/login", "/privacidade"];
  const catalog = await request.get("/api/v1/public/properties");
  if (catalog.ok()) {
    const { items } = await catalog.json();
    if (items.length) paths.push(`/imoveis/${items[0].id}`);
  }
  for (const path of paths) {
    await page.goto(path, { waitUntil: "networkidle" });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("link", { name: "Falar pelo WhatsApp", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveJSProperty("complete", true);
      expect(await img.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0);
    }
  }
});
