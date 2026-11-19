import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api";
import { money, labels, imageUrl } from "@/lib/format";
import PropertyActions from "@/features/PropertyActions";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const p = await publicApi(`/properties/${id}`);
    return {
      title: p.title,
      description: p.description.slice(0, 155),
      openGraph: {
        title: p.title,
        description: `${p.neighborhood}, ${p.city} — ${money(p.sale_price || p.rent_price)}`,
        images: p.images.length ? [imageUrl(p.images[0].path)] : [],
      },
    };
  } catch {
    return { title: "Imóvel indisponível" };
  }
}
export default async function Detail({ params }) {
  const { id } = await params;
  let p;
  try {
    p = await publicApi(`/properties/${id}`);
  } catch (e) {
    if (e.status === 404) notFound();
    throw e;
  }
  return (
    <div className="container">
      <div className="page-heading">
        <div className="breadcrumb">
          <Link href="/imoveis">Imóveis</Link> / {labels[p.type]} / #{p.id}
        </div>
        <span className={`tag ${p.status === "NEGOTIATING" ? "warning" : ""}`}>
          {labels[p.status]}
        </span>
        <h1 className="mt-3!">{p.title}</h1>
        <p className="muted">
          {p.neighborhood}, {p.city} · {p.state}
        </p>
      </div>
      <div className="gallery">
        <img src={imageUrl(p.images[0]?.path)} alt={p.title} />
        <div className="gallery-side">
          {p.images.slice(1, 3).map((im, i) => (
            <img
              key={im.id}
              src={imageUrl(im.path)}
              alt={`${p.title}, ambiente ${i + 2}`}
            />
          ))}
        </div>
      </div>
      <div className="detail-grid section">
        <section>
          <h2>Um espaço para chamar de seu</h2>
          <div className="feature-row my-7">
            <span>{p.area} m²</span>
            <span>{p.bedrooms} quartos</span>
            <span>{p.bathrooms} banheiros</span>
            <span>{p.parking} vagas</span>
          </div>
          <p className="detail-text">{p.description}</p>
          <h3 className="mt-8">Localização</h3>
          <p>
            {p.neighborhood}, {p.city} — {p.state}. O endereço completo é
            informado pela equipe no atendimento.
          </p>
          {p.images.length > 3 && (
            <details className="mt-8">
              <summary>Ver todas as {p.images.length} fotografias</summary>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {p.images.slice(3).map((im, i) => (
                  <a
                    key={im.id}
                    href={imageUrl(im.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={imageUrl(im.thumbnail)}
                      alt={`Ambiente ${i + 4}`}
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </details>
          )}
        </section>
        <aside className="card side-panel">
          {p.sale_price && (
            <div>
              <span className="muted">Valor de venda</span>
              <p className="price">{money(p.sale_price)}</p>
            </div>
          )}
          {p.rent_price && (
            <div>
              <span className="muted">Aluguel mensal</span>
              <p className="price">{money(p.rent_price)}</p>
            </div>
          )}
          <PropertyActions property={p} />
        </aside>
      </div>
    </div>
  );
}
