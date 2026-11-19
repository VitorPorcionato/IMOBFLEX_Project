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
test("public discovery and filters remain navigable", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Seu próximo lugar",
  );
  await page
    .getByRole("link", { name: "Explorar imóveis", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Um lugar",
  );
  await page.getByLabel("Localização", { exact: true }).fill("Centro");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/q=Centro/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("registration has explicit labels and password requirements", async ({
  page,
}) => {
  await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("CPF", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Endereço completo")).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: /Li e aceito/ }),
  ).not.toBeChecked();
  await expect(page.getByText("Use pelo menos 8 caracteres")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("private dashboard redirects unauthenticated visitors", async ({
  page,
}) => {
  await page.route("**/api/v1/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/problem+json",
      body: JSON.stringify({ status: 401, detail: "Entre na sua conta." }),
    }),
  );
  await page.goto("/painel/visitas", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/login\?next=/);
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
});
