# Banco de dados

MySQL 8.4 LTS, InnoDB e utf8mb4. `migrations` é a fonte única do esquema, incluída pelo Maven no classpath `db/migration`. Flyway registra versão e checksum. Não executar manualmente em instalação gerenciada por Flyway; não usar `ddl-auto=update`.

- V1: contas, imóveis, imagens, agenda, visitas, contatos, mensagens, auditoria, outbox e sessões.
- V2: cobertura 2026/2027 e feriados nacionais fixos. Feriados locais e pontos facultativos são revisados pelo administrador.
- V3: unicidade de reservas ativas por imóvel, corretor e cliente; cancelamentos liberam a chave.

Transações usam READ COMMITTED. Reservas bloqueiam imóvel e usuários em ordem crescente e revalidam horário. Cobertura anual recebe bloqueio compartilhado; edição de feriados bloqueia o ano exclusivamente. JPA valida contas; JDBC parametrizado realiza consultas e bloqueios no mesmo gerenciador transacional.

Acrescente migrações para evoluir instalações existentes. Seeds são opcionais: `seeds/README.md`. Backup deve incluir banco e imagens; ver `../docs/OPERACAO.md`.
