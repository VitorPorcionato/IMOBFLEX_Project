# Evolução visual — 25/11/2026

Direção: a busca por um endereço em São Paulo. Fotografia ampla na abertura,
busca logo abaixo e atalhos por tipo de imóvel antes do catálogo. As cidades
funcionam como destinos de busca, sem números comerciais ou depoimentos inventados.

Paleta clara: carmesim #9B1536, vinho #6E1028, dourado #B58A32, branco #FFFFFF,
grafite #242424 e cinza #F3F4F6. Tema escuro: fundo #10141D, superfície #191F2B,
texto #F1F4FA, carmesim claro #F493AF e dourado #DFBA67. Source Serif 4 nos títulos
institucionais e Source Sans 3 na interface. Conteúdo em container de até 1440 px.

Estrutura: cabeçalho → abertura com fotografia e chamada → busca → tipos de
imóvel → seis novidades → cidades → orientação para visita → acesso ao catálogo.
Títulos de seção centralizados; textos dos cards e formulários alinhados à esquerda.
Revisão do briefing: preservada a identidade existente; trocados os blocos genéricos
por atalhos reais de busca, sem animações automáticas ou estatísticas promocionais.

Hover eleva os cards e aproxima a fotografia, somente em dispositivos com mouse.
Foco por teclado recebe destaque equivalente. Movimento reduzido desativa as
transições. Grades: uma coluna até 640 px, duas de 641 a 1024 px e três no desktop.
O menu móvel e o tema permanecem acessíveis no cabeçalho. A preferência de tema
fica no cookie funcional imobflex-theme por seis meses; renderização no servidor
usa a escolha para evitar mudança de tema após carregar a página.

Os filtros do catálogo começam recolhidos em celulares e tablets e abertos no
desktop. O usuário pode expandir/recolher o formulário pelo controle nativo
`details/summary`, inclusive pelo teclado.

A seta fica no canto superior esquerdo das páginas públicas e dos painéis,
exceto na home. É um link direto para `/`, independentemente do histórico ou
dos filtros. Não grava mais indicadores de navegação no sessionStorage.
O acionador do assistente fica à esquerda do WhatsApp, alinhado na mesma linha,
com espaço entre os dois. O painel de conversa abre acima dos acionadores e
permanece dentro da tela, inclusive em 320 px.

## Catálogo de demonstração

O perfil Spring `demo` executa CuratedDemoSeeder após os seeds anteriores.
Adiciona 12 exemplos e atualiza os 13 originais quando ainda correspondem aos
dados iniciais e não possuem edição auditada por usuário. Não recria exemplos
apagados nem altera imóveis cadastrados por usuários. O marcador
DEMO_CURATED_SP_25 impede repetição. Fotografias anteriores ficam no armazenamento
para evitar remoção de arquivos que possam ter outros vínculos.

Os 25 exemplos possuem capas distintas. Os outros dois enquadramentos de cada
galeria são recortes da própria fotografia ilustrativa, sem misturar casas de
anúncios diferentes. Endereços de referência (logradouro, bairro, cidade e CEP)
foram consultados no ViaCEP; o número é s/n. As descrições deixam claro que não
há uma unidade real em oferta. Fontes e hashes em
backend-imobflex/src/main/resources/demo/curated/sources.json.

Preparação reproduzível: `python backend-imobflex/scripts/prepare-curated-demo.py`
(Pillow necessário). O funcionamento da aplicação não depende de baixar fotos,
consultar o ViaCEP nem acessar o Unsplash em tempo de navegação.
