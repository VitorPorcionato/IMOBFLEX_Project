"use client";
import { useState } from "react";
import Link from "next/link";
import { useResource } from "@/features/useResource";
import { useUser } from "@/features/DashboardShell";
import { api } from "@/lib/api";
import { labels, dateTime } from "@/lib/format";
import { Notice } from "@/components/Fields";
export default function Visits() {
  const { data, error, reload, setError } = useResource("/visits");
  const user = useUser(),
    staff = ["ADMIN", "BROKER"].includes(user.role);
  const [view, setView] = useState("list"),
    [month, setMonth] = useState(new Date().toISOString().slice(0, 7)),
    [busy, setBusy] = useState(false);
  async function status(id, status) {
    setBusy(true);
    try {
      await api(`/visits/${id}/status`, { method: "PATCH", body: { status } });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const dayOf = (v) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(v));
  const [year, m] = month.split("-").map(Number);
  return (
    <>
      <div className="section-heading">
        <h2>{staff ? "Agenda de visitas" : "Minhas visitas"}</h2>
        <div className="actions">
          <button
            className={`btn ${view === "list" ? "" : "secondary"} small`}
            onClick={() => setView("list")}
          >
            Lista
          </button>
          <button
            className={`btn ${view === "calendar" ? "" : "secondary"} small`}
            onClick={() => setView("calendar")}
          >
            Calendário
          </button>
        </div>
      </div>
      <Notice message={error} />
      {view === "calendar" && (
        <>
          <label className="mb-5">
            Mês
            <input
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
            />
          </label>
          <div className="table-scroll">
            <div className="calendar-grid">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <strong key={d}>{d}</strong>
              ))}
              {Array.from(
                { length: new Date(year, m - 1, 1).getDay() },
                (_, i) => (
                  <div key={"blank" + i} />
                ),
              )}
              {Array.from(
                { length: new Date(year, m, 0).getDate() },
                (_, i) => {
                  const day = `${month}-${String(i + 1).padStart(2, "0")}`;
                  return (
                    <div className="calendar-cell" key={day}>
                      <strong>{i + 1}</strong>
                      {data
                        ?.filter((v) => dayOf(v.starts_at) === day)
                        .map((v) => (
                          <a
                            href={`#visita-${v.id}`}
                            key={v.id}
                            onClick={() => setView("list")}
                          >
                            {dateTime(v.starts_at).split(", ")[1]} {v.title}
                            <br />
                            {labels[v.status]}
                          </a>
                        ))}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </>
      )}
      {view === "list" &&
        (data?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Imóvel e data</th>
                  {staff && <th>Cliente</th>}
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.map((v) => (
                  <tr key={v.id} id={`visita-${v.id}`}>
                    <td data-label="Imóvel e data">
                      <strong>{v.title}</strong>
                      <br />
                      {dateTime(v.starts_at)}
                      <br />
                      <small>Horário de Brasília</small>
                    </td>
                    {staff && <td data-label="Cliente">{v.client_name}</td>}
                    <td data-label="Situação">
                      {labels[v.status]}
                      {["SCHEDULED", "CONFIRMED"].includes(v.status) &&
                        new Date(v.ends_at) < new Date() && (
                          <p className="tag warning">Resultado pendente</p>
                        )}
                    </td>
                    <td data-label="Ações">
                      {["SCHEDULED", "CONFIRMED"].includes(v.status) && (
                        <div className="actions">
                          {staff &&
                            v.status === "SCHEDULED" &&
                            new Date(v.starts_at) > new Date() && (
                              <button
                                disabled={busy}
                                className="btn small"
                                onClick={() => status(v.id, "CONFIRMED")}
                              >
                                Confirmar
                              </button>
                            )}
                          {staff && new Date(v.ends_at) < new Date() && (
                            <>
                              <button
                                disabled={busy}
                                className="btn small"
                                onClick={() => status(v.id, "COMPLETED")}
                              >
                                Realizada
                              </button>
                              <button
                                disabled={busy}
                                className="btn secondary small"
                                onClick={() => status(v.id, "NO_SHOW")}
                              >
                                Não compareceu
                              </button>
                            </>
                          )}
                          <button
                            disabled={busy}
                            className="btn secondary small"
                            onClick={() =>
                              window.confirm("Cancelar esta visita?") &&
                              status(v.id, "CANCELLED")
                            }
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          data && (
            <div className="empty">
              <h2>Nenhuma visita por aqui</h2>
              <p>As solicitações e confirmações aparecerão nesta área.</p>
              <Link href="/imoveis" className="btn secondary">
                Explorar imóveis
              </Link>
            </div>
          )
        ))}
    </>
  );
}
