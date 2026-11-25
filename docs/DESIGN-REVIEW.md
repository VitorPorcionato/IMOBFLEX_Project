GATE: OPEN 26 (rounds used up)

# Revisão visual — 25/11/2026

O gate da skill não foi aprovado integralmente. A revisão foi encerrada no limite de três rodadas, sem alterar o verificador e sem ocultar elementos. Os testes funcionais e de acessibilidade são evidências separadas, não substitutos de uma aprovação deste gate.

## Direção e escopo

Tipo service, site-kind other. Imobiliária para compra e locação em São Paulo. Ação: Consultar imóveis. Paleta existente carmesim #9B1536, vinho #6E1028, dourado #B58A32 e neutros, com modo escuro solicitado anteriormente. DM Sans 5.3.0 no corpo e Manrope 5.3.0 nos títulos. Hero com fotografia e entrada discreta; momento sorteado picture-develops, look film, no hero das páginas institucionais. Nenhum shader, cena 3D ou efeito ligado à rolagem. Voz: atendimento direto, frases curtas e instruções concretas sobre o site.

As páginas usam a organização existente, SSR, sessões e API Spring. Não foi adotado static export porque impediria as rotas dinâmicas e os fluxos atuais. O banner de consentimento e os controles de conta, volta, tema e chat foram preservados. O checker impõe também uma estrutura editorial própria, alturas exatas e controles com estilos iguais; esses apontamentos não foram classificados automaticamente como defeitos funcionais.

## Dispensas justificadas (cinco)
- nav: header.topbar > div.container.header-inner > div.header-start > a.brand "Imobflex Uma nova história começa aqui" — A marca tem nome e assinatura em dois níveis intencionais; os links de navegação não quebram linha.
- copy-fact: div.company-page > section.container.company-hero > div.company-copy > h1 "Imóveis em São Paulo, com atendimento pr" — O título informa São Paulo, localidade real explicitamente definida no briefing e no catálogo.
- heading-scale: section.company-process > div.container.company-process-inner > div > h2 "Da busca à visita ao imóvel." — O título de consentimento é um componente utilitário independente; não deve ter o tamanho do título editorial da página.
- phone-number: a.whatsapp-float "https://wa.me/5511976086540?text=Ol%C3%A" — Número de WhatsApp fornecido explicitamente pelo usuário no briefing anterior; o canal deve ser preservado.
- menu-toggle: header.topbar > div.container.header-inner > div.header-tools:nth-of-type(2) > button.theme-toggle "Modo escuro" — Este controle troca o tema e informa aria-pressed; não abre um menu. O menu real mantém aria-expanded.

