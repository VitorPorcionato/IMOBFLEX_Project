import { CookieSettingsButton } from "./CookiePreferences";
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import BackButton from "./BackButton";
import { House } from "lucide-react";
export function Header({ theme = "light" }) {
  return (
    <header className="topbar">
      <div className="container header-inner">
        <div className="header-start">
          <BackButton />
          <Link href="/" className="brand" aria-label="Imobflex, início">
            <House size={36} strokeWidth={1.4} className="text-crimson" />
            <span className="brand-name">
              Imobflex<small>Uma nova história começa aqui</small>
            </span>
          </Link>
        </div>
        <nav className="nav" aria-label="Navegação principal">
          <Link href="/imoveis?purpose=SALE">Comprar</Link>
          <Link href="/imoveis?purpose=RENT">Alugar</Link>
          <Link href="/sobre">Sobre nós</Link>
          <Link href="/contato">Contato</Link>
          <Link className="btn secondary small" href="/painel">
            Minha conta
          </Link>
        </nav>
        <div className="header-tools">
          <ThemeToggle initialTheme={theme} />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>Imobflex</h3>
            <p>
              Encontre um lugar que combine com os seus planos. Conheça os
              imóveis e converse com nossa equipe.
            </p>
          </div>
          <div>
            <h3>Encontre seu imóvel</h3>
            <Link href="/imoveis?purpose=SALE">Imóveis à venda</Link>
            <Link href="/imoveis?purpose=RENT">Imóveis para alugar</Link>
          </div>
          <div>
            <h3>Atendimento</h3>
            <Link href="/sobre">Sobre nós</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/painel/visitas">Minhas visitas</Link>
            <Link href="/privacidade">Política de Privacidade</Link>
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/central-privacidade">Meus dados e privacidade</Link>
            <CookieSettingsButton />
          </div>
        </div>
        <div className="footer-bottom">
          IMOBFLEX · Projeto acadêmico e ambiente de piloto. Anúncios de
          demonstração são identificados como fictícios.
        </div>
      </div>
    </footer>
  );
}
