# Operação do piloto

## E-mail e configuração

Mailpit captura e-mails localmente. Para SMTP real: MAIL_HOST/PORT/USERNAME/PASSWORD, MAIL_AUTH=true, MAIL_TLS=true e MAIL_FROM. Segredos não entram no Git. Após cinco falhas, o painel permite reenviar. Entrega é ao menos uma vez: interrupção entre envio SMTP e commit pode duplicar mensagem.

BOOTSTRAP cria apenas o primeiro administrador; remova a senha da configuração após inicialização. Contas do seed são confirmadas artificialmente apenas para demonstração.

## Backup

Preserve os volumes mysql-data e uploads. Parar os containers não apaga os volumes. Backups incluem dados sensíveis e devem ficar fora do Git e ter cópia externa.

Faça uma janela sem escritas: pare frontend/backend, exporte MySQL com mysqldump usando `--single-transaction --routines --triggers --hex-blob --no-tablespaces` e arquive o volume uploads. Reinicie os serviços. Use a senha pelo ambiente do processo, evitando histórico do shell.

Restaure primeiro em **outro banco e outro volume**, confira versões Flyway e contagens, inicie uma aplicação isolada e verifique login e fotografia. Não ensaie restauração sobre a base corrente. O resultado executado está em VALIDACAO.md.

## Saúde e hospedagem

GET /api/v1/health verifica o banco. Next encaminha a API. Em hospedagem: mesma origem, HTTPS, COOKIE_SECURE=true, PUBLIC_URL correto, volume persistente, SMTP e segredos do provedor. Imagens não podem ficar no diretório temporário de PaaS.

Calendário cobre 2026/2027. Para novo ano, cadastrar/revisar feriados e confirmar cobertura. Fora dela, reservas ficam bloqueadas. Feriados municipais e indisponibilidades são configurados pela equipe. Horário de Brasília independe do fuso do navegador.

## Git e qualidade

Branch codex/imobflex-mvp. GitHub Actions verifica Java e frontend. Migrações compartilhadas não devem ser reescritas. CI Java usa Testcontainers; frontend executa lint, testes, build e Playwright. Dados de teste são fictícios.

Antes de operação real: validar catálogo/fotos, política de retenção e atendimento de solicitações, hospedagem, backup externo, monitoramento, calendário e treinamento. Piloto não promete SLA nem conversão comercial.
