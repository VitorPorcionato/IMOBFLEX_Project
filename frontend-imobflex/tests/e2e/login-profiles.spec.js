import { test, expect } from "@playwright/test";

for (const [role, profile] of [["CLIENT", "Cliente"], ["BROKER", "Corretor"], ["ADMIN", "Admin"]]) {
  test(`entrada como ${profile} abre a área correspondente`, async ({ page }) => {
    const user = { id: 17, name: "Pessoa de teste", email: "perfil@example.test", role };
    let selectedRole;
    await page.route("**/api/v1/**", async route => {
      const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
      let body = {};
      if (path === "/auth/csrf") body = { headerName: "X-CSRF-TOKEN", token: "test-token" };
      else if (path === "/auth/login") {
        selectedRole = route.request().postDataJSON().role;
        body = user;
      } else if (path === "/me") body = user;
      else if (path === "/visits") body = [{ id: 4, title: "Apartamento com varanda", status: "CONFIRMED", starts_at: new Date(Date.now() + 172800000).toISOString() }];
      else if (path === "/notifications") body = [{ id: 8, message: "Sua visita foi confirmada.", is_read: false, created_at: "2026-11-25T12:00:00Z" }];
      else if (path === "/dashboard") body = { properties: [], visits: [], contacts: 0, pending_results: 0 };
      await route.fulfill({ json: body });
    });
    await page.goto("/login");
    await page.getByRole("radio", { name: profile, exact: true }).check();
    await page.getByLabel("E-mail", { exact: true }).fill(user.email);
    await page.getByLabel("Senha", { exact: true }).fill("ValidPilot25");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/painel$/);
    expect(selectedRole).toBe(role);
    const nav = page.getByRole("navigation", { name: "Área da conta" });
    if (role === "CLIENT") {
      await expect(page.getByRole("heading", { name: "Minha área", exact: true })).toBeVisible();
      await expect(page.getByText("Apartamento com varanda")).toBeVisible();
      await expect(page.getByText("Sua visita foi confirmada.")).toBeVisible();
      await expect(nav.getByRole("link", { name: "Imóveis", exact: true })).toHaveCount(0);
    } else {
      await expect(page.getByRole("heading", { name: "Operação em um olhar" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Imóveis", exact: true })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Usuários", exact: true })).toHaveCount(role === "ADMIN" ? 1 : 0);
    if (role !== "ADMIN") {
      await page.goto("/painel/privacidade");
      await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();
    }
  });
}

test("opções de perfil funcionam por teclado no celular", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/login");
  const customer = page.getByRole("radio", { name: "Cliente", exact: true });
  await expect(customer).toBeEnabled();
  await customer.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Corretor", exact: true })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Admin", exact: true })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
