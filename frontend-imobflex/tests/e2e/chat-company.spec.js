import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("chat offers local guidance, explicit AI consent and keyboard dismissal", async ({
  page,
  request,
}) => {
  const health = await request.get("/api/v1/health");
  test.skip(!health.ok(), "Requires the backend");
  await page.goto("/contato");
  const launcher = page.getByRole("button", {
    name: "Abrir assistente Imobflex",
    exact: true,
  });
  await launcher.click();
  const chat = page.getByRole("dialog", { name: "Assistente Imobflex" });
  await expect(chat).toBeVisible();
  await expect(chat.getByRole("checkbox")).not.toBeChecked();
  await chat
    .getByRole("button", { name: "Como agendar uma visita?", exact: true })
    .click();
  await expect(chat.getByText(/aguarda confirmação do corretor/)).toBeVisible();
  await expect(
    chat.getByText("Orientação local · sem envio à IA"),
  ).toBeVisible();
  await expect(
    chat.getByRole("link", { name: "Consultar imóveis", exact: true }),
  ).toHaveAttribute("href", "/imoveis");
  await page.keyboard.press("Escape");
  await expect(chat).not.toBeVisible();
  await expect(launcher).toBeFocused();
});

test("new pages, fonts and open chat fit phones and desktop in both themes", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/sobre", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Imóveis em São Paulo",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/contato", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Abrir assistente Imobflex", exact: true })
      .click();
    const chat = page.getByRole("dialog", { name: "Assistente Imobflex" });
    await expect(
      chat.getByLabel("Sua pergunta", { exact: true }),
    ).toBeFocused();
    const box = await chat.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Modo escuro", exact: true })
      .click();
  }
});

test("company pages and chat meet automated accessibility checks", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/sobre", "/contato"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await page
        .getByRole("button", { name: "Abrir assistente Imobflex", exact: true })
        .click();
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
  }
});
