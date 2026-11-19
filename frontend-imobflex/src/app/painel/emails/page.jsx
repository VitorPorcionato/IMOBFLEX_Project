"use client";
import { useResource } from "@/features/useResource";
import { api } from "@/lib/api";
import { Notice } from "@/components/Fields";
export default function Mail() {
  const { data, error, reload, setError } = useResource("/admin/mail");
  async function retry(id) {
    try {
      await api(`/admin/mail/${id}/retry`, { method: "POST" });
      await reload();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <h2>Envio de e-mails</h2>
      <Notice message={error} />
      <button className="btn secondary small mb-5" onClick={reload}>
        Atualizar
      </button>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Destinatário</th>
              <th>Assunto</th>
              <th>Situação</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((m) => (
              <tr key={m.id}>
                <td data-label="Destinatário">{m.recipient}</td>
                <td data-label="Assunto">{m.subject}</td>
                <td data-label="Situação">
                  {
                    { SENT: "Enviado", PENDING: "Na fila", FAILED: "Falhou" }[
                      m.status
                    ]
                  }{" "}
                  ({m.attempts} tentativas)
                  <br />
                  {m.last_error}
                </td>
                <td data-label="Ação">
                  {m.status === "FAILED" && (
                    <button
                      className="btn secondary small"
                      onClick={() => retry(m.id)}
                    >
                      Tentar novamente
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
