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
      <Link className="btn secondary" href="/central-privacidade">
        Acessar meus dados e escolhas
      </Link>
    </article>
  );
}
