"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { safeNext } from "@/lib/format";
import { Field, Notice } from "@/components/Fields";
const titles = {
  login: "Bom ter você por aqui",
  cadastro: "Crie sua conta",
  "esqueci-senha": "Recupere seu acesso",
  "confirmar-email": "Confirme seu e-mail",
  "redefinir-senha": "Escolha uma nova senha",
};
const loginRoles = {
  CLIENT: { label: "Cliente", description: "Acompanhe suas visitas, notificações e conversas com a equipe." },
  BROKER: { label: "Corretor", description: "Gerencie seus imóveis, disponibilidade, visitas e atendimentos atribuídos." },
  ADMIN: { label: "Admin", description: "Administre imóveis, equipe, indicadores e solicitações de privacidade." },
};
export default function AuthForm({ mode }) {
  const router = useRouter(),
    params = useSearchParams();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [fields, setFields] = useState({});
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [loginRole, setLoginRole] = useState("CLIENT");
  useEffect(() => {
    setToken(params.get("token") || "");
    setReady(true);
  }, [params]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    setFields({});
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (mode === "cadastro") {
      data.terms_accepted = data.terms_accepted === "on";
      data.marketing = data.marketing === "on";
      data.terms_version = "2026-11-16";
    }
    try {
      if (mode === "login") {
        await api("/auth/login", { method: "POST", body: data });
        router.push(
          params.get("next")
            ? safeNext(params.get("next"))
            : "/painel",
        );
        router.refresh();
      } else if (mode === "cadastro") {
        const result = await api("/auth/register", {
          method: "POST",
          body: data,
        });
        setSuccess(result.message);
      } else if (mode === "esqueci-senha") {
        const result = await api("/auth/forgot-password", {
          method: "POST",
          body: data,
        });
        setSuccess(result.message);
      } else {
        await api(
          mode === "confirmar-email" ? "/auth/confirm" : "/auth/reset-password",
          { method: "POST", body: { token, password: data.password } },
        );
        setSuccess(
          mode === "confirmar-email"
            ? "E-mail confirmado. Você já pode entrar."
            : "Senha alterada. Entre com sua nova senha.",
        );
      }
    } catch (err) {
      setError(err.message);
      setFields(err.fields || {});
    } finally {
      setBusy(false);
    }
  }
  async function resend(e) {
    const email = e.currentTarget.form.elements.email.value;
    if (!email) {
      setError("Informe seu e-mail para reenviar a confirmação.");
      return;
    }
    try {
      const result = await api("/auth/resend-confirmation", {
        method: "POST",
        body: { email },
      });
      setSuccess(result.message);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="gold-rule" />
        <h1>{titles[mode]}</h1>
        <p className="muted">
          {mode === "cadastro"
            ? "Acompanhe suas visitas e converse com a equipe. Use dados fictícios no piloto."
            : mode === "login"
              ? loginRoles[loginRole].description
              : "Conclua esta etapa para acessar sua conta."}
        </p>
        <form onSubmit={submit} className="stack">
          {mode === "login" && (
            <fieldset className="login-profiles" disabled={busy || !ready}>
              <legend>Como você deseja entrar?</legend>
              <div className="login-profile-options">
                {Object.entries(loginRoles).map(([role, { label }]) => (
                  <label key={role} className={loginRole === role ? "selected" : ""}>
                    <input type="radio" name="role" value={role} checked={loginRole === role}
                      onChange={() => { setLoginRole(role); setError(""); setSuccess(""); }} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p className="muted">Use o e-mail e a senha da sua conta. O acesso depende do perfil cadastrado.</p>
            </fieldset>
          )}
          <Notice message={error} />
          <Notice message={success} success />
          {mode === "cadastro" && (
            <>
              <Field
                label="Nome completo"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                error={fields.name}
              />
            </>
          )}
          {["login", "cadastro", "esqueci-senha"].includes(mode) && (
            <Field
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              error={fields.email}
            />
          )}
          {["login", "cadastro", "redefinir-senha"].includes(mode) && (
            <>
              <Field
                label="Senha"
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "login" ? 1 : 8}
                maxLength={72}
                error={fields.password}
              />
              {mode !== "login" && (
                <small className="muted">
                  Use pelo menos 8 caracteres, com maiúscula, minúscula e
                  número.
                </small>
              )}
            </>
          )}
          {["confirmar-email", "redefinir-senha"].includes(mode) && !token && (
            <Notice message="O link não contém um token. Solicite um novo e-mail." />
          )}
          {mode === "cadastro" && (
            <fieldset className="privacy-choices">
              <legend>Suas escolhas</legend>
              <label className="check-row">
                <input type="checkbox" name="terms_accepted" required />
                <span>
                  Li e aceito os{" "}
                  <Link href="/termos" target="_blank">
                    Termos de Uso
                  </Link>{" "}
                  (versão 2026-11-16).
                </span>
              </label>
              <p>
                Veja como usamos seus dados na{" "}
                <Link href="/privacidade" target="_blank">
                  Política de Privacidade
                </Link>
                .
              </p>
              <label className="check-row">
                <input type="checkbox" name="marketing" />
                <span>
                  Quero receber ofertas de imóveis por e-mail. Posso cancelar
                  quando quiser.
                </span>
              </label>
            </fieldset>
          )}
          <button
            className="btn"
            disabled={
              busy ||
              !ready ||
              (["confirmar-email", "redefinir-senha"].includes(mode) && !token)
            }
          >
            {busy
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : mode === "cadastro"
                  ? "Criar conta"
                  : mode === "esqueci-senha"
                    ? "Enviar link"
                    : mode === "confirmar-email"
                      ? "Confirmar e-mail"
                      : "Salvar nova senha"}
          </button>
          {mode === "login" && (
            <>
              <Link href="/esqueci-senha" className="text-crimson">
                Esqueci minha senha
              </Link>
              <button
                type="button"
                className="text-crimson text-left"
                onClick={resend}
              >
                Reenviar confirmação de e-mail
              </button>
              <p>
                Ainda não tem conta?{" "}
                <Link href="/cadastro" className="text-crimson font-semibold">
                  Cadastre-se
                </Link>
              </p>
            </>
          )}
          {mode !== "login" && (
            <Link href="/login" className="text-crimson">
              Voltar para entrar
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}
