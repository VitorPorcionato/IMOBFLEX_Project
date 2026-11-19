import Link from "next/link";
export const metadata = { title: "A imobiliária" };
export default function About() {
  return (
    <section className="container section about-page">
      <div className="gold-rule" />
      <h1>
        Seu imóvel.
        <br />
        Nosso cuidado.
      </h1>
      <div className="max-w-2xl">
        <p className="text-xl">
          A Imobflex aproxima pessoas dos espaços que procuram para viver e
          trabalhar.
        </p>
        <p>
          Aqui, você consulta as características dos imóveis, conversa com o
          corretor responsável e solicita visitas em um só lugar.
        </p>
        <h2 className="mt-10">Como falar com a equipe</h2>
        <p>
          Escolha um imóvel no catálogo e use o formulário de contato. Sua
          mensagem será encaminhada ao corretor responsável. O prazo esperado de
          resposta é de até 24 horas úteis.
        </p>
        <Link href="/imoveis" className="btn">
          Encontrar um imóvel
        </Link>
      </div>
    </section>
  );
}
