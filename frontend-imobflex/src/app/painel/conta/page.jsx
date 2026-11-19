"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/features/DashboardShell";
import { api } from "@/lib/api";
import { Field, Notice } from "@/components/Fields";
export default function Account() {
  const u = useUser(),
    router = useRouter();
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api("/me", { method: "PUT", body: data });
      if (data.email !== u.email) router.push("/login");
      else setMessage("Dados atualizados.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !window.confirm(
        "Desativar sua conta e encerrar as sessões? Seu histórico será preservado.",
      )
    )
      return;
    try {
      await api("/me", { method: "DELETE" });
      router.push("/");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <>
      <h2>Minha conta</h2>
      <Notice message={error} />
      <Notice message={message} success />
      <form className="stack max-w-xl" onSubmit={save}>
        {[
          ["name", "Nome completo", "text"],
          ["email", "E-mail", "email"],
          ["phone", "Telefone", "tel"],
        ].map(([name, label, type]) => (
          <Field
            key={name}
            label={label}
            name={name}
            type={type}
            required={name !== "phone"}
            defaultValue={u[name]}
          />
        ))}
        <p>Alterar o e-mail exige nova confirmação.</p>
        <button className="btn justify-self-start" disabled={busy}>
          Salvar dados
        </button>
      </form>
      <hr className="my-8 border-gray-200" />
      <h2>Desativar conta</h2>
      <p>
        O histórico será mantido. Visitas futuras devem ser resolvidas antes da
        desativação.
      </p>
      <button className="btn secondary" onClick={remove}>
        Desativar minha conta
      </button>
    </>
  );
}
