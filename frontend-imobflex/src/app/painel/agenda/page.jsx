"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/features/DashboardShell";
import { Field, Notice } from "@/components/Fields";
import { dateTime } from "@/lib/format";
const days = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];
export default function Calendar() {
  const user = useUser();
  const [broker, setBroker] = useState(String(user.id)),
    [options, setOptions] = useState([]),
    [data, setData] = useState(null),
    [windows, setWindows] = useState([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function load(id) {
    try {
      const d = await api(`/calendar?broker_id=${id}`);
      setData(d);
      setWindows(
        d.windows.map(({ weekday, start_hour, end_hour }) => ({
          weekday,
          start_hour,
          end_hour,
        })),
      );
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    api("/users/options")
      .then(setOptions)
      .catch((e) => setError(e.message));
    load(broker);
  }, [broker]);
  async function run(path, method, body) {
    setError("");
    setMessage("");
    try {
      await api(path, { method, body });
      setMessage("Agenda atualizada.");
      await load(broker);
    } catch (e) {
      setError(e.message);
    }
  }
  function windowValue(index, name, value) {
    setWindows((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [name]: Number(value) } : w)),
    );
  }
  return (
    <>
      <h2>Disponibilidade para visitas</h2>
      <p className="muted">
        Horários de Brasília. Cada visita ocupa uma hora. Alterações na grade
        não cancelam reservas já feitas.
      </p>
      <Notice message={error} />
      <Notice message={message} success />
      {user.role === "ADMIN" && (
        <label className="my-5">
          Corretor
          <select value={broker} onChange={(e) => setBroker(e.target.value)}>
            {options
              .filter((o) => ["ADMIN", "BROKER"].includes(o.role))
              .map((o) => (
                <option value={o.id} key={o.id}>
                  {o.name}
                </option>
              ))}
          </select>
        </label>
      )}
      <div className="stack">
        {windows.map((win, i) => (
          <div className="availability-row" key={i}>
            <label>
              Dia
              <select
                value={win.weekday}
                onChange={(e) => windowValue(i, "weekday", e.target.value)}
              >
                {days.map((d, n) => (
                  <option key={d} value={n + 1}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Das (hora)"
              type="number"
              min="0"
              max="23"
              value={win.start_hour}
              onChange={(e) => windowValue(i, "start_hour", e.target.value)}
            />
            <Field
              label="Até (hora)"
              type="number"
              min="1"
              max="24"
              value={win.end_hour}
              onChange={(e) => windowValue(i, "end_hour", e.target.value)}
            />
            <button
              className="btn secondary small"
              onClick={() => setWindows((w) => w.filter((_, n) => n !== i))}
            >
              Remover
            </button>
          </div>
        ))}
        <div className="actions">
          <button
            className="btn secondary"
            onClick={() =>
              setWindows((w) => [
                ...w,
                { weekday: 1, start_hour: 9, end_hour: 18 },
              ])
            }
          >
            Adicionar intervalo
          </button>
          <button
            className="btn"
            onClick={() =>
              run("/calendar", "PUT", { broker_id: Number(broker), windows })
            }
          >
            Salvar disponibilidade
          </button>
        </div>
      </div>
      <hr className="my-8 border-gray-200" />
      <h2>Bloquear um período</h2>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const v = Object.fromEntries(new FormData(e.currentTarget));
          run("/calendar/blocks", "POST", {
            broker_id: Number(broker),
            property_id: v.property_id ? Number(v.property_id) : null,
            starts_at: new Date(v.starts_at + ":00-03:00").toISOString(),
            ends_at: new Date(v.ends_at + ":00-03:00").toISOString(),
            reason: v.reason,
          });
        }}
      >
        <div className="field-grid">
          <Field
            label="Início (Brasília)"
            name="starts_at"
            type="datetime-local"
            required
          />
          <Field
            label="Fim (Brasília)"
            name="ends_at"
            type="datetime-local"
            required
          />
          <Field
            label="Código do imóvel (opcional)"
            name="property_id"
            type="number"
            min="1"
          />
          <Field label="Motivo" name="reason" required maxLength={200} />
        </div>
        <button className="btn secondary justify-self-start">
          Bloquear período
        </button>
      </form>
      <div className="stack mt-5">
        {data?.blocks.map((b) => (
          <div className="card p-4" key={b.id}>
            {dateTime(b.starts_at)} até {dateTime(b.ends_at)} · {b.reason}
            <button
              className="btn secondary small ml-3"
              onClick={() => run(`/calendar/blocks/${b.id}`, "DELETE")}
            >
              Remover bloqueio
            </button>
          </div>
        ))}
      </div>
      <hr className="my-8 border-gray-200" />
      <h2>Feriados e cobertura do calendário</h2>
      <p>
        Anos revisados: {data?.years.map((y) => y.year).join(", ")}. Não são
        oferecidas visitas em anos sem cobertura.
      </p>
      {user.role === "ADMIN" && (
        <>
          <form
            className="field-grid"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                "/calendar/holidays",
                "PUT",
                Object.fromEntries(new FormData(e.currentTarget)),
              );
            }}
          >
            <Field label="Data do feriado" name="day" type="date" required />
            <Field label="Nome" name="name" required maxLength={150} />
            <button className="btn secondary justify-self-start">
              Salvar feriado
            </button>
          </form>
          <form
            className="actions my-5 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const year = new FormData(e.currentTarget).get("year");
              run(`/calendar/years/${year}`, "PUT");
            }}
          >
            <Field
              label="Ano revisado"
              name="year"
              type="number"
              min="2026"
              max="2100"
              required
            />
            <button className="btn secondary">
              Confirmar cobertura do ano
            </button>
          </form>
          <p className="muted">
            Cadastre todos os feriados do ano antes de confirmar a cobertura.
          </p>
        </>
      )}
      <details>
        <summary>Consultar feriados cadastrados</summary>
        <ul className="stack mt-4">
          {data?.holidays.map((h) => (
            <li key={h.day}>
              {h.day} · {h.name}
              {user.role === "ADMIN" && (
                <button
                  className="btn secondary small ml-3"
                  onClick={() => run(`/calendar/holidays/${h.day}`, "DELETE")}
                >
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
