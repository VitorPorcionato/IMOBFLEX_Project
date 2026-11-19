"use client";
import { useResource } from "@/features/useResource";
import { dateTime } from "@/lib/format";
import { Notice } from "@/components/Fields";
export default function Audit() {
  const { data, error } = useResource("/admin/audit");
  return (
    <>
      <h2>Histórico de operações</h2>
      <Notice message={error} />
      <p className="muted">Últimos 200 registros.</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Responsável</th>
              <th>Operação</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id}>
                <td data-label="Data">{dateTime(a.created_at)}</td>
                <td data-label="Responsável">#{a.actor_id}</td>
                <td data-label="Operação">
                  {a.action}
                  <br />
                  {a.resource_type} #{a.resource_id}
                </td>
                <td data-label="Detalhes">
                  <details>
                    <summary>Ver alterações</summary>
                    <p className="max-w-xl break-words whitespace-pre-wrap">
                      {a.details}
                    </p>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
