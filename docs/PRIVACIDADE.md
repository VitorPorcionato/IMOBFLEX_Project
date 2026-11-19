# Privacidade e operação do piloto

Implementação de 16/11/2026. Ambiente acadêmico, com dados fictícios. Não representa certificação ou garantia de conformidade jurídica. Antes de dados reais, a imobiliária deve identificar controlador e canal monitorado, validar bases legais, destinatários e retenção para suas operações. Os documentos atuais identificam expressamente o piloto.

## Documentos e prova

Textos imutáveis em `backend-imobflex/src/main/resources/legal`, versão 2026-11-16, servidos pela API. Não edite uma versão aceita: uma alteração material deve criar novos arquivos, atualizar a versão e conservar os anteriores. A tabela de aceite guarda versão, hash SHA-256 do texto, usuário e horário do servidor. Não se presume aceite de contas anteriores. Novas contas exigem aceite explícito; contas existentes aceitam pela Central de Privacidade antes das escritas operacionais. Leitura, direitos, perfil, logout e descadastro permanecem disponíveis.

Marketing é opcional, tem registro próprio e revogação. O piloto não expõe campanhas. A fila classifica SERVICE/MARKETING e revalida autorização, conta ativa e confirmação antes de enviar. A revogação cancela promoções pendentes ou com falha. Toda mensagem promocional de teste precisa de link de descadastro; um GET nunca cancela a autorização. Operações simultâneas podem concluir um envio já iniciado antes da revogação; a trava impede novos envios após a revogação confirmada.

Cookies opcionais não possuem consumidores nesta versão: não há pixels ou analytics. A preferência local dura 180 dias; recusar, expirar ou corromper a preferência não libera terceiros. Bibliotecas futuras devem usar a preferência e são revisão de escopo, não inclusão automática. WhatsApp abre apenas por clique. ViaCEP só recebe CEP após ação explícita; preenchimento manual continua possível. Telemetria de desenvolvimento do Next.js deve ser desabilitada com NEXT_TELEMETRY_DISABLED=1.

## CPF e retenção

`PRIVACY_ENCRYPTION_KEY`: Base64 de 32 bytes aleatórios. Armazene a chave fora do Git e separada do banco; sem ela a reserva que requer CPF falha de forma fechada. Não troque a chave com identidades vigentes sem migração. AES-GCM usa nonce aleatório por registro. A API exige justificativa, destinatário e vigência por imóvel. Não copia CPF do cadastro antigo e não guarda CPF enviado a imóvel sem regra. A consulta é restrita ao corretor atribuído/administrador e auditada sem valor do documento.

A migração V4 não limpa dados existentes silenciosamente. `/admin/privacy/retention` mostra contagens. A rotina inicia desabilitada: revise o relatório e teste em banco copiado; depois configure `PRIVACY_RETENTION_ENABLED=true`. A execução diária ocorre às 03:15 em Brasília; o administrador pode executar pelo painel depois da revisão. Limpa CPF de perfil/endereço antigos, termos de busca, auditorias antigas com descrição integral e aplica os prazos da política. Agendamentos cancelados apagam imediatamente o CPF; sem resultado, a expiração usa o fim previsto mais 24h. O CPF tem expurgo independente a cada minuto, com antecipação de até um minuto, mesmo quando a limpeza geral ainda está desabilitada; a API também bloqueia consulta expirada. Contatos usam o último atendimento; visitas antigas perdem o vínculo com o cliente e mantêm métricas operacionais.

A exclusão gera protocolo, revoga sessões e marketing e remove dados dispensáveis. Visita futura ou conta operacional gera revisão com motivo e prazo; o painel impede concluir exclusão enquanto houver vínculo. A resposta de acesso completo deve ser preparada pelo responsável com origem, finalidade, critérios e compartilhamentos, em até 15 dias. A cópia simplificada é imediata. O fluxo sem conta verifica o e-mail com token de uma hora; não pede documentos. Tokens não aparecem em respostas de dados, logs ou referências a sites externos.

## Backups

O piloto não agenda backups automaticamente. Se criados, devem ficar fora do Git, com acesso restrito e expiração máxima de 30 dias. O operador deve registrar data e prazo e remover cópias vencidas diariamente, incluindo réplicas. Uma restauração deve ocorrer primeiro em banco isolado, com envios e acesso público desligados. Reaplique os pedidos de exclusão posteriores ao backup, usando o registro de protocolos preservado fora da cópia restaurada, execute a retenção e confirme que os usuários removidos não reaparecem antes de liberar acesso. Não restaure banco sem a chave adequada para identidades ainda vigentes. Este procedimento é uma obrigação operacional; não é garantido por Flyway.

## Incidentes

O painel registra ciência, risco, contenção, responsável, prazo, protocolo ANPD e comunicação aos titulares. O calendário administrativo é independente da agenda de visitas e recebe inicialmente cópia dos feriados nacionais versionados. Revise feriados aplicáveis, anos futuros e indisponibilidades do responsável. O prazo é três dias úteis, contado a partir da ciência de que dados pessoais foram afetados; não espere o término da investigação. Havendo risco ou dano relevante, o responsável comunica ANPD e titulares, usando comunicação preliminar quando necessário e completando as informações. O piloto apenas registra e prepara alertas; não transmite formulário à autoridade. Lembretes diários são emitidos enquanto a comunicação indicada como necessária estiver pendente. Registros ficam restritos por pelo menos cinco anos.

Referência oficial: https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis

## E-mail de desenvolvimento

Mailpit continua no Compose. Neste Windows o Controle de Aplicativo bloqueou o executável baixado. Para testes foi usada uma caixa SMTP alternativa, sem entrega externa, `backend-imobflex/scripts/dev-mailbox.py`, com a dependência de desenvolvimento `aiosmtpd`. Escuta somente 127.0.0.1:1025 e 127.0.0.1:8025; guarda até 200 mensagens em memória, apagadas ao encerrar. Nunca usar como servidor de produção. O ensaio de SMTP indisponível permanece nos testes Java.
