"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Notice } from "@/components/Fields";
const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);
export default function DashboardShell({ children }) {
  const [user, setUser] = useState(null),
    [error, setError] = useState("");
  const path = usePathname(),
    router = useRouter();
  useEffect(() => {
    api("/me")
      .then(setUser)
      .catch((e) => {
        if (e.status === 401)
          router.replace("/login?next=" + encodeURIComponent(path));
        else setError(e.message);
      });
  }, [router, path]);
  if (!user)
    return (
      <div className="container section">
        <Notice message={error} />
        <p>Carregando sua conta…</p>
      </div>
    );
  const staff = ["ADMIN", "BROKER"].includes(user.role);
  const links = [
    ...(!staff ? [["/painel", "Minha área"]] : []),
    ...(staff
      ? [
          ["/painel", "Visão geral"],
          ["/painel/imoveis", "Imóveis"],
        ]
      : []),
    ["/painel/visitas", "Visitas"],
    ["/painel/mensagens", "Mensagens"],
    ...(staff ? [["/painel/agenda", "Disponibilidade"]] : []),
    ...(user.role === "ADMIN"
      ? [
          ["/painel/usuarios", "Usuários"],
          ["/painel/auditoria", "Auditoria"],
          ["/painel/emails", "Envio de e-mails"],
        ]
      : []),
    ["/painel/notificacoes", "Notificações"],
    ["/painel/conta", "Minha conta"],
    ["/central-privacidade", "Meus dados e privacidade"],
    ...(user.role === "ADMIN"
      ? [["/painel/privacidade", "Privacidade e incidentes"]]
      : []),
  ];
  return (
    <UserContext value={user}>
      <div className="container section">
        <div className="section-heading">
          <div>
            <h1 className="dashboard-title">Olá, {user.name.split(" ")[0]}</h1>
            <p className="muted">
              {user.role === "ADMIN" ? "Área administrativa: imóveis, equipe e privacidade." : staff ? "Área do corretor: seus imóveis, visitas e atendimentos." : "Área do cliente: suas visitas, conversas e notificações."}
            </p>
          </div>
          <button
            className="btn secondary small"
            onClick={async () => {
              await api("/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
          >
            Sair
          </button>
        </div>
        <div className="dash">
          <nav className="dash-nav" aria-label="Área da conta">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={path === href ? "active" : ""}
                aria-current={path === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <section className="min-w-0">{
            ((!staff && ["/painel/imoveis", "/painel/agenda"].some(p => path.startsWith(p))) ||
              (user.role !== "ADMIN" && ["/painel/usuarios", "/painel/auditoria", "/painel/emails", "/painel/privacidade"].some(p => path.startsWith(p))))
              ? <div className="empty"><h2>Acesso restrito</h2><p>Esta página não está disponível para o seu perfil.</p><Link href="/painel" className="btn">Voltar à minha área</Link></div>
              : children
          }</section>
        </div>
      </div>
    </UserContext>
  );
}
