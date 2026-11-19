# Matriz de rastreabilidade

Base: Imobflex_N2 (1).pdf, 52 páginas. Aplicam-se as decisões confirmadas no planejamento. Referências abaixo usam a posição física das páginas.

| Requisito | Implementação | Situação |
|---|---|---|
| RF01 | Cadastro completo, CPF/e-mail únicos, confirmação, edição sem CPF e desativação | MVP |
| RF02 | Login, 5 falhas/15min, recuperação 1h, sessão 30min, auditoria e redirecionamento | MVP |
| RF03 | Dados, preços separados, imagens 3–20/5MB, capa, revisão, vínculo e auditoria | MVP |
| RF04/RF05 | Venda/locação, 12 por página, status, total e ordenação | MVP |
| RF06 | Filtros combináveis e localização parcial; estado vazio e termos registrados | MVP |
| RF07 | Cliente confirmado, 24h, slots de 1h, feriados, bloqueios e cancelamento 12h | MVP |
| RF08 | Lista/calendário, escopo por corretor, conflito impedido e resultado manual | MVP com correção acordada |
| RF09 | Link, WhatsApp configurável e Open Graph | Parcial; automação futura |
| RF10 | Contatos, respostas, histórico, notificações e prazo esperado | MVP |
| RF11 | Contratos, vencimento e conversão em negócios | Fora do MVP |
| RNF01 | Responsividade, rótulos, foco e estados vazios | Revisão visual/navegadores |
| RNF02 | Paginação, imagens reduzidas; p95 <500ms/20 usuários/1000 imóveis | Relatório de validação |
| RNF03 | BCrypt, tokens com hash, sessão, CSRF e autorização por vínculo | Integração |
| RNF04 | Compose e saúde; 24h não é SLA do piloto local | Operação futura |
| RNF05 | Módulos, armazenamento abstrato e migrações | Base para evolução |
| RNF06 | Pastas separadas, wrappers, lockfile, CI e documentação | MVP |
| RNF07 | Chrome/Firefox/WebKit e mobile | Relatório de validação |
| RNF08 | Transações, chaves, reservas únicas, outbox e restauração | Integração e procedimento |

## Diagnóstico integral

- Páginas 1–7: sumários duplicados, paginação divergente, nomes IMOBFLEX/IMOBIFLEX e anos 2025/2026. Resumo/abstract definem o problema, sem comprovar resultados.
- Páginas 8–15: introdução, Double Diamond, Canvas e 5W2H. Prioridades: divulgação, agenda e comunicação. Canvas parcial e completo precisam ser consolidados. Prazo junho/2026 está vencido; ferramentas gratuitas não garantem operação sem custo. Indicadores adotados: contatos e visitas.
- Páginas 16–18: mapas de empatia justificam transparência e redução de trabalho manual, mas não apresentam dados quantitativos.
- Páginas 19–24: protótipos não cobrem agenda, mensagens e painéis completos. RG aparece no esboço, mas não em RF01: não coletado.
- Páginas 25–30: Node.js/Java sem fronteiras claras. Consolidado em Next + Spring; MySQL preservado. IDE não é dependência de execução.
- Páginas 31–38: requisitos duplicados, CPF chamado de autêntico, realização automática, conflito apenas alertado e retenção permanente. Decisões corrigidas estão na arquitetura.
- Páginas 39–42: C4 com ASP.NET/Oracle diverge do texto; realidade aumentada sem RF; diagrama chamado de componente é de classes, incluindo pagamentos/departamentos não especificados. Proprietário não possui caso de uso completo.
- Páginas 43–44: UC01 mistura login anterior à busca com login somente para visita. Implementado catálogo público e agendamento autenticado com confirmação do corretor.
- Páginas 45–47: esquema não cobre CPF, imagens, corretor, finalidade, disponibilidade, mensagens, contratos e restrições. Reformulado; pagamentos excluídos. Sessões passam a ser múltiplas e revogáveis.
- Páginas 48–49: conclusão afirma sucesso sem evidência operacional. Referências exigem uniformização e links completos; não são validação empírica do software.
- Páginas 50–52: Kanban acadêmico, responsabilidades e conversa qualitativa com proprietários. Autoria preservada; entrega técnica organizada pelos marcos do plano, sem atribuir compromissos individuais não combinados.

O PDF não foi sobrescrito. Este diagnóstico e os diagramas novos constituem a revisão.
