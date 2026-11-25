import Link from "next/link";
import { publicApi } from "@/lib/api";
import { labels } from "@/lib/format";
import PropertyCard from "@/components/PropertyCard";
import FilterPanel from "@/components/FilterPanel";
export const metadata = { title: "Comprar ou alugar" };
export const dynamic = "force-dynamic";
export default async function Catalog({ searchParams }) {
  const raw = await searchParams;
  const params = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  let data, error;
  try {
    data = await publicApi("/properties?" + new URLSearchParams(params));
  } catch {
    error = true;
  }
  const page = data?.page || 0;
  const link = (n) =>
    "/imoveis?" + new URLSearchParams({ ...params, page: String(n) });
  return (
    <div className="container">
      <div className="page-heading">
        <div className="breadcrumb">
          <Link href="/">Início</Link> / Imóveis
        </div>
        <h1>Um lugar para seus planos</h1>
        <p className="muted">
          Explore os imóveis e encontre o que faz sentido para você.
        </p>
      </div>
      <div className="catalog">
        <aside className="filters">
          <FilterPanel>
            <form action="/imoveis">
              <label>
                Finalidade
                <select name="purpose" defaultValue={params.purpose || ""}>
                  <option value="">Venda e locação</option>
                  <option value="SALE">Comprar</option>
                  <option value="RENT">Alugar</option>
                </select>
              </label>
              <label>
                Localização
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Cidade, bairro ou CEP"
                  maxLength={100}
                />
              </label>
              <label>
                Tipo
                <select name="type" defaultValue={params.type || ""}>
                  <option value="">Todos</option>
                  {[
                    "HOUSE",
                    "APARTMENT",
                    "PENTHOUSE",
                    "LAND",
                    "COMMERCIAL",
                    "WAREHOUSE",
                  ].map((v) => (
                    <option key={v} value={v}>
                      {labels[v]}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["minPrice", "Preço mínimo (R$)"],
                ["maxPrice", "Preço máximo (R$)"],
                ["minArea", "Área mínima (m²)"],
                ["maxArea", "Área máxima (m²)"],
                ["bedrooms", "Mínimo de quartos"],
                ["bathrooms", "Mínimo de banheiros"],
                ["parking", "Mínimo de vagas"],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    type="number"
                    min="0"
                    step={
                      name.includes("Price") || name.includes("Area")
                        ? ".01"
                        : "1"
                    }
                    name={name}
                    defaultValue={params[name]}
                  />
                </label>
              ))}
              <label>
                Ordenar por
                <select name="sort" defaultValue={params.sort || "newest"}>
                  <option value="newest">Mais recentes</option>
                  <option value="priceAsc">Menor preço</option>
                  <option value="priceDesc">Maior preço</option>
                  <option value="relevance">Relevância</option>
                </select>
              </label>
              <button className="btn">Aplicar filtros</button>
              <Link href="/imoveis" className="text-center text-crimson">
                Limpar filtros
              </Link>
            </form>
          </FilterPanel>
        </aside>
        <section>
          <p className="muted" aria-live="polite">
            {data ? `${data.total} imóveis encontrados` : "Catálogo"}
          </p>
          <div className="properties">
            {error ? (
              <div className="empty">
                <h3>Não foi possível carregar os imóveis</h3>
                <p>Confira os filtros ou tente novamente em instantes.</p>
                <Link href="/imoveis" className="btn secondary">
                  Tentar novamente
                </Link>
              </div>
            ) : data.items.length ? (
              data.items.map((p) => (
                <PropertyCard
                  key={p.id}
                  heading="h2"
                  property={p}
                  purpose={params.purpose}
                />
              ))
            ) : (
              <div className="empty">
                <h3>Nenhum imóvel encontrado</h3>
                <p>
                  Amplie a região ou ajuste a faixa de preço para encontrar
                  outras opções.
                </p>
                <Link href="/imoveis" className="btn secondary">
                  Limpar filtros
                </Link>
              </div>
            )}
          </div>
          {data?.total > 12 && (
            <nav className="pagination" aria-label="Paginação">
              {page > 0 && <Link href={link(page - 1)}>Anterior</Link>}
              <span>
                Página {page + 1} de {Math.ceil(data.total / 12)}
              </span>
              {(page + 1) * 12 < data.total && (
                <Link href={link(page + 1)}>Próxima</Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
