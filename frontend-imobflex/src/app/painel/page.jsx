"use client";
import Link from "next/link";
import { useUser } from "@/features/DashboardShell";
import { useResource } from "@/features/useResource";
import { Notice } from "@/components/Fields";
import { labels, dateTime } from "@/lib/format";
function ClientOverview() {
  const visits = useResource("/visits");
  const notifications = useResource("/notifications");
  const upcoming = visits.data
    ?.filter((v) => ["SCHEDULED", "CONFIRMED"].includes(v.status) && new Date(v.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const unread = notifications.data?.filter((n) => !n.is_read);
  return (
    <div className="client-overview">
      <div className="section-heading">
        <div>
          <h2>Minha área</h2>
          <p className="muted">Tudo para acompanhar sua busca pelo próximo imóvel.</p>
        </div>
        <Link href="/imoveis" className="btn secondary">Buscar imóveis</Link>
      </div>
      <Notice message={visits.error || notifications.error} />
      <div className="stats">
        <Link className="stat" href="/painel/visitas">
          <span>Próximas visitas</span><strong>{upcoming?.length ?? "…"}</strong>
        </Link>
        <Link className="stat" href="/painel/notificacoes">
          <span>Notificações não lidas</span><strong>{unread?.length ?? "…"}</strong>
        </Link>
      </div>
      <section className="client-section">
        <div className="section-heading">
          <h2>Próximas visitas</h2>
          <Link href="/painel/visitas" className="text-crimson">Ver todas as visitas</Link>
        </div>
        {visits.error ? (
          <button className="btn secondary" onClick={visits.reload}>Tentar carregar visitas</button>
        ) : !visits.data ? (
          <p role="status">Carregando visitas…</p>
        ) : upcoming.length ? (
          <div className="stack">
            {upcoming.slice(0, 3).map((v) => (
              <article className="card p-5" key={v.id}>
                <span className="tag">{labels[v.status]}</span>
                <h3>{v.title}</h3><p>{dateTime(v.starts_at)}</p>
                <Link className="text-crimson" href={`/painel/visitas#visita-${v.id}`}>Acompanhar visita</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>Nenhuma visita agendada</h3>
            <p>Encontre um imóvel no catálogo e solicite um horário. A confirmação do corretor aparece aqui.</p>
            <Link href="/imoveis" className="btn">Explorar imóveis</Link>
          </div>
        )}
      </section>
      <section className="client-section">
        <div className="section-heading">
          <h2>Últimas notificações</h2>
          <Link href="/painel/notificacoes" className="text-crimson">Ver todas as notificações</Link>
        </div>
        {notifications.error ? (
          <button className="btn secondary" onClick={notifications.reload}>Tentar carregar notificações</button>
        ) : !notifications.data ? (
          <p role="status">Carregando notificações…</p>
        ) : notifications.data.length ? (
          <div className="stack">
            {notifications.data.slice(0, 3).map((n) => (
              <article className="card p-5" key={n.id}>
                <p>{n.message}</p>
                <small className="muted">{dateTime(n.created_at)}{!n.is_read && " · Não lida"}</small>
              </article>
            ))}
          </div>
        ) : <p className="muted">Você está em dia. Novas atualizações aparecerão aqui.</p>}
      </section>
      <div className="actions">
        <Link href="/painel/mensagens" className="btn secondary">Minhas conversas</Link>
        <Link href="/central-privacidade" className="btn secondary">Meus dados e privacidade</Link>
      </div>
    </div>
  );
}
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
    <ClientOverview />
  );
}
