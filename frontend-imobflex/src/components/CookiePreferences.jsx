"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function CookiePreferences() {
  const [open, setOpen] = useState(false),
    [choice, setChoice] = useState(null);
  useEffect(() => {
    const read = () => {
      try {
        const raw = document.cookie
          .split("; ")
          .find((c) => c.startsWith("imobflex_privacy="));
        const value = raw
          ? JSON.parse(decodeURIComponent(raw.split("=")[1]))
          : null;
        const valid =
          value?.version === 1 &&
          typeof value.optional === "boolean" &&
          value.expires > Date.now();
        setChoice(valid ? value : null);
        setOpen(!valid);
      } catch {
        setOpen(true);
      }
    };
    read();
    const show = () => {
      setOpen(true);
      window.scrollTo({ top: 0 });
      requestAnimationFrame(() =>
        document.getElementById("cookie-title")?.focus(),
      );
    };
    window.addEventListener("privacy-preferences", show);
    return () => window.removeEventListener("privacy-preferences", show);
  }, []);
  function save(optional) {
    const value = {
      version: 1,
      optional,
      expires: Date.now() + 180 * 86400000,
    };
    document.cookie = `imobflex_privacy=${encodeURIComponent(JSON.stringify(value))}; Max-Age=15552000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setChoice(value);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("privacy-choice", { detail: value }));
  }
  return (
    <>
      {open && (
        <section className="cookie-banner" aria-labelledby="cookie-title">
          <div>
            <h2 id="cookie-title" tabIndex={-1}>
              Sua privacidade, suas escolhas
            </h2>
            <p>
              Usamos cookies necessários para segurança e acesso à conta. Sua
              escolha de opcionais fica guardada por seis meses. Hoje não usamos
              rastreadores opcionais.
            </p>
            <Link href="/privacidade">Entenda os cookies e seus dados</Link>
          </div>
          <div className="cookie-actions">
            <button className="btn secondary" onClick={() => save(false)}>
              Recusar opcionais
            </button>
            <button className="btn secondary" onClick={() => save(true)}>
              Aceitar opcionais
            </button>
            {choice && (
              <button className="btn secondary" onClick={() => setOpen(false)}>
                Fechar sem alterar
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      className="privacy-preferences-link"
      type="button"
      onClick={() => window.dispatchEvent(new Event("privacy-preferences"))}
    >
      Preferências de cookies
    </button>
  );
}
