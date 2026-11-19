"use client";
import { useResource } from "@/features/useResource";
import { api } from "@/lib/api";
import { labels } from "@/lib/format";
import { Field, Notice } from "@/components/Fields";
import { useState } from "react";
export default function Users() {
  const { data, error, reload, setError } = useResource("/users");
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    const form = e.currentTarget;
    const { role, ...user } = Object.fromEntries(new FormData(form));
    try {
      await api("/users", { method: "POST", body: { role, user } });
      form.reset();
      setMessage("Cadastro criado. Confirmação enviada por e-mail.");
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function deactivate(id) {
    if (!window.confirm("Desativar esta conta? O histórico será preservado."))
      return;
    try {
      await api(`/users/${id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <>
      <h2>Usuários e proprietários</h2>
      <Notice message={error} />
      <Notice message={message} success />
      <details className="card p-5 my-5">
        <summary>Cadastrar corretor ou proprietário</summary>
        <form onSubmit={create} className="stack mt-5">
          <div className="field-grid">
            <label>
              Perfil
              <select name="role">
                <option value="BROKER">Corretor</option>
                <option value="OWNER">Proprietário</option>
              </select>
            </label>
            {[
              ["name", "Nome completo", "text"],

              ["email", "E-mail", "email"],
              ["phone", "Telefone", "tel"],

              ["password", "Senha inicial", "password"],
            ].map(([name, label, type]) => (
              <Field
                key={name}
                label={label}
                name={name}
                type={type}
                required={name !== "phone"}
                minLength={name === "password" ? 8 : undefined}
              />
            ))}
          </div>
          <small>
            Senha: mínimo 8 caracteres, maiúscula, minúscula e número.
          </small>
          <button className="btn justify-self-start" disabled={busy}>
            Criar cadastro
          </button>
        </form>
      </details>
      {data && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id}>
                  <td data-label="Nome">
                    {u.name}
                    <br />
                    <small>{u.email}</small>
                  </td>
                  <td data-label="Perfil">{labels[u.role]}</td>
                  <td data-label="Situação">
                    {!u.active
                      ? "Inativo"
                      : u.confirmed
                        ? "Ativo"
                        : "E-mail não confirmado"}
                  </td>
                  <td data-label="Ação">
                    {u.active && u.role !== "ADMIN" && (
                      <button
                        className="btn secondary small"
                        onClick={() => deactivate(u.id)}
                      >
                        Desativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
