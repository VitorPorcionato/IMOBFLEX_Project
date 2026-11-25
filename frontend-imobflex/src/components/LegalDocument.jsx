import Link from "next/link";
export default async function LegalDocument({ kind }) {
  let doc;
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL || "http://127.0.0.1:8080"}/api/v1/public/legal/${kind}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error();
    doc = await res.json();
  } catch {
    return (
      <div className="container section legal-page">
        <h1>Documento temporariamente indisponível</h1>
        <p>
          Tente novamente. O cadastro permanece sujeito à leitura dos termos.
        </p>
        <Link
          className="btn secondary"
          href={kind === "terms" ? "/termos" : "/privacidade"}
        >
          Tentar novamente
        </Link>
      </div>
    );
  }
  const [title, ...paragraphs] = doc.text.split("\n");
  return (
    <article className="container section legal-page">
      <div className="gold-rule" />
      <h1>{title}</h1>
      <div className="legal-copy">
        {paragraphs
          .filter(Boolean)
          .map((text, i) =>
            text.length < 85 && !text.startsWith("Versão") ? (
              <h2 key={i}>{text}</h2>
            ) : (
              <p key={i}>{text}</p>
            ),
          )}
      </div>
      {kind === "privacy" && (
        <section className="privacy-panel legal-copy">
          <h2>Preferência de aparência</h2>
          <p>
            Ao escolher o modo claro ou escuro no cabeçalho, o cookie funcional
            imobflex-theme conserva somente essa escolha por seis meses. Ele não
            identifica você nem acompanha sua navegação. Você pode trocar o tema
            a qualquer momento ou remover o cookie nas configurações do
            navegador.
          </p>
          <h2>Assistente virtual e uso opcional de IA</h2>
          <p>
            As orientações locais do assistente não são enviadas a um provedor
            de IA. Ao marcar a autorização no chat, sua pergunta e uma
            orientação pública da Imobflex poderão ser enviadas à Groq para
            gerar a resposta. Não envie documentos, senhas ou informações
            pessoais. Essa autorização é independente de marketing e cookies
            opcionais e pode ser desmarcada antes de cada envio.
          </p>
          <p>
            A aplicação não grava o texto da conversa no banco. As mensagens
            ficam na memória da página e podem ser apagadas em Limpar conversa.
            Se a IA estiver indisponível, o assistente apresenta uma orientação
            local. O atendimento de direitos continua disponível na Central de
            Privacidade.
          </p>
        </section>
      )}
      <Link className="btn secondary" href="/central-privacidade">
        Acessar meus dados e escolhas
      </Link>
    </article>
  );
}
