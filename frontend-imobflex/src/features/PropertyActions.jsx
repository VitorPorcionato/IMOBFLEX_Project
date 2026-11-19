"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Field, Notice } from "@/components/Fields";
import { dateTime } from "@/lib/format";
export default function PropertyActions({ property }) {
  const [cpf, setCpf] = useState("");
  const entryRequired =
    property.entry_until &&
    property.entry_until >=
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
  const [day, setDay] = useState(""),
    [slots, setSlots] = useState([]),
    [slot, setSlot] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [login, setLogin] = useState(false),
    [busy, setBusy] = useState(false);
  async function load(date) {
    setDay(date);
    setSlots([]);
    setSlot("");
    setError("");
    setMessage("");
    if (!date) return;
    setBusy(true);
    try {
      const available = await api(
        `/properties/${property.id}/slots?day=${date}`,
      );
      setSlots(available);
      if (!available.length)
        setMessage("Nenhum horário livre nessa data. Escolha outra data.");
    } catch (err) {
      if (err.status === 401) setLogin(true);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function book() {
    setBusy(true);
    setError("");
    try {
      await api("/visits", {
        method: "POST",
        body: {
          property_id: property.id,
          starts_at: slot,
          cpf: entryRequired ? cpf : undefined,
        },
      });
      setMessage(
        "Horário reservado. Acompanhe a confirmação do corretor em Minhas visitas.",
      );
      setSlots([]);
      setSlot("");
    } catch (err) {
      setError(err.message);
      setSlots([]);
      setSlot("");
    } finally {
      setBusy(false);
    }
  }
  async function contact(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    try {
      await api("/public/contacts", {
        method: "POST",
        body: {
          ...Object.fromEntries(new FormData(form)),
          property_id: property.id,
        },
      });
      setMessage("Mensagem enviada. Responderemos em até 24 horas úteis.");
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, "");
  return (
    <div className="stack">
      <Notice message={error} />
      {error.includes("termos") && (
        <Link className="btn secondary" href="/central-privacidade">
          Revisar e aceitar termos
        </Link>
      )}
      <Notice message={message} success />
      <section id="agendar">
        <h3>Conheça de perto</h3>
        {property.status === "NEGOTIATING" ? (
          <p className="notice">
            Este imóvel está em negociação. Novas visitas estão temporariamente
            suspensas.
          </p>
        ) : (
          <>
            <p className="muted text-sm">
              Escolha um horário com pelo menos 24 horas de antecedência.
            </p>
            <Field
              label="Data da visita"
              name="day"
              type="date"
              value={day}
              onChange={(e) => load(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
            {login && (
              <p>
                <Link
                  className="text-crimson underline"
                  href={`/login?next=/imoveis/${property.id}`}
                >
                  Entre ou crie sua conta
                </Link>{" "}
                para consultar e reservar horários.
              </p>
            )}
            {slots.length > 0 && (
              <div className="stack mt-4">
                <label>
                  Horário disponível
                  <select
                    aria-label="Horário disponível"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {dateTime(s)} (Brasília)
                      </option>
                    ))}
                  </select>
                </label>
                {entryRequired && (
                  <>
                    <p className="notice">
                      CPF exigido para entrada: {property.entry_reason}.
                      Destinatário: {property.entry_recipient}. Vigência:{" "}
                      {property.entry_until}. Usado somente nesta visita e
                      removido no cancelamento ou até 24 horas após o fim
                      previsto.
                    </p>
                    <Field
                      label="CPF para entrada"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      inputMode="numeric"
                      maxLength={14}
                    />
                  </>
                )}
                <button
                  className="btn"
                  disabled={!slot || busy || (entryRequired && !cpf)}
                  onClick={book}
                >
                  Solicitar visita
                </button>
              </div>
            )}
          </>
        )}
      </section>
      <hr className="border-gray-200" />
      <section id="contato">
        <h3>Fale com o corretor</h3>
        <p className="muted text-sm">Respondemos em até 24 horas úteis.</p>
        <form onSubmit={contact} className="stack">
          <Field label="Seu nome" name="name" required maxLength={120} />
          <Field
            label="E-mail"
            name="email"
            type="email"
            required
            maxLength={254}
          />
          <Field
            label="Telefone (opcional)"
            name="phone"
            type="tel"
            maxLength={30}
          />
          <label>
            Mensagem
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={4000}
              defaultValue={`Olá! Gostaria de saber mais sobre ${property.title}.`}
            />
          </label>
          <button className="btn" disabled={busy}>
            Enviar mensagem
          </button>
        </form>
        {phone && (
          <a
            className="btn secondary mt-3 w-full"
            href={`https://wa.me/${phone}?text=${encodeURIComponent("Tenho interesse no imóvel " + property.title + " — " + (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/imoveis/" + property.id)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Conversar pelo WhatsApp
          </a>
        )}
      </section>
      <button
        type="button"
        className="text-crimson underline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setMessage("Link copiado para compartilhar.");
          } catch {
            setMessage("Copie o endereço desta página para compartilhar.");
          }
        }}
      >
        Copiar link do imóvel
      </button>
    </div>
  );
}
