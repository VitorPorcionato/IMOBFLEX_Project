# Dados fictícios (opcionais)

O perfil Spring `demo` executa `DemoSeeder` depois das migrações. SQL de esquema permanece exclusivamente em `../migrations`.

Ative explicitamente `SPRING_PROFILES_ACTIVE=demo` e informe `DEMO_PASSWORD` com ao menos 8 caracteres, maiúscula, minúscula e número. O seed só executa com catálogo vazio; não apaga ou substitui dados.

São criados um corretor, um proprietário, um cliente, três anúncios fictícios e uma disponibilidade semanal. Contas: `corretor@example.test`, `proprietario@example.test`, `cliente@example.test`. A senha é a variável fornecida. O proprietário não possui portal no MVP. O administrador continua sendo criado por `BOOTSTRAP_EMAIL` e `BOOTSTRAP_PASSWORD`.

Não ative o perfil demo em produção. Não execute SQL de seed com senhas em texto: os hashes são gerados pelo PasswordEncoder do backend.

## Expansão do catálogo

`ExpandedDemoSeeder` roda após o seed inicial, somente no perfil `demo`, e adiciona os dez registros de `backend-imobflex/src/main/resources/demo/properties.tsv`. Usa a mesma tabela, vínculo com corretor/proprietário e três fotografias locais por anúncio. O marcador de auditoria `DEMO_CATALOG_10` impede repetição; reiniciar não sobrescreve edições nem recria anúncios excluídos. As fotos Unsplash já incluídas no projeto são placeholders locais, disponíveis sem acesso à internet. Endereços são exemplos fictícios, não ofertas reais.

Em banco novo, são 13 anúncios. Em banco de demonstração existente, são adicionados exatamente dez. Não há migração automática com dados fictícios em produção.
