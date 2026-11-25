import Link from "next/link";
import {
  BedDouble,
  Bath,
  CarFront,
  Scan,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { money, imageUrl, labels } from "@/lib/format";
export default function PropertyCard({
  property: p,
  purpose,
  heading: Heading = "h3",
}) {
  return (
    <article className="card property-card">
      <Link href={`/imoveis/${p.id}`}>
        <div className="property-image-wrap">
          <img
            className="property-photo"
            src={imageUrl(p.cover)}
            alt={p.title}
            loading="lazy"
          />
          <span className="photo-hint">
            <ArrowUpRight size={20} aria-hidden="true" />
          </span>
        </div>
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
          <p className="muted property-location">
            <MapPin size={16} aria-hidden="true" />
            {p.neighborhood}, {p.city} · {p.state}
          </p>
          <div className="feature-row">
            <span>
              <Scan size={17} />
              {Number(p.area).toLocaleString("pt-BR")} m²
            </span>
            {p.bedrooms > 0 && (
              <span>
                <BedDouble size={17} />
                {p.bedrooms} {Number(p.bedrooms) === 1 ? "quarto" : "quartos"}
              </span>
            )}
            {p.bathrooms > 0 && (
              <span>
                <Bath size={17} />
                {p.bathrooms} banh.
              </span>
            )}
            {p.parking > 0 && (
              <span>
                <CarFront size={17} />
                {p.parking} {Number(p.parking) === 1 ? "vaga" : "vagas"}
              </span>
            )}
          </div>
          <p className="price">
            {money(
              purpose === "RENT" ? p.rent_price : p.sale_price || p.rent_price,
            )}
            {(purpose === "RENT" || !p.sale_price) && (
              <small className="text-sm font-normal"> / mês</small>
            )}
          </p>
          <span className="btn secondary card-action">
            Conhecer imóvel <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
