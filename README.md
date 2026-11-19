# Imobflex

MVP acadêmico para catálogo de venda/locação, contatos e visitas. Next.js 16 + JavaScript + Tailwind 4; Java 25 + Spring Boot 4.1; MySQL 8.4.

## Executar com Docker

Requisitos: Docker Engine/Desktop com Compose. Na raiz:

```powershell
Copy-Item .env.example .env
# Edite .env: escolha senhas próprias para banco e administrador.
docker compose up --build -d
```

- Aplicação: http://localhost:3000
- Caixa de e-mails do piloto: http://localhost:8025
- Entre com `BOOTSTRAP_EMAIL` e `BOOTSTRAP_PASSWORD` definidos no `.env`.
- Banco e backend ficam na rede privada do Compose. Portas publicadas somente em localhost.
- `docker compose logs -f backend` acompanha a inicialização. Aguarde as migrações antes do primeiro acesso.

### Dados fictícios opcionais

Antes da primeira inicialização, adicione ao `.env`:

```dotenv
SPRING_PROFILES_ACTIVE=demo
DEMO_PASSWORD=EscolhaUmaSenhaFicticia25
```

O perfil `demo` cria 13 anúncios ilustrativos (3 originais e 10 novos), cliente, proprietário e corretor. As contas `cliente@example.test` e `corretor@example.test` usam `DEMO_PASSWORD`. Não use dados pessoais reais no piloto. O seed inicial só executa com catálogo vazio. A expansão de dez imóveis executa uma única vez em bases com as contas de demonstração, preservando os anúncios existentes.

### Primeiro fluxo sem seed

1. Entre como administrador; cadastre proprietário e corretor em **Usuários**.
2. Abra o Mailpit e confirme o e-mail do corretor. O proprietário não possui portal próprio.
3. Configure os horários do corretor em **Disponibilidade**.
4. Cadastre um imóvel e envie pelo menos três fotografias JPG/PNG.
5. O administrador altera o status para **Disponível**.
6. Cadastre um cliente pelo site e confirme o e-mail no Mailpit.
7. Solicite uma visita com 24 horas de antecedência; entre como corretor para confirmar.
8. Após o término, registre realização ou ausência. O tempo sozinho não conclui visitas.

## Desenvolvimento sem Docker

Requisitos: JDK 25, Node.js 24, MySQL 8.4 e SMTP de teste (Mailpit). Crie banco UTF-8 e usuário dedicado. Exporte as variáveis dos `.env.example` no shell; Spring não carrega `.env` automaticamente.

```powershell
$env:DATABASE_URL='jdbc:mysql://localhost:3306/imobflex?connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true'
$env:DATABASE_USER='imobflex'
$env:DATABASE_PASSWORD='<sua senha>'
$env:BOOTSTRAP_EMAIL='admin@example.test'
$env:BOOTSTRAP_PASSWORD='<senha forte>'
cd backend-imobflex
.\mvnw.cmd spring-boot:run
```

Em outro terminal:

```powershell
cd frontend-imobflex
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Backend: porta 8080; frontend: 3000; SMTP: 1025. No Linux/macOS use `./mvnw`.

## Estrutura

- `frontend-imobflex`: páginas públicas, formulários e painéis.
- `backend-imobflex`: API, segurança, transações, e-mails e armazenamento.
- `sql-imobflex`: fonte única de migrações Flyway empacotadas pelo Maven.
- `docs`: diagnóstico, arquitetura, matriz de requisitos e operação.

## Verificação

```powershell
cd backend-imobflex
.\mvnw.cmd verify
# Requer Docker para Testcontainers MySQL 8.4.
cd ../frontend-imobflex
npm ci
npm run lint
npm test
npm run build
npx playwright install
npm run test:e2e
```

Sem Docker, testes Java aceitam `TEST_DATABASE_URL`, `TEST_DATABASE_USER` e `TEST_DATABASE_PASSWORD` apontando para um **banco vazio dedicado a testes**, nunca para a aplicação. Cada execução precisa de um banco novo.

OpenAPI: `backend-imobflex/src/main/resources/openapi.yaml`, servido em `/api/v1/openapi`. CSRF: GET `/api/v1/auth/csrf`; preserve o cookie e envie o token no cabeçalho retornado em toda escrita.

## Limites

RF11, propostas formais, portal do proprietário, pagamentos, realidade aumentada e publicação automática não integram o MVP. O botão flutuante do WhatsApp usa o número de atendimento fornecido: +55 11 97608-6540. O contato adicional dentro do anúncio pode ser configurado por `WHATSAPP` (Compose) ou `NEXT_PUBLIC_WHATSAPP`.

Para produção: definir HTTPS, SMTP, política de dados, retenção, fotos reais, capacidade e operação; ativar `COOKIE_SECURE=true`. Suporte Spring prolongado comercial não está contratado. Tailwind não possui linha LTS formal.

Consulte `docs/VALIDACAO.md` para os testes efetivamente executados.

## Privacidade

Termos, política, cookies e Central de Privacidade estão disponíveis no rodapé. Consulte [operação de privacidade](docs/PRIVACIDADE.md) para chave de cifragem, revisão da retenção, backups e incidentes. Dados reais dependem da identificação do controlador e revisão das políticas pela imobiliária.
