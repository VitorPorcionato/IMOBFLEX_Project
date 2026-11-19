import Link from "next/link";
import { BedDouble, Bath, CarFront, Scan } from "lucide-react";
import { money, imageUrl, labels } from "@/lib/format";
export default function PropertyCard({
  property: p,
  purpose,
  heading: Heading = "h3",
}) {
  return (
    <article className="card property-card">
      <Link href={`/imoveis/${p.id}`}>
        <img
          className="property-photo"
          src={imageUrl(p.cover)}
          alt={p.title}
          loading="lazy"
        />
        <div className="property-body">
          <div className="property-tags">
            <span
              className={`tag ${p.status === "NEGOTIATING" ? "warning" : ""}`}
            >
              {p.status === "NEGOTIATING"
                ? "Proposta em andamento"
                : labels[p.type]}
            </span>
            <span className="tag purpose">{labels[p.purpose]}</span>
          </div>
          <Heading>{p.title}</Heading>
          <p className="muted">
            {p.neighborhood}, {p.city} · {p.state}
          </p>
          <div className="feature-row">
            <span>
              <Scan size={17} />
              {p.area} m²
            </span>
            <span>
              <BedDouble size={17} />
              {p.bedrooms} quartos
            </span>
            <span>
              <Bath size={17} />
              {p.bathrooms} banh.
            </span>
            <span>
              <CarFront size={17} />
              {p.parking} vagas
            </span>
          </div>
          <p className="price">
            {money(
              purpose === "RENT" ? p.rent_price : p.sale_price || p.rent_price,
            )}
            {(purpose === "RENT" || !p.sale_price) && (
              <small className="text-sm font-normal"> / mês</small>
            )}
          </p>
          <span className="btn secondary card-action">Conhecer imóvel</span>
        </div>
      </Link>
    </article>
  );
}
