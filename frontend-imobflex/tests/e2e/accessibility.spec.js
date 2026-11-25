import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("privacy flows meet automated WCAG AA checks", async ({ page }) => {
  test.setTimeout(120000);
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/cadastro",
      "/login",
      "/termos",
      "/privacidade",
      "/central-privacidade",
    ]) {
      await page.goto(path, { waitUntil: "networkidle" });
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
});