## Apontamentos ainda abertos
- **hero-fill** — main#conteudo > div.company-page > section.container.company-hero "Imóveis em São Paulo, com atendimento pr": the next section shows on the first screen: it starts at 372px on a 900px screen (the hero ends at 308px)
- **nav-covers** — a.whatsapp-float: sits on top of the text "Marketing opcional e uma Central de Priv" while the page scrolls: part of the line shows beside it
- **nav-covers** — aside.chat-assistant "Precisa de ajuda?": sits on top of the text "Política de Privacidade" while the page scrolls: part of the line shows beside it
- **button-styles** — (one screen): 3 button styles on one screen: soft, outline #9b1536 ("Minha conta"); soft, outline #e1e2e5 ("Voltar"); soft, fill #9b1536, outline #9b1536 ("Consultar imóveis"); the odd one out: "Consultar imóveis"
- **button-styles** — (the page): 4 button styles on the page: soft, outline #e1e2e5 x1 ("Voltar"); soft, outline #9b1536 x3 ("Minha conta"); soft, fill #9b1536, outline #9b1536 x1 ("Consultar imóveis"); soft, fill #ffffff, outline #9b1536 x1 ("Falar com a equipe")
- **section-gaps** — section.cookie-banner / main#conteudo > div.company-page > section.container.company-hero: 97px between these sections, -60% against the median 245px
- **section-tile** — section.cookie-banner "Sua privacidade, suas escolhas": the header and the first section fill 308px (0.34 screens at 1440x900; the section is 211px), shorter than the screen: the first screen shows 211px of it and 592px of the next section, its heading "Imóveis em São Paulo, com aten" on screen
- **focus-ring** — .property-card > a:focus-visible: ".property-card > a:focus-visible" in src_app_1tqlw_mt1nay7._.css removes the focus outline and sets nothing in its place
- **hero-enter** — main#conteudo > div.company-page > section.container.company-hero: the hero does not enter on load: no head line setting html.m-enter (motion.md, The hero's entrance)
- **hero-screen** — main#conteudo > div.company-page "Sobre nósImóveis em São Paulo, com atend": the hero ends at 2012px on a 900px screen, 1112px below the fold: it ends at the fold, 1px either way (SR-1)
- **section-height** — footer.footer "ImobflexEncontre um lugar que combine co": the section is 576px tall (0.6 screens), 324px short of one screen (900px): every section after the hero is one screen or two, 2px either way (SR-2)
- **section-height** — main#conteudo > div.company-page "Sobre nósImóveis em São Paulo, com atend": the section starts at 308px, 308px below the screen grid (0 x 900px): sections start on whole screens (SR-2)
- **one-section** — main#conteudo > div.company-page "Sobre nósImóveis em São Paulo, com atend": a <div> sits directly in <main>: every part of <main> is a <section> (SR-4)
- **one-heading** — section.company-process > div.container.company-process-inner > div > h2 "Da busca à visita ao imóvel.": the hero holds an h2 (1): its heading is the h1, and an h2 opens the next section (SR-5)
- **container-edges** — header.topbar "VoltarImobflexUma nova história começa a": the nav's content runs 40px from the left and 40px from the right (read from its outermost blocks: no .wrap): the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (SR-6)
- **container-edges** — main#conteudo > div.company-page "Sobre nósImóveis em São Paulo, com atend": the content of section 1 runs 40px from the left and 40px from the right (read from its outermost blocks: no .wrap): the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (and 1 more like it: "ImobflexEncontre um luga") (SR-6)
- **container-edges** — a.skip "Ir para o conteúdo": a <a> at the top of the page, outside header.nav, main, footer.closing and nav.actionbar (SR-6)
- **container-edges** — main#conteudo > div.company-page > section.container.company-hero "Sobre nósImóveis em São Paulo, com atend": a box runs 0-1440px, outside the container lines of section 1 at 40-1400px: full width is for background layers and grounds only (SR-6)
- **container-edges** — main#conteudo > div.company-page > section.company-process "Como trabalhamosDa busca à visita ao imó": a box runs 0-1440px, outside the container lines of section 1 at 40-1400px: full width is for background layers and grounds only (SR-6)
- **split-pair** — main#conteudo > div.company-page > section.company-process > div.container.company-process-inner "Como trabalhamosDa busca à visita ao imó": the split's columns are off the page's one pair of lines: its right column starts at x 778, the first split's at 772; its right column starts at x 778, on none of the split lines 617 (k=5), 732 (k=6), 847 (k=7) (SR-8)
- **split-pair** — main#conteudo > div.company-page > section.container.company-hero "Sobre nósImóveis em São Paulo, com atend": the split's columns are off the page's one pair of lines: its right column starts at x 772, on none of the split lines 617 (k=5), 732 (k=6), 847 (k=7) (SR-8)
- **no-visual** — section.cookie-banner "Sua privacidade, suas escolhas": no picture, effect or mock in this section; a feature section needs a visual
- **off-grid** — section.cookie-banner > div.cookie-actions > button.btn.secondary:nth-of-type(1) "Recusar opcionais": left edge at 20px, 4px off the page margin at 16px (33 elements, like p.company-kicker); 4 more in this section off the grid too (button.btn.secondary:nth-of-type(2) at 20px, h2#cookie-title at 20px, p at 20px, a at 20px)
- **section-gaps** — main#conteudo > div.company-page > section.company-process / footer.footer: 184px between these sections, +90% against the median 97px of gaps at a change of ground
- **edge-right** — div.company-page div "Como trabalhamosDa busca à visit": ends at x 662.4; the right line is 1400
- **edge-left** — div.company-page dl.company-principles "Informações para compararFotos, ": starts at x 777.6; the lines are 40 and the column starts

## Avisos mantidos
- flush — section.cookie-banner > div:nth-of-type(1) > a "Entenda os cookies e seus dados": its button sits 31px above the rule on top of section.container.company-hero
- fold-card — main#conteudo > div.company-page > section.container.company-hero > figure.company-photo.mo-pd: the 628x576 card starts on the first screen and runs 48px past its bottom (inside a held section or scroll scene, whose motion --quick does not check)
- no-visual — main#conteudo > div.company-page > section.company-process "Da busca à visita ao imóvel.": pictures, effects and mocks cover 20% of this section; a feature section needs a visual (about 25% or more)
- copy-headings — h2#cookie-title "Sua privacidade, suas escolhas": "Sua privacidade, suas escolhas" names no product, part, place or section (the one brand line a page may have)
- copy-buttons — header.topbar > div.container.header-inner > div.header-start > button.back-button "Voltar": "Voltar" does not start with a verb (book, buy, try, start, get, see...) (and 6 more like it: "Minha conta", "Recusar opcionais", "Aceitar opcionais", "Consultar imóveis", ...)
- copy-actions — (the page): the main action "Consultar imóveis" does not read word for word the same in the nav or hero and the closing section
- section-gaps — main#conteudo > div.company-page > section.company-process / footer.footer: 358px between these sections, +46% against the median 245px of gaps at a change of ground
- section-gaps — main#conteudo > div.company-page > section.container.company-hero / main#conteudo > div.company-page > section.company-process: uneven space at the edge of a band: 164px outside its edge, 81px inside it (the space on either side of a change of ground reads as one gap only when the two match)
- nav-family — header.topbar: the nav's links and actions use 2 type families (Manrope, DM Sans)
- empty-area — main#conteudo > div.company-page > section.company-process "Da busca à visita ao imóvel.": 38% of the section is empty: 48px above its first content, 240px under its last (a.btn.secondary), 7% beside content that covers under half the container, in its 900px of rows (WARN over 35%, FAIL over 50%)
- skip-link — a.skip:nth-of-type(1) "Ir para o conteúdo": the first Tab stop is "Ir para o conteúdo", not a skip link: a keyboard user tabs through the whole nav on every visit
- share-meta — head: the head lacks og:title, og:description, og:image, twitter:card, an icon, theme-color: a shared link shows no picture or title of its own
- one-section — main#conteudo > div.company-page "Sobre nósImóveis em São Paulo, com atend": the screen at scroll 1738px (the top of section 2) shows 274px of section 1 beside section 2: a screen shows one section (another may peek 8px, 24px WARN) (it is in a scroll scene: told as a WARN) (SR-4)
- tap-size — header.topbar > div.container.header-inner > div.header-start > a.brand "Imobflex": a 129x36px tap target: under the 44px a phone needs
- heading-scale — section.company-process > div.container.company-process-inner > div > h2 "Da busca à visita ao imóvel.": h2 headings in 2 sizes, 24px ("Sua privacidade, suas es") to 28.8px (x1.20)
- section-gaps — section.cookie-banner / main#conteudo > div.company-page > section.container.company-hero: 63px between these sections, -35% against the median 97px
- photo-set — section.company-process > div.container.company-process-inner > div > img.company-process-photo "regions-abc.jpg": 2 photographs in more than one look: warm and cool photographs mixed (b* -10 to +12); the odd one out is regions-abc.jpg
- photo-weight — div.company-page > section.container.company-hero > figure.company-photo.mo-pd > img "hero.jpg": 2 photographs are 3x or more wider than drawn on the phone, with no srcset: hero.jpg is 1400px (287 KB) for a 358px frame; on a phone it arrives late and its frame shows only its ground until then
- fold-cut — div.company-page > section.container.company-hero > div.company-copy > h1 "Imóveis em São Paulo, com atendimento pr": a 34px line is sliced by the bottom of the first screen (23px of it below the fold)

Os avisos de texto e ação repetida correspondem em parte a controles utilitários, nomes de botões existentes e ao aviso acadêmico preservado. Os textos não foram tratados como alegações de resultado comercial.

## Evidências e limites

Capturas do script da skill: Sobre nós em 1440 px e Contato em 390 px, inspecionadas visualmente. Cinco testes Chromium passaram, incluindo layouts de 320, 390, 768, 1024 e 1440 px, chat aberto e fechado, teclado e axe-core nas duas páginas. O teste de layout alterna os temas. O teste axe-core executado nesta rodada não é uma certificação manual ou integral. Não foi executado o relatório perf.mjs; não há pontuação de performance a declarar.

Fotos de apoio existentes: public/hero.jpg, public/regions-abc.jpg e public/regions-interior.jpg, de origem Unsplash registrada em ASSETS.md. Não representam sede, equipe nem imóveis reais em oferta; para produção a imobiliária deve fornecer fotos autorizadas. Nenhuma marca, avatar, mapa ou foto foi copiada da referência. Nenhum endereço, horário, e-mail ou profissional foi inventado; o WhatsApp já havia sido fornecido pelo usuário. Não há dados empresariais fictícios necessários a substituir nesta entrega.

As fontes são hospedadas pelo próprio frontend. A única comunicação nova opcional com terceiro é a chamada Groq no backend, mediante escolha no chat e configuração de chave. Não houve chamada real ao provedor com a chave exposta; os testes de integração de IA utilizam cliente HTTP simulado.
