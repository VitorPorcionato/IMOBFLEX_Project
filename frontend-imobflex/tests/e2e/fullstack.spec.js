import { test, expect } from "@playwright/test";
import path from "node:path";
test("administrator publishes, client confirms email and books, broker confirms", async ({
  page,
  request,
}) => {
  test.skip(
    !process.env.FULL_STACK,
    "Requires backend, Mailpit and explicit demo data.",
  );
  test.setTimeout(150000);
  page.setDefaultTimeout(15000);
  await page.route("https://viacep.com.br/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ erro: true }),
    }),
  );
  const stamp = Date.now();
  const title = `Imóvel fictício E2E ${stamp}`;
  const email = `e2e${stamp}@example.test`;
  const password = "E2ePilotSecure25";
  await page.goto("/");
  await page
    .getByRole("button", { name: "Recusar opcionais", exact: true })
    .click();
  async function login(email, password, profile = "Cliente") {
    await page.goto("/login");
    await page.getByRole("radio", { name: profile, exact: true }).check();
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto("/central-privacidade");
    await page.getByRole("checkbox", { name: /Li e aceito/ }).check();
    await page
      .getByRole("button", { name: "Registrar aceite", exact: true })
      .click();
    await expect(
      page.getByText("Aceite registrado com versão e horário."),
    ).toBeVisible();
  }
  await login(
    process.env.E2E_ADMIN_EMAIL || "admin@example.test",
    process.env.E2E_ADMIN_PASSWORD || "AdminPilot2026!",
    "Admin",
  );
  await page.goto("/painel/imoveis/novo");
  await page.getByLabel("Título do anúncio").fill(title);
  await page.getByLabel("Preço de venda (R$)", { exact: true }).fill("700000");
  await page.getByLabel("CEP", { exact: true }).fill("09500000");
  await page.getByLabel("Rua", { exact: true }).fill("Rua fictícia");
  await page.getByLabel("Número / complemento").fill("10");
  await page.getByLabel("Bairro", { exact: true }).fill("Centro");
  await page.getByLabel("Cidade", { exact: true }).fill("São Caetano do Sul");
  await page.getByLabel("UF", { exact: true }).fill("SP");
  await page.getByLabel("Área total (m²)").fill("100");
  await page
    .getByLabel("Proprietário", { exact: true })
    .selectOption({ label: "Proprietário demonstração" });
  await page
    .getByLabel("Corretor responsável")
    .selectOption({ label: "Corretora demonstração" });
  await page
    .getByLabel("Descrição", { exact: true })
    .fill(
      "Imóvel inteiramente fictício para validar o cadastro, a aprovação e o agendamento de visitas neste piloto acadêmico.",
    );
  await page.getByRole("button", { name: "Salvar e adicionar fotos" }).click();
  await expect(page).toHaveURL(/\/painel\/imoveis\/\d+$/);
  const id = page.url().split("/").at(-1);
  await page
    .getByLabel("Adicionar imagens")
    .setInputFiles(
      [0, 1, 2].map((i) =>
        path.resolve(
          `../backend-imobflex/src/main/resources/demo/photo-${i}.jpg`,
        ),
      ),
    );
  await page.getByRole("button", { name: "Enviar fotografias" }).click();
  await expect(page.getByText("Fotografias adicionadas.")).toBeVisible();
  await page.goto("/painel/imoveis");
  await page
    .getByLabel(`Situação de ${title}`, { exact: true })
    .selectOption("AVAILABLE");
  await expect(
    page.getByRole("row").filter({ hasText: title }).locator("span.tag"),
  ).toHaveText("Disponível");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  let digits = String(stamp).slice(-9).split("").map(Number);
  for (let n = 9; n < 11; n++) {
    let d = (digits.reduce((sum, v, i) => sum + v * (n + 1 - i), 0) * 10) % 11;
    digits.push(d === 10 ? 0 : d);
  }
  await page.goto("/cadastro");
  await page.getByLabel("Nome completo").fill("Cliente fictício E2E");

  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("checkbox", { name: /Li e aceito/ }).check();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(
    page.getByText("Cadastro recebido.", { exact: false }),
  ).toBeVisible();
  let message;
  await expect
    .poll(
      async () => {
        const inbox = await (
          await request.get("http://127.0.0.1:8025/api/v1/messages")
        ).json();
        message = inbox.messages?.find((m) =>
          m.To.some((t) => t.Address === email),
        );
        return !!message;
      },
      { timeout: 30000, intervals: [1000, 2000] },
    )
    .toBe(true);
  const mail = await (
    await request.get(`http://127.0.0.1:8025/api/v1/message/${message.ID}`)
  ).json();
  const token = mail.Text.match(/token=([a-f0-9]+)/)[1];
  await page.goto("/confirmar-email?token=" + token);
  await page
    .getByRole("button", { name: "Confirmar e-mail", exact: true })
    .click();
  await expect(
    page.getByText("E-mail confirmado.", { exact: false }),
  ).toBeVisible();
  await login(email, password);
  await page.goto("/imoveis/" + id);
  let day = new Date();
  day.setDate(day.getDate() + 3);
  if (day.getDay() === 0) day.setDate(day.getDate() + 1);
  await page.getByLabel("Data da visita").fill(day.toISOString().slice(0, 10));
  await expect(page.getByLabel("Horário disponível")).toBeVisible();
  const options = await page
    .getByLabel("Horário disponível")
    .locator("option")
    .all();
  await page
    .getByLabel("Horário disponível")
    .selectOption(await options[1].getAttribute("value"));
  await page
    .getByRole("button", { name: "Solicitar visita", exact: true })
    .click();
  await expect(
    page.getByText("Horário reservado.", { exact: false }),
  ).toBeVisible();
  await page.goto("/painel/visitas");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: title })
      .getByText("Agendada", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await login(
    "corretor@example.test",
    process.env.E2E_DEMO_PASSWORD || "DemoPilot2026!",
    "Corretor",
  );
  await page.goto("/painel/visitas");
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(row.getByText("Confirmada", { exact: true })).toBeVisible();
});
