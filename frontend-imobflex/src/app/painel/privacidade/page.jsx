"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Field, Notice } from "@/components/Fields";
export default function PrivacyAdmin() {
  const [requests, setRequests] = useState([]),
    [incidents, setIncidents] = useState([]),
    [report, setReport] = useState(null),
    [message, setMessage] = useState("");
  async function load() {
    setRequests(await api("/admin/privacy/requests"));
    setIncidents(await api("/admin/privacy/incidents"));
    setReport(await api("/admin/privacy/retention"));
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  async function run(fn) {
    try {
      await fn();
      await load();
      setMessage("Registro atualizado.");
    } catch (e) {
      setMessage(e.message);
    }
  }
  return (
    <div className="stack">
      <h2>Privacidade e incidentes</h2>
      <Notice message={message} />
      <section className="privacy-panel">
        <h2>Relatório de retenção</h2>
        <p>
          Contagens sem dados pessoais. A limpeza diária depende da configuração
          operacional.
        </p>
        <pre className="privacy-data">{JSON.stringify(report, null, 2)}</pre>
      </section>
      <button
        className="btn secondary"
        onClick={() =>
          run(() => api("/admin/privacy/retention/run", { method: "POST" }))
        }
      >
        Executar limpeza revisada
      </button>
      <h2>Pedidos pendentes</h2>
      {requests.map((r) => (
        <article key={r.id} className="privacy-panel">
          <h3>
            Protocolo #{r.id}: {r.kind}
          </h3>
          <p>
            {r.email} · {r.status} · prazo{" "}
            {new Date(r.due_at).toLocaleString("pt-BR")}
          </p>
          <p>{r.response}</p>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const response = new FormData(e.currentTarget).get("response");
              run(() =>
                api(`/admin/privacy/requests/${r.id}/answer`, {
                  method: "POST",
                  body: { response },
                }),
              );
            }}
          >
            <label>
              Resposta fundamentada
              <textarea name="response" required maxLength={5000} />
            </label>
            <button className="btn secondary">
              Concluir e enviar resposta
            </button>
          </form>
        </article>
      ))}
      <section className="privacy-panel">
        <h2>Registrar incidente</h2>
        <p>
          O responsável deve avaliar risco ou dano relevante e comunicar ANPD e
          titulares em até três dias úteis quando aplicável. Este registro não
          realiza a comunicação à autoridade.
        </p>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const f = Object.fromEntries(new FormData(e.currentTarget));
            run(() =>
              api("/admin/privacy/incidents", {
                method: "POST",
                body: {
                  ...f,
                  known_at: new Date(f.known_at + ":00-03:00").toISOString(),
                  reportable: f.reportable === "on",
                },
              }),
            );
          }}
        >
          <Field
            label="Ciência do incidente (Brasília)"
            name="known_at"
            type="datetime-local"
            required
          />
          {[
            ["description", "Dados e pessoas afetadas"],
            ["risk", "Avaliação de risco e motivo para comunicar ou não"],
            ["owner", "Responsável"],
            ["containment", "Medidas de contenção"],
          ].map(([name, label]) => (
            <Field
              key={name}
              label={label}
              name={name}
              required
              maxLength={name === "owner" ? 120 : 5000}
            />
          ))}
          <label className="check-row">
            <input name="reportable" type="checkbox" />
            <span>Há risco ou dano relevante que exige comunicação</span>
          </label>
          <button className="btn">Registrar e alertar responsável</button>
        </form>
      </section>
      <section className="privacy-panel">
        <h2>Feriados administrativos</h2>
        <p>
          Calendário separado da agenda de visitas. Cadastre feriados aplicáveis
          antes de calcular prazos.
        </p>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const f = Object.fromEntries(new FormData(e.currentTarget));
            run(() =>
              api(`/admin/privacy/holidays/${f.day}`, {
                method: "PUT",
                body: { response: f.name },
              }),
            );
          }}
        >
          <Field label="Data" name="day" type="date" required />
          <Field label="Feriado" name="name" required maxLength={150} />
          <button className="btn secondary">Salvar feriado</button>
        </form>
      </section>
      {incidents.map((i) => (
        <article className="privacy-panel" key={i.id}>
          <h3>Incidente #{i.id}</h3>
          <p>
            Responsável: {i.owner}. Prazo:{" "}
            {new Date(i.due_at).toLocaleString("pt-BR")}
          </p>
          <p>{i.description}</p>
          <p>{i.risk}</p>
          <p>Contenção: {i.containment}</p>
          <p>
            Protocolo ANPD: {i.anpd_protocol || "pendente"}. Titulares:{" "}
            {i.holders_notice || "pendente"}
          </p>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const d = Object.fromEntries(new FormData(e.currentTarget));
              run(() =>
                api(`/admin/privacy/incidents/${i.id}/notice`, {
                  method: "PUT",
                  body: d,
                }),
              );
            }}
          >
            <Field
              label="Protocolo ou justificativa ANPD"
              name="anpd_protocol"
              required
              maxLength={250}
            />
            <Field
              label="Registro de comunicação aos titulares ou justificativa"
              name="holders_notice"
              required
              maxLength={5000}
            />
            <button className="btn secondary">Registrar comunicações</button>
          </form>
        </article>
      ))}
    </div>
  );
}
