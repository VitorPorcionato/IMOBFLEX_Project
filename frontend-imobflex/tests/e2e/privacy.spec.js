import { test, expect } from "@playwright/test";
test("cookie choices are equivalent and no third party is requested", async ({
  page,
  context,
}) => {
  const outside = [];
  page.on("request", (r) => {
    if (!new URL(r.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/))
      outside.push(r.url());
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const accept = page.getByRole("button", {
      name: "Aceitar opcionais",
      exact: true,
    }),
    reject = page.getByRole("button", {
      name: "Recusar opcionais",
      exact: true,
    });
  await expect(accept).toBeVisible();
  await expect(reject).toBeVisible();
  expect(await accept.getAttribute("class")).toBe(
    await reject.getAttribute("class"),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await reject.focus();
  await page.keyboard.press("Enter");
  await expect(reject).toHaveCount(0);
  let cookies = await context.cookies();
  expect(
    JSON.parse(
      decodeURIComponent(
        cookies.find((c) => c.name === "imobflex_privacy").value,
      ),
    ).optional,
  ).toBe(false);
  await page.reload();
  await expect(reject).toHaveCount(0);
  await page
    .getByRole("button", { name: "Preferências de cookies", exact: true })
    .click();
  await accept.click();
  cookies = await context.cookies();
  expect(
    JSON.parse(
      decodeURIComponent(
        cookies.find((c) => c.name === "imobflex_privacy").value,
      ),
    ).optional,
  ).toBe(true);
  expect(outside).toEqual([]);
});
test("registration separates terms and marketing, legal pages accessible", async ({
  page,
}) => {
  await page.goto("/cadastro");
  await page
    .getByRole("button", { name: "Recusar opcionais", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: /Li e aceito/ }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: /Quero receber/ }),
  ).not.toBeChecked();
  await expect(page.getByLabel("CPF", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Endereço completo")).toHaveCount(0);
  for (const path of [
    "/termos",
    "/privacidade",
    "/central-privacidade",
    "/descadastro?token=invalid",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
