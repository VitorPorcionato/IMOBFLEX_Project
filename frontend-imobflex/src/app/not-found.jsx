import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container section">
      <h1>Página não encontrada</h1>
      <p>O endereço pode ter mudado ou o imóvel não está mais disponível.</p>
      <Link href="/imoveis" className="btn">
        Voltar ao catálogo
      </Link>
    </div>
  );
}
