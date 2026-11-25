# Validação do MVP

## Acesso por perfil — 25/11/2026

O login oferece Cliente, Corretor e Admin. O perfil selecionado é conferido no backend depois da validação das credenciais e antes da criação da sessão. A suíte de integração verifica os três perfis, recusa divergência com 403 sem autenticar e confere as restrições dos indicadores e dos pedidos administrativos de privacidade. APIs de visitas e notificações continuam limitadas ao usuário ou à equipe responsável.

O cliente passa a entrar em `/painel`, com próximas visitas, notificações não lidas e atalhos para histórico, mensagens e privacidade. O menu distingue responsabilidades e bloqueia páginas de outros perfis também na interface. O administrador solicitado foi provisionado somente na base local, com BCrypt; suas credenciais não integram código, seeds ou este relatório. O aceite dos termos precisa ser feito pelo próprio titular.

Verificação desta alteração: 22 testes Java aprovados em MySQL 8.4 dedicado, quatro testes Vitest aprovados, lint e build Next.js aprovados, empacotamento Spring Boot aprovado. Chromium: 12 testes aprovados; o teste completo que depende de `FULL_STACK` ficou desabilitado nesta rodada. Os quatro novos testes de interface cobrem entradas por perfil, dados do cliente, menus e seleção por teclado em 320 px. Foi acrescentada a página de login ao teste axe-core existente.

O login real do administrador e a navegação nos indicadores, imóveis, formulário, usuários e privacidade foram conferidos sem alterar anúncios ou aceitar termos em nome do titular. Revisão visual em 320 e 1280 px; axe-core nessas larguras não detectou violações nas regras examinadas no login e na visão do cliente com dados simulados. Isso não certifica acessibilidade integral. Frontend, API e MySQL permanecem em execução local.

Registro de execução local em 13/10/2026. Os resultados abaixo descrevem a implementação, não uma implantação em produção.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| Maven verify, Java 25 e MySQL 8.4.9 real | 16 testes aprovados: 13 de integração e 3 de regras |
| Frontend ESLint | Aprovado |
| Frontend Vitest | 4 testes aprovados |
| Next.js build de produção | Aprovado |
| Playwright público Chromium | 3 testes aprovados |
| Playwright público WebKit desktop | 3 testes aprovados |
| Playwright público WebKit móvel | 3 testes aprovados |
| Fluxo integrado Chromium, backend, MySQL e Mailpit | Aprovado |
| Revisão visual | Home desktop e celular, capturas em screenshots/ |

O fluxo integrado criou e publicou um imóvel com três imagens, cadastrou um cliente, confirmou seu e-mail pelo Mailpit, solicitou uma visita e confirmou a visita como corretor. A consulta externa de CEP foi simulada como indisponível para verificar preenchimento manual; autenticação, persistência, imagens, e-mails e agendamento usaram os serviços locais reais.

Os testes de integração incluem CSRF, tokens expirados e de uso único, revogação de sessão, CPF duplicado, bloqueio após falhas de login, permissões, feriados, antecedências, cancelamento, resultado manual e solicitações concorrentes. Duas solicitações simultâneas para o mesmo imóvel ou para imóveis distintos com o mesmo corretor resultaram em uma aceitação e um conflito.

## Desempenho e restauração

Um dump do banco de demonstração foi restaurado em banco separado. Foram comparadas contagens de usuários, imóveis, visitas e imagens; também foram verificados login administrativo e leitura de imagem com os arquivos restaurados. O banco original permaneceu separado do ensaio.

No banco restaurado foram adicionados registros sintéticos até atingir 1.000 imóveis. Com 20 clientes concorrentes e 400 requisições de catálogo, após aquecimento, o ensaio apresentou p50 de 69,88 ms, p95 de 144,16 ms e máximo de 422,40 ms, sem erros. Resultado em [benchmark.json](benchmark.json).

Ambiente: Windows, Intel Core i7-10510U (8 processadores lógicos), Java 25.0.4.1, MySQL 8.4.9, comunicação local por loopback. O ensaio mediu a API, sem serviços externos; os imóveis adicionais não possuíam imagens. Os números foram obtidos por um executor Python local e não representam capacidade garantida de produção. O script `backend-imobflex/scripts/benchmark.mjs` e o seed `sql-imobflex/seeds/load-test.sql` permitem repetir um ensaio equivalente em banco descartável.

## Limitações verificadas

- O Firefox baixado pelo Playwright não iniciou neste Windows devido a erro de configuração lado a lado do executável. Seus testes continuam configurados; não foram considerados aprovados.
- Docker não está instalado neste ambiente. Compose e Dockerfiles foram preparados, mas a instalação limpa por contêiner ainda precisa ser executada. Os testes locais usaram MySQL 8.4 isolado, sem alterar o serviço MySQL 8.0 existente.
- GitHub Actions foi configurado para build, lint, testes e fluxo integrado; execução remota não foi verificada nesta entrega.
- A validação com a imobiliária, dados e fotografias reais, infraestrutura de produção e política de retenção permanecem necessárias antes do piloto com usuários reais.
- RF11 e os módulos explicitamente posteriores no planejamento não fazem parte desta entrega.

