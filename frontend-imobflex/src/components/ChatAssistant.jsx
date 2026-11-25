"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

export default function ChatAssistant() {
  const [open, setOpen] = useState(false),
    [messages, setMessages] = useState([]);
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [useAi, setUseAi] = useState(false),
    [error, setError] = useState("");
  const input = useRef(null),
    trigger = useRef(null),
    log = useRef(null),
    pending = useRef(false);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, busy]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  async function send(value) {
    const message = value.trim();
    if (!message || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setText("");
    setMessages((items) => [
      ...items.slice(-18),
      { speaker: "Você", reply: message },
    ]);
    try {
      const answer = await api("/public/chat", {
        method: "POST",
        body: { message, useAi },
      });
      setMessages((items) => [...items, { speaker: "Imobflex", ...answer }]);
    } catch (failure) {
      setError(failure.message);
      setText(message);
    } finally {
      pending.current = false;
      setBusy(false);
      input.current?.focus();
    }
  }
  return (
    <aside
      className="chat-assistant"
      aria-label="Assistente virtual da Imobflex"
    >
      {open && (
        <section
          className="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-title"
          id="imobflex-chat"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <header className="chat-heading">
            <div className="chat-monogram" aria-hidden="true">
              i
            </div>
            <div>
              <h2 id="chat-title">Assistente Imobflex</h2>
              <p>Busca, visitas e atendimento</p>
            </div>
            <button
              className="chat-icon"
              aria-label="Limpar conversa"
              onClick={() => {
                setMessages([]);
                setError("");
                input.current?.focus();
              }}
              disabled={busy}
            >
              <Trash2 size={18} />
            </button>
            <button
              className="chat-icon"
              aria-label="Fechar conversa"
              onClick={close}
            >
              <X size={21} />
            </button>
          </header>
          <div
            className="chat-messages"
            ref={log}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Mensagens do assistente"
          >
            <div className="chat-message">
              <p>
                Olá! Posso ajudar a encontrar imóveis e explicar como solicitar
                uma visita. O que você procura?
              </p>
            </div>
            {!messages.length && (
              <div className="chat-suggestions">
                {[
                  "Quero alugar um imóvel",
                  "Imóveis à venda",
                  "Como agendar uma visita?",
                ].map((value) => (
                  <button
                    key={value}
                    disabled={busy}
                    onClick={() => send(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${message.speaker === "Você" ? "from-user" : ""}`}
              >
                <span className="sr-only">{message.speaker}: </span>
                <p>{message.reply}</p>
                {message.links?.map((link) => (
                  <Link href={link.href} key={link.href} onClick={close}>
                    {link.title}
                  </Link>
                ))}
                {message.mode && (
                  <small>
                    {message.mode === "GROQ"
                      ? "Resposta com IA · confirme os detalhes com a equipe"
                      : "Orientação local · sem envio à IA"}
                  </small>
                )}
              </div>
            ))}
            {busy && <p role="status">Preparando uma resposta…</p>}
          </div>
          <form
            className="chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              send(text);
            }}
          >
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <label htmlFor="chat-message">Sua pergunta</label>
            <div className="chat-input">
              <input
                id="chat-message"
                ref={input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000}
                placeholder="Como posso solicitar uma visita?"
                autoComplete="off"
              />
              <button
                className="btn"
                disabled={busy || !text.trim()}
                aria-label="Enviar pergunta"
              >
                <Send size={19} />
              </button>
            </div>
            <label className="chat-consent">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
              />
              Autorizar envio desta pergunta à Groq para resposta com IA.
            </label>
            <p className="chat-privacy">
              Não envie senha, CPF ou dados pessoais. A conversa não é salva na
              sua conta.{" "}
              <Link href="/privacidade" onClick={close}>
                Entenda seus dados
              </Link>
            </p>
          </form>
        </section>
      )}
      <button
        ref={trigger}
        className="chat-launcher"
        aria-label={open ? "Fechar assistente" : "Abrir assistente Imobflex"}
        aria-expanded={open}
        aria-controls={open ? "imobflex-chat" : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <MessageCircle size={23} aria-hidden="true" />
        <span>Precisa de ajuda?</span>
      </button>
    </aside>
  );
}
