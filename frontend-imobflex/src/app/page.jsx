import Link from "next/link";
import {
  Search,
  CalendarDays,
  MessagesSquare,
  House,
  Building2,
  Trees,
  BriefcaseBusiness,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
export const dynamic = "force-dynamic";
export default async function Home() {
  let data, error;
  try {
    data = await publicApi("/properties");
  } catch {
    error = true;
  }
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="gold-rule" />
          <h1>
            Seu próximo lugar.
            <br />
            Sua nova história.
          </h1>
          <p>
            Da vida na capital ao ritmo do interior. Descubra casas,
            apartamentos e espaços para trabalhar em São Paulo.
          </p>
          <div className="hero-actions">
            <Link href="/imoveis" className="btn">
              Explorar imóveis
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
            <Link href="/imoveis?purpose=RENT" className="hero-link">
              Quero alugar
            </Link>
          </div>
          <div className="hero-notes">
            <span>
              <MapPin size={17} aria-hidden="true" /> Capital, ABC, litoral e
              interior
            </span>
            <span>
              <CalendarDays size={17} aria-hidden="true" /> Visitas pelo site
            </span>
          </div>
        </div>
        <div className="hero-photo">
          <img
            src="/hero.jpg"
            alt="Sala ampla e iluminada, com sofá e grandes janelas"
            fetchPriority="high"
          />
          <div className="photo-caption">
            Abra espaço para o que vem.
            <br />
            <small>Imagem ilustrativa</small>
          </div>
        </div>
      </section>
      <div className="container search-strip">
        <form action="/imoveis" className="search-box">
          <label>
            O que você procura?
            <select name="purpose">
              <option value="SALE">Quero comprar</option>
              <option value="RENT">Quero alugar</option>
            </select>
          </label>
          <label>
            Onde gostaria de morar?
            <input
              name="q"
              placeholder="Cidade, bairro ou CEP"
              maxLength={100}
            />
          </label>
          <button className="btn">
            <Search size={19} />
            Buscar imóveis
          </button>
        </form>
      </div>
      <section
        className="container property-paths"
        aria-label="Buscar por tipo de imóvel"
      >
        {[
          [House, "Casas", "HOUSE", "Mais espaço para viver"],
          [
            Building2,
            "Apartamentos",
            "APARTMENT",
            "Sua rotina, bem localizada",
          ],
          [Trees, "Terrenos", "LAND", "Um novo projeto começa aqui"],
          [
            BriefcaseBusiness,
            "Comerciais",
            "COMMERCIAL",
            "Lugar para suas ideias",
          ],
        ].map(([Icon, title, type, text]) => (
          <Link
            key={type}
            href={`/imoveis?type=${type}`}
            className="property-path"
          >
            <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </section>
      <section className="container section featured-section">
        <div className="section-heading">
          <div>
            <h2>Encontre seu jeito de morar</h2>
            <p className="muted">
              Explore os novos espaços do nosso catálogo de demonstração.
            </p>
          </div>
          <Link href="/imoveis" className="btn secondary">
            Ver todos os imóveis
          </Link>
        </div>
        <div className="properties">
          {error ? (
            <div className="empty">
              <h3>O catálogo está temporariamente indisponível</h3>
              <p>Tente novamente em alguns instantes.</p>
              <Link href="/imoveis" className="btn secondary">
                Consultar catálogo
              </Link>
            </div>
          ) : data.items.length ? (
            data.items
              .slice(0, 6)
              .map((p) => <PropertyCard key={p.id} property={p} />)
          ) : (
            <div className="empty">
              <h3>Novos imóveis em breve</h3>
              <p>
                Nossa equipe está preparando o catálogo. Volte em breve para
                conhecer as opções.
              </p>
            </div>
          )}
        </div>
      </section>
      <section className="regions-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <h2>Um novo endereço, muitas possibilidades</h2>
              <p className="muted">
                Escolha uma região e conheça os imóveis disponíveis.
              </p>
            </div>
          </div>
          <div className="regions-grid">
            {[
              [
                "São Paulo",
                "Da Vila Mariana a Pinheiros",
                "/regions-capital.jpg",
              ],
              ["Santo André", "Descubra os espaços do ABC", "/regions-abc.jpg"],
              ["Campinas", "Novos planos no interior", "/regions-interior.jpg"],
            ].map(([city, text, photo]) => (
              <Link
                className="region-card"
                key={city}
                href={`/imoveis?q=${encodeURIComponent(city)}`}
              >
                <img
                  src={photo}
                  alt=""
                  loading="lazy"
                  width="800"
                  height="600"
                />
                <div>
                  <MapPin size={20} aria-hidden="true" />
                  <h3>{city}</h3>
                  <p>{text}</p>
                  <span>
                    Explorar região{" "}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <p className="region-note muted">
            Fotografias ilustrativas. Os anúncios são fictícios e utilizam
            localidades reais para demonstrar a experiência.
          </p>
        </div>
      </section>
      <section className="journey-section">
        <div className="container section journey">
          <div className="gold-rule" />
          <h2>
            Do primeiro olhar à visita,
            <br />
            estamos com você.
          </h2>
          <div className="steps">
            <div>
              <Search size={30} />
              <h3>Encontre seu espaço</h3>
              <p className="muted">
                Compare localização, características e valores com informações
                claras.
              </p>
            </div>
            <div>
              <CalendarDays size={30} />
              <h3>Escolha um horário</h3>
              <p className="muted">
                Solicite sua visita online e acompanhe a confirmação na sua
                conta.
              </p>
            </div>
            <div>
              <MessagesSquare size={30} />
              <h3>Converse com a equipe</h3>
              <p className="muted">
                Tire suas dúvidas sobre o imóvel e receba orientação para o
                próximo passo.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="home-contact">
          <div>
            <h2>Qual é o seu próximo passo?</h2>
            <p>
              Escolha um imóvel, conheça os detalhes e envie suas dúvidas à
              equipe. Sua busca pode começar por uma boa conversa.
            </p>
          </div>
          <Link href="/imoveis" className="btn">
            Encontrar meu espaço <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