O PDF de origem foi preservado. A análise e a rastreabilidade dos requisitos estão em REQUISITOS.md; execução e recuperação estão em OPERACAO.md.

## Atualização visual e catálogo — 14/10/2026

Revisados App Router, componentes compartilhados, formulários, painéis, CSS global, contrato REST e modelo de dados. A marca pública foi unificada em Imobflex, preservando pastas e stack. A folha global passou a usar base mobile-first e breakpoints de 641 e 1025 px; tabelas viram registros verticais no celular e o calendário apresenta os dias em lista. Não foi usado overflow horizontal oculto para mascarar problemas de layout.

Foram adicionados dez imóveis no perfil demo com idempotência por auditoria e fotos ilustrativas locais. A base local passou de cinco para quinze imóveis, preservando os anteriores. O tipo PENTHOUSE (Cobertura) foi incluído no backend, no contrato e nos seletores. O teste de integração confirma dez inserções, três imagens por imóvel, filtros de cobertura e nenhuma duplicação na segunda execução.

Validação atual: 17 testes Java aprovados (14 integração + 3 regras), 4 testes unitários frontend, lint e build de produção aprovados. O empacotamento Java foi concluído após parar a instância que mantinha o JAR aberto no Windows. As capturas `screenshots/*-v2.png` documentam a identidade atual.

Os testes de responsividade verificam as larguras 320, 390, 640, 641, 768, 1024, 1025 e 1440, número de colunas, ausência de overflow da página, menu com Escape/foco, marca e URL do WhatsApp. O contato flutuante usa o número fornecido no briefing e não dispara mensagens automaticamente.

Nesta atualização, os cinco testes públicos/responsivos passaram no Chromium. Um ensaio autenticado percorreu dez telas do painel em 320, 768 e 1025 px (30 verificações), sem overflow horizontal. O WebKit instalado encerrou antes de abrir páginas (`exitCode=3236495362`); seus cinco testes não foram aprovados nesta rodada. O sucesso WebKit registrado em 13/10 não é evidência de execução da versão atual. Firefox não foi reexecutado.

## Privacidade e acessibilidade — 16/11/2026

Migração V4 validada em MySQL 8.4.9 isolado. `mvn verify`: 21 testes aprovados (18 integração + 3 regras). Incluem bloqueio de cadastro sem aceite, versão/hash, minimização, revogação repetida, cancelamento e revalidação de promoções em fila, acesso sem conta restrito ao e-mail verificado, exclusão com revogação de sessão, regra de entrada por imóvel, CPF cifrado, autorização de leitura, cópia do próprio CPF, cancelamento com expurgo, retenção com instante controlado e prazo de incidente com fim de semana e feriado. A limpeza foi exercitada primeiro no banco de testes; a base de demonstração tem relatório revisável e execução habilitada explicitamente.

Frontend: lint, 4 testes unitários e build de produção aprovados. Next.js foi atualizado de 16.4.0 para 16.4.6 e React para 19.3.1 após o build identificar vulnerabilidades. ESLint passou à versão compatível 9.39.5. Auditoria `npm audit --omit=dev` não apontou vulnerabilidades de produção. Ainda foram apontadas 7 ocorrências moderadas na árvore de ferramentas de desenvolvimento (TypeScript ESLint/minimatch), registradas como limitação; não foi usado upgrade forçado.

Verificação automatizada com axe-core das páginas de cadastro, termos, política e central em 320 e 1280 px, incluindo banner: sem violações das regras WCAG A/AA verificadas. Isso não equivale a certificação de acessibilidade ou conformidade jurídica. O banner foi movido para o fluxo da página para preservar foco e conteúdo visível. Revisão de capturas e testes de teclado complementam o verificador automático. Chromium foi executado; Firefox e WebKit não foram revalidados nesta atualização.

O Mailpit do Compose permanece configurado. O executável Windows foi bloqueado pelo Controle de Aplicativo; os testes integrados locais usaram a caixa SMTP Python restrita ao loopback, sem encaminhamento externo. O fluxo completo publica imóvel, confirma e-mail, registra o aceite e reserva/confirma visita. As capturas `privacy-*.png` documentam a revisão visual.

Procedimentos, limites e responsabilidades: [PRIVACIDADE.md](PRIVACIDADE.md). Antes de produção faltam dados do controlador, canal monitorado e revisão dos tratamentos pela imobiliária. Comunicação real à ANPD e gestão de backups continuam sendo ações operacionais do responsável, com registros e prazos no sistema.

