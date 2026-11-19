import Link from "next/link";
import { Search, CalendarDays, MessagesSquare } from "lucide-react";
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
            Um lar para os seus dias. Um espaço para seus planos. Encontre o
            imóvel certo com a Imobflex.
          </p>
          <Link href="/imoveis" className="btn">
            Explorar imóveis
          </Link>
        </div>
        <div className="hero-photo">
          <img
            src="/hero.jpg"
            alt="Sala ampla e iluminada, com sofá e grandes janelas"
            fetchPriority="high"
          />
          <div className="photo-caption">
            Espaços para viver bem.
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
      <section className="container section">
        <div className="section-heading">
          <div>
            <h2>Conheça as possibilidades</h2>
            <p className="muted">
              Os imóveis mais recentes para o seu próximo passo.
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
      <section className="bg-gray-100">
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
    </>
  );
}
