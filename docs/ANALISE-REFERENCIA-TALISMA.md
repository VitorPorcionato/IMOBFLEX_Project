# Análise do Projeto Integrador Talismã e adaptação à Imobflex

Leitura estática em 25/11/2026. Referência fixada no commit
`920c3793d545c69742b56106ea65b1c11e409cf6` do
[repositório público](https://github.com/vitormessaggi/Projeto_Integrador_Talisma/tree/920c3793d545c69742b56106ea65b1c11e409cf6).
Foram examinados a organização, dependências e fluxos centrais do frontend,
chat, API, banco e implantação. Não executei a aplicação deles nem uma auditoria
de segurança completa. As afirmações do README sobre testes contra ataques não
são tratadas como comprovação de segurança.

## Organização e arquitetura

| Parte | O que o código apresenta | Comparação com a Imobflex |
| --- | --- | --- |
| `Dev FrontEnd/talisma-imoveis` | Next.js 16.4.5, React 19.2.9, TypeScript, Tailwind 4.3.4, componentes e App Router | Mantivemos JavaScript, Next.js e Tailwind existentes; não importamos a árvore de dependências deles |
| `Dev BackEnd/imoveisapi` | Spring Boot 4.1.2 e Java 25; módulos de identidade, gestão e armazenamento; dependência AWS S3 | Mantivemos Spring Boot/Java 25 e o armazenamento local preparado por interface |
| `Dev BancoDados` | Organização separada de DDL, DML e DQL, com documentação | A Imobflex mantém Flyway e migrações versionadas, sem reescrever SQL aplicado |
| `Dev Chatbot` | FastAPI, LangChain, Groq, Chroma e embeddings Hugging Face | Criamos um módulo Spring somente de leitura, evitando um quarto serviço para o MVP |
| `Dev Mobile` | Aplicação Android Java e documentos de migração/teste | Fora do escopo web atual; nenhuma dependência mobile foi introduzida |
| `infra/aws` | Compose de serviços com configurações externas, restrições de capacidades e armazenamento/segredos de implantação | Aproveitamos a ideia de configuração por ambiente, sem alegar implantação comercial |
| Engenharia e gestão | Artefatos acadêmicos e documentos de planejamento | São contexto do projeto; não comprovam resultados em operação |

## Frontend: o que vale como inspiração

O `layout.tsx` da referência carrega Poppins localmente e Roboto por Fontsource.
O tema liga a fonte principal à variável Poppins. A aparência mais arredondada
vem tanto da fonte quanto do peso, espaçamento entre letras, bordas e controles.
Copiar apenas `font-family` não reproduziria a mesma experiência.

Em `globals.css`, os cards têm elevação pequena e a fotografia aumenta dentro
de um quadro que não muda de tamanho. Isso evita empurrar os cards vizinhos.
Há tratamento para movimento reduzido e foco por teclado. A Imobflex adotou a
mesma intenção, com DM Sans no corpo e Manrope nos títulos, fontes hospedadas
localmente, cantos de uma mesma escala e movimento discreto da camada da skill.
O carmesim, o dourado, o modo escuro e o menu atual foram preservados.

A referência reúne páginas institucionais, favoritos, conta, painel, consentimento
e um chat persistente no layout. Seus links e nomes de rota diferem da Imobflex:
por exemplo, `/entrar` e `/conta/privacidade` não existem aqui. Adaptamos os
destinos para `/login`, `/painel` e `/central-privacidade`.

O contato deles só mostra telefone, e-mail, endereço e horário quando há valores
configurados e condiciona o formulário ao perfil. Um mapa ilustrado não prova
localização real da empresa. Na Imobflex, usamos o WhatsApp já fornecido pelo
usuário e os canais reais da aplicação. Não inventamos sede, CRECI, CNPJ,
profissionais, avaliações ou tempo de mercado. O rodapé identifica o piloto.

## Chat: fluxo e limites encontrados

Uma diferença importante está na autenticação: `identidade/Seguranca.java`
configura JWT HS256, valida emissor e usa sessão stateless, com CSRF desativado.
A Imobflex usa cookie de sessão JDBC; portanto, copiar essa desativação seria
incompatível com a nossa arquitetura. Preservamos o CSRF no chat e nas demais
operações de escrita. O banco deles separa ofertas por finalidade, enquanto a
Imobflex mantém preço de venda e aluguel distintos no mesmo imóvel. A adaptação
do chatbot utiliza os campos da nossa API, sem supor o contrato de dados deles.

1. `components/chatbot.tsx` abre uma conversa flutuante, mostra uma apresentação
   e sugestões de compra, locação e visita, envia uma pergunta por vez e mantém
   as mensagens no estado da página. Escape fecha e devolve o foco ao acionador.
2. `app/api/chat/route.ts` funciona como ponte no servidor Next: valida origem,
   JSON e tamanho, controla tempo de resposta e encaminha ao serviço de chat.
3. `Dev Chatbot/app.py` classifica assuntos por regras; pode usar Groq para
   roteamento e geração. Os assuntos incluem catálogo, visitas, conta,
   recuperação, privacidade e funcionalidades específicas do projeto deles.
4. `banco_vetorial.py` divide um PDF institucional em trechos, cria embeddings
   com `all-mpnet-base-v2` e persiste uma coleção Chroma cuja revisão depende do
   arquivo e do modelo. É uma preparação adicional antes de servir as perguntas.
5. O catálogo é consultado por API; os prompts restringem a resposta ao contexto,
   distinguem solicitar de confirmar visita e proíbem pedir senhas ou documentos.
6. Groq é opcional, depende de configuração no servidor e da escolha do usuário.
   Os tempos de chamada e as tentativas são limitados, com orientação alternativa.

Essa arquitetura faz sentido para uma base documental maior. No MVP da Imobflex,
FAQ e catálogo público já dão contexto suficiente para os assuntos especificados.
Não introduzimos busca vetorial sem necessidade nem copiamos o PDF, o avatar Lia,
o código, os textos ou fotografias do repositório. Não foi encontrado um arquivo
LICENSE entre os arquivos rastreados da revisão inspecionada.

## Testes e limites da evidência da referência

Há configuração Playwright, script `scripts/testar-chat.mjs`, geração de contrato
OpenAPI TypeScript e testes Java, incluindo armazenamento de fotos. O script do
chat verifica assunto fora do escopo, visitas, filtros e mensagens inválidas.
Isso comprova a existência desses testes, não sua aprovação no ambiente atual.

O fato de haver cookies, prompts restritivos ou uma política de privacidade não
prova, isoladamente, proteção contra abuso, autorização correta ou conformidade.
RAG também pode devolver contexto desatualizado se a documentação não acompanhar
as regras. Uma resposta de IA não deve confirmar agendamentos nem executar ações
administrativas. Mantivemos essas decisões nos serviços autenticados do backend.

## Implementação entregue na Imobflex

| Recurso | Implementação |
| --- | --- |
| Chat flutuante | `ChatAssistant.jsx`, apresentação, sugestões, mensagens, envio, erro, limpeza e fechamento por Escape |
| API | `POST /api/v1/public/chat`, protegida por CSRF; mensagens de até 1.000 caracteres e corpo de até 8 KiB |
| Respostas locais | Orientações sobre conta, privacidade, atendimento e visitas; quantidade do catálogo consultada no banco |
| IA opcional | Groq só é chamada com `useAi=true` e chave configurada no backend; somente pergunta e contexto público selecionado |
| Falhas e abuso | 8 s de timeout, até três chamadas externas simultâneas, dez perguntas/minuto por sessão e sessenta/minuto por instância |
| Privacidade | Sem histórico de conversa no banco; mensagens em memória da página; consentimento de IA independente de marketing/cookies |
| Segurança de saída | Respostas renderizadas como texto React; links gerados pelo servidor, nunca pela IA; sem comandos, ferramentas ou acesso a contas |
| Sobre nós | `/sobre`, apresentação e explicação dos fluxos efetivamente disponíveis |
| Contato | `/contato`, WhatsApp existente, catálogo/contato por anúncio e Central de Privacidade |
| Visual | DM Sans + Manrope, tipografia consistente, bordas suaves, hover discreto e fotografia com movimento reduzido respeitado |

O limitador global é por instância; múltiplas réplicas exigem controle compartilhado
ou limitação no proxy. O bloqueio de formatos comuns de CPF, e-mail e telefone é
uma proteção adicional, não um detector completo de informações pessoais.
Respostas generativas ainda podem conter erros; o chat orienta a confirmar
detalhes com a equipe. Ele não agenda, cancela, aprova ou altera imóveis.

## Configuração e verificação

Não foi usada nem armazenada a chave exposta na conversa. Gere uma substituta no
provedor e configure `GROQ_API_KEY` somente no ambiente do backend. O modelo
configurável é `GROQ_MODEL`, com padrão `llama-3.3-70b-versatile`. O Compose
encaminha essas variáveis ao backend. Reinicie o serviço após configurá-las.
O Spring não carrega um arquivo `.env` automaticamente em execução direta.
Nunca use prefixo `NEXT_PUBLIC_` para segredos.

Sem chave, a orientação local funciona. A chamada real à conta Groq não foi
validada nesta entrega; os testes usam respostas e falhas simuladas do cliente HTTP.
A integração segue a [compatibilidade oficial da Groq](https://console.groq.com/docs/openai)
e a [lista de modelos](https://console.groq.com/docs/models).

Testes executados: 30 testes Java aprovados em MySQL isolado (incluindo sete
novos testes de chat e limite de corpo); build de produção aprovado; cinco
cenários Chromium aprovados para chat, teclado, acessibilidade e layouts de
320 a 1440 px. O verificador visual da skill e suas ressalvas são registrados
em `DESIGN-REVIEW.md`; não são apresentados como aprovação integral.
