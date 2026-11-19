"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Field, Notice } from "@/components/Fields";
export default function PrivacyCenter({ unsubscribe = false }) {
  const [token, setToken] = useState(""),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [guest, setGuest] = useState(false);
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("token") || "";
    setToken(t);
    if (!unsubscribe) {
      if (t) {
        setGuest(true);
        api("/public/privacy/data", { method: "POST", body: { token: t } })
          .then(setData)
          .catch((e) => setError(e.message));
      } else
        api("/privacy/data")
          .then(setData)
          .catch((e) => {
            if (e.status === 401) setGuest(true);
            else setError(e.message);
          });
    }
  }, [unsubscribe]);
  async function run(action) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function request(kind) {
    const result = await api(
      guest ? "/public/privacy/requests" : "/privacy/requests",
      { method: "POST", body: { token, kind } },
    );
    setMessage(
      `Pedido registrado. Protocolo #${result.id}. Acompanhe a resposta nesta central pelo seu link de verificação.`,
    );
    if (kind === "DELETE") {
      setData(null);
      setGuest(true);
    } else {
      setData(
        await api(
          guest ? "/public/privacy/data" : "/privacy/data",
          guest ? { method: "POST", body: { token } } : {},
        ),
      );
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "meus-dados-imobflex.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="container section legal-page">
      <div className="gold-rule" />
      <h1>
        {unsubscribe
          ? "Cancelar ofertas por e-mail"
          : "Meus dados e privacidade"}
      </h1>
      <p className="legal-intro">
        Você decide sobre as ofertas e acompanha o uso dos seus dados.
      </p>
      <Notice message={error} />
      <Notice message={message} success />
      {unsubscribe ? (
        <>
          <p>
            Confirme abaixo para cancelar ofertas. Mensagens de atendimento,
            visitas e segurança continuam disponíveis.
          </p>
          <button
            className="btn"
            disabled={!token || busy}
            onClick={() =>
              run(async () => {
                await api("/public/privacy/unsubscribe", {
                  method: "POST",
                  body: { token },
                });
                setMessage(
                  "Preferência atualizada. Você não receberá novas ofertas por esta autorização.",
                );
              })
            }
          >
            Confirmar descadastro
          </button>
        </>
      ) : data ? (
        <div className="stack">
          <section className="privacy-panel">
            <h2>Seus dados</h2>
            <p>
              Esta cópia contém os dados vinculados ao seu e-mail, sem senhas,
              tokens ou dados de terceiros.
            </p>
            <button className="btn secondary" onClick={download}>
              Baixar meus dados
            </button>
            <details>
              <summary>Consultar dados e protocolos</summary>
              <pre className="privacy-data">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => run(() => request("ACCESS"))}
            >
              Solicitar declaração completa de acesso
            </button>
          </section>
          {!guest && (
            <>
              <section className="privacy-panel">
                <h2>Termos de Uso</h2>
                <p>
                  <Link href="/termos">Leia a versão 2026-11-16</Link>. Você
                  encontra o histórico de aceite na sua cópia de dados.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      await api("/privacy/accept", {
                        method: "POST",
                        body: { accepted: true, version: "2026-11-16" },
                      });
                      setMessage("Aceite registrado com versão e horário.");
                      setData(await api("/privacy/data"));
                    });
                  }}
                >
                  <label className="check-row">
                    <input type="checkbox" required />
                    <span>Li e aceito os Termos de Uso atuais.</span>
                  </label>
                  <button className="btn" disabled={busy}>
                    Registrar aceite
                  </button>
                </form>
              </section>
              <section className="privacy-panel">
                <h2>Ofertas por e-mail</h2>
                <p>
                  Preferência atual:{" "}
                  {data.marketing?.[0]?.allowed
                    ? "autorizadas"
                    : "não autorizadas"}
                  . Autorizar é opcional e não altera seu atendimento.
                </p>
                <div className="actions">
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await api("/privacy/marketing", {
                          method: "PUT",
                          body: { allowed: true },
                        });
                        setData(await api("/privacy/data"));
                        setMessage(
                          "Preferência registrada. O piloto não envia campanhas reais.",
                        );
                      })
                    }
                  >
                    Quero receber ofertas
                  </button>
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await api("/privacy/marketing", {
                          method: "PUT",
                          body: { allowed: false },
                        });
                        setData(await api("/privacy/data"));
                        setMessage("Autorização revogada.");
                      })
                    }
                  >
                    Cancelar ofertas
                  </button>
                </div>
              </section>
            </>
          )}
          <section className="privacy-panel">
            <h2>Solicitar exclusão</h2>
            <p>
              O pedido remove ou anonimiza dados dispensáveis e revoga sessões e
              marketing. Se houver visita ou vínculo pendente, a equipe informa
              o motivo e acompanha a resolução no protocolo.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(() => request("DELETE"));
              }}
            >
              <label className="check-row">
                <input type="checkbox" required />
                <span>Quero solicitar exclusão dos meus dados.</span>
              </label>
              <button className="btn secondary" disabled={busy}>
                Registrar pedido de exclusão
              </button>
            </form>
          </section>
        </div>
      ) : (
        <form
          className="stack privacy-panel"
          onSubmit={(e) => {
            e.preventDefault();
            const email = new FormData(e.currentTarget).get("email");
            run(async () => {
              const r = await api("/public/privacy/verify", {
                method: "POST",
                body: { email },
              });
              setMessage(r.message);
            });
          }}
        >
          <h2>Acesse por e-mail</h2>
          <p>
            Mesmo sem conta, você pode consultar seus contatos e pedir exclusão.
            Enviaremos um link válido por uma hora. No piloto, use o Mailpit.
          </p>
          <Field
            label="E-mail"
            name="email"
            type="email"
            required
            maxLength={254}
          />
          <button className="btn" disabled={busy}>
            Enviar link de verificação
          </button>
          <Link href="/login">Entrar na minha conta</Link>
        </form>
      )}
      <p className="mt-8">
        <Link href="/privacidade">Política de Privacidade</Link> ·{" "}
        <Link href="/termos">Termos de Uso</Link>
      </p>
    </div>
  );
}
