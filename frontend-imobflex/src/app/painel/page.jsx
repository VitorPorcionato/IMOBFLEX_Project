"use client";
import Link from "next/link";
import { useUser } from "@/features/DashboardShell";
import { useResource } from "@/features/useResource";
import { Notice } from "@/components/Fields";
import { labels } from "@/lib/format";
function Stats() {
  const { data, error } = useResource("/dashboard");
  return (
    <>
      <Notice message={error} />
      {data ? (
        <>
          <h2>Operação em um olhar</h2>
          <div className="stats">
            <div className="stat">
              <span>Imóveis cadastrados</span>
              <strong>
                {data.properties.reduce((n, p) => n + Number(p.total), 0)}
              </strong>
            </div>
            <div className="stat">
              <span>Contatos recebidos</span>
              <strong>{data.contacts}</strong>
            </div>
            <div className="stat">
              <span>Visitas sem resultado</span>
              <strong>{data.pending_results}</strong>
            </div>
          </div>
          <h2 className="mt-8">Imóveis por situação</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Situação</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {data.properties.map((p) => (
                  <tr key={p.status}>
                    <td data-label="Situação">{labels[p.status]}</td>
                    <td data-label="Quantidade">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2 className="mt-8">Visitas</h2>
          <div className="actions">
            {data.visits.map((v) => (
              <span key={v.status} className="tag">
                {labels[v.status]}: {v.total}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p>Carregando indicadores…</p>
      )}
    </>
  );
}
export default function Dashboard() {
  const user = useUser();
  return ["ADMIN", "BROKER"].includes(user.role) ? (
    <Stats />
  ) : (
    <div className="empty">
      <h2>Seu próximo lugar está esperando</h2>
      <p>
        Encontre um imóvel no catálogo e solicite uma visita. Você acompanha a
        confirmação e suas mensagens nesta área.
      </p>
      <Link href="/imoveis" className="btn">
        Explorar imóveis
      </Link>
    </div>
  );
}
