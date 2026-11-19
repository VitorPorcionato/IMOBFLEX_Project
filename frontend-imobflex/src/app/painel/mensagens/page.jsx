"use client";
import { useResource } from "@/features/useResource";
import { useUser } from "@/features/DashboardShell";
import { api } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { Notice } from "@/components/Fields";
import { useState } from "react";
export default function Messages() {
  const { data, error, reload, setError } = useResource("/contacts");
  const user = useUser();
  const [busy, setBusy] = useState(false);
  async function reply(e, id) {
    e.preventDefault();
    setBusy(true);
    const form = e.currentTarget;
    try {
      await api(`/contacts/${id}/replies`, {
        method: "POST",
        body: Object.fromEntries(new FormData(form)),
      });
      form.reset();
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h2>Conversas sobre imóveis</h2>
      <Notice message={error} />
      <div className="stack">
        {data?.map((c) => (
          <article className="card p-6" key={c.id}>
            <span className="tag">{c.title}</span>
            <h2 className="mt-3">{c.name}</h2>
            <p className="muted text-sm">
              {dateTime(c.created_at)} · {c.email} · {c.phone}
            </p>
            <p className="whitespace-pre-wrap">{c.message}</p>
            {c.replies.map((r) => (
              <div className="border-l-2 border-gold pl-4 my-5" key={r.id}>
                <strong>{r.author}</strong>
                <small className="block muted">{dateTime(r.created_at)}</small>
                <p className="whitespace-pre-wrap">{r.body}</p>
              </div>
            ))}
            {["ADMIN", "BROKER"].includes(user.role) && (
              <form onSubmit={(e) => reply(e, c.id)} className="stack">
                <label>
                  Responder ao cliente
                  <textarea name="message" required maxLength={4000} />
                </label>
                <button className="btn justify-self-start" disabled={busy}>
                  Enviar resposta por e-mail
                </button>
              </form>
            )}
          </article>
        ))}
        {data && !data.length && (
          <div className="empty">
            Nenhuma conversa registrada. Mensagens enviadas pelos anúncios
            aparecerão aqui.
          </div>
        )}
      </div>
    </>
  );
}
