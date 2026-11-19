"use client";
import { useResource } from "@/features/useResource";
import { api } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { Notice } from "@/components/Fields";
export default function Notifications() {
  const { data, error, reload, setError } = useResource("/notifications");
  async function read(id) {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH" });
      await reload();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <h2>Notificações</h2>
      <Notice message={error} />
      <div className="stack">
        {data?.map((n) => (
          <article className="card p-5" key={n.id}>
            <p>{n.message}</p>
            <small className="muted">{dateTime(n.created_at)}</small>
            {!n.is_read && (
              <button
                className="btn secondary small ml-4"
                onClick={() => read(n.id)}
              >
                Marcar como lida
              </button>
            )}
          </article>
        ))}
        {data && !data.length && <p>Nenhuma notificação no momento.</p>}
      </div>
    </>
  );
}
