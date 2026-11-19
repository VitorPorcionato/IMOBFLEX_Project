"use client";
import Link from "next/link";
import { useState } from "react";
import { useResource } from "@/features/useResource";
import { api } from "@/lib/api";
import { labels, money } from "@/lib/format";
import { Notice } from "@/components/Fields";
import { useUser } from "@/features/DashboardShell";
export default function Properties() {
  const { data, error, reload, setError } = useResource("/properties");
  const [busy, setBusy] = useState(false);
  const user = useUser();
  async function status(id, value) {
    setBusy(true);
    try {
      await api(`/properties/${id}/status`, {
        method: "PATCH",
        body: { status: value },
      });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (
      !window.confirm(
        "Excluir este imóvel pendente? Imóveis com histórico devem ser inativados.",
      )
    )
      return;
    try {
      await api(`/properties/${id}`, { method: "DELETE" });
      await reload();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <div className="section-heading">
        <h2>Gestão de imóveis</h2>
        <Link href="/painel/imoveis/novo" className="btn">
          Cadastrar imóvel
        </Link>
      </div>
      <Notice message={error} />
      {data?.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Valor</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td data-label="Imóvel">
                    <strong>{p.title}</strong>
                    <br />
                    <small>
                      {p.city} · #{p.id}
                    </small>
                  </td>
                  <td data-label="Valor">
                    {money(p.sale_price || p.rent_price)}
                  </td>
                  <td data-label="Situação">
                    <span className="tag">{labels[p.status]}</span>
                    <label className="mt-2">
                      Alterar situação
                      <select
                        aria-label={`Situação de ${p.title}`}
                        disabled={
                          busy ||
                          (p.status === "PENDING" && user.role !== "ADMIN")
                        }
                        value=""
                        onChange={(e) =>
                          e.target.value && status(p.id, e.target.value)
                        }
                      >
                        <option value="">Selecione</option>
                        {[
                          "AVAILABLE",
                          "NEGOTIATING",
                          "SOLD",
                          "RENTED",
                          "INACTIVE",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {labels[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </td>
                  <td data-label="Ações">
                    <div className="actions">
                      <Link
                        className="btn secondary small"
                        href={`/painel/imoveis/${p.id}`}
                      >
                        Editar e fotos
                      </Link>
                      {p.status === "PENDING" && (
                        <button
                          className="btn secondary small"
                          onClick={() => remove(p.id)}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        data && (
          <div className="empty">
            <h2>Cadastre o primeiro imóvel</h2>
            <p>
              Comece pelos dados e inclua ao menos três fotografias antes de
              solicitar a publicação.
            </p>
          </div>
        )
      )}
    </>
  );
}
