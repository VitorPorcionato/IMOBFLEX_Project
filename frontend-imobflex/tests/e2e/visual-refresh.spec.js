import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("theme persists through navigation and reload with keyboard access", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Modo escuro", exact: true });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("link", { name: "Explorar imóveis", exact: true })
    .click();
  await expect(page).toHaveURL(/\/imoveis$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Um lugar",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Modo escuro", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const themeCookie = (await page.context().cookies()).find(
    (c) => c.name === "imobflex-theme",
  );
  expect(themeCookie.value).toBe("light");
});

test("home and catalog are accessible in both themes at phone and desktop widths", async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page
        .context()
        .addCookies([
          {
            name: "imobflex-theme",
            value: theme,
            domain: "localhost",
            path: "/",
          },
        ]);
      for (const path of ["/", "/imoveis", "/login", "/privacidade"]) {
        await page.goto(path, { waitUntil: "networkidle" });
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        ).toEqual([]);
      }
    }
  }
});

test("reduced motion disables card animation and city shortcuts filter the catalog", async ({
  page,
  request,
}) => {
  const catalog = await request.get("/api/v1/public/properties");
  test.skip(
    !catalog.ok() || !(await catalog.json()).items?.length,
    "Requires the seeded backend catalog",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const card = page.locator(".property-card").first();
  await expect(card).toBeVisible();
  await card.hover();
  expect(await card.evaluate((el) => getComputedStyle(el).transform)).toBe(
    "none",
  );
  expect(
    await card
      .locator("img")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await page.locator(".region-card").filter({ hasText: "Campinas" }).click();
  await expect(page).toHaveURL(/q=Campinas/);
  await expect(page.locator(".property-card").first()).toContainText(
    "Campinas",
  );
});

test("phone filters open on demand and retain the selected location", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/imoveis");
  const filters = page.locator(".mobile-filter");
  await expect(filters).not.toHaveAttribute("open");
  await page.getByText("Filtrar imóveis", { exact: true }).click();
  await page.getByLabel("Localização", { exact: true }).fill("Campinas");
  await page
    .getByRole("button", { name: "Aplicar filtros", exact: true })
    .click();
  await expect(page).toHaveURL(/q=Campinas/);
  await expect(page.getByLabel("Localização", { exact: true })).toHaveValue(
    "Campinas",
  );
});