Resultado final desta atualização: nove testes Chromium aprovados, incluindo fluxo completo e verificação axe-core. A desativação foi corrigida para invalidar a sessão após commit, evitando bloqueio entre a transação de negócio e Spring Session; teste de regressão aprovado. Desativação revoga marketing e inicia prazo de conservação do aceite. Contas desativadas também entram na revisão por inatividade. Relatório da limpeza local: `privacy-retention-validation.json`.

## Home, tema e catálogo — 25/11/2026

Frontend: lint, quatro testes Vitest e build de produção aprovados. Home com
busca, atalhos de tipos e cidades, cards com movimento por interação e tema
claro/escuro persistido. Layout verificado de 320 a 1440 px, incluindo os limites
640/641 e 1024/1025 px. Filtros móveis recolhíveis, navegação por teclado, menu,
carregamento de imagens e ausência de overflow aprovados.

Playwright: nove cenários distintos aprovados no Chromium (públicos,
responsivos e atualização visual), seis no Firefox e seis no WebKit (responsivos
e atualização visual). Incluem persistência do tema após navegar e recarregar,
preferência por movimento reduzido, atalhos de cidades e abertura dos filtros
móveis. A sincronização do teste de recarga foi ajustada para aguardar a chegada
ao catálogo antes de recarregar; a nova execução passou nos três motores.

Axe-core: home, catálogo, login e privacidade, em 320 e 1440 px e nos dois temas,
sem violações das regras A/AA verificadas nos três motores. Revisão visual por
capturas de desktop, tablet e celular complementou a automação; não é uma
certificação integral de acessibilidade.

Backend: 23 testes aprovados (20 de integração e três de regras), com MySQL
8.4.9 em banco temporário separado, removido após a execução. Novo teste valida
12 inserções únicas, três enquadramentos por anúncio, capas distintas e
preservação de exemplos editados. Reinício local não duplicou registros.

Base de demonstração: 13 exemplos iniciais atualizados e 12 adicionados, com
logradouro/bairro/CEP consultados no ViaCEP e descrições ilustrativas. Dois
registros antigos e inalterados de testes E2E foram inativados, sem exclusão do
histórico e após verificar ausência de visitas futuras ativas. Verificação HTTP
final: 25 anúncios públicos, 25 hashes de capas distintos, home HTTP 200 e saúde
do backend UP. Não foram enviados e-mails externos nesta atualização.

Direção visual e funcionamento do seed: [FRONTEND-VISUAL.md](FRONTEND-VISUAL.md).

### Navegação de volta — 25/11/2026

Seta global no canto superior esquerdo, com alvo de pelo menos 44 × 44 px,
foco por teclado e cores dos temas claro/escuro. Build e lint aprovados.
Três cenários por navegador verificados em Chromium, Firefox e WebKit:
retorno entre home, catálogo e filtros após recarga; abertura direta com retorno
seguro por teclado; visibilidade e ausência de overflow em 320, 390, 768, 1025 e
1440 px. O navegador pode restaurar os campos digitados na página anterior;
o teste verifica a URL anterior sem exigir que o navegador apague esses campos.

### Assistente e páginas institucionais — 25/11/2026

30 testes Java aprovados em MySQL separado: sete testes novos cobrem consentimento
para IA, catálogo público, resposta simulada da Groq, indisponibilidade, dados
pessoais, limites de perguntas e leitura limitada do JSON antes da aplicação.
Nenhuma chamada real ao provedor foi feita com a chave enviada na conversa.
Frontend: quatro testes Vitest, build e lint sem erros (três avisos em arquivos
inalterados da camada de movimento da skill). Cinco cenários Chromium aprovados
para chat, páginas institucionais, axe-core e responsividade. O fluxo de abrir,
perguntar e fechar por teclado também passou em Firefox e WebKit. HTTP local:
chat 200/LOCAL com CSRF e corpo excedido 413. A revisão visual não teve aprovação
integral: GATE OPEN 26; detalhes, cinco dispensas e 19 avisos em DESIGN-REVIEW.md.
Análise da referência e configuração: ANALISE-REFERENCIA-TALISMA.md.

### Retorno à home e posição dos acionadores — 25/11/2026

A seta foi substituída por link direto à home e fica ausente em `/`.
O assistente fica na mesma linha do WhatsApp, à esquerda e com intervalo
mínimo entre os acionadores. O painel abre acima deles, ancorado ao viewport.
Esta regra substitui o retorno por histórico documentado anteriormente.

Build aprovado; lint sem erros, com os três avisos já existentes em arquivos
da skill. Seis cenários Chromium aprovados: retorno direto por clique e teclado,
ausência de seta na home, alinhamento dos acionadores e painel sem overflow em
320, 390, 768, 1025 e 1440 px, orientação do chat e acessibilidade automatizada.
