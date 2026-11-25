import Link from "next/link";
import {
  MessageCircle,
  CalendarDays,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
export const metadata = {
  title: "Contato",
  description:
    "Fale com a Imobflex sobre imóveis, visitas e seus dados pessoais.",
};
const whatsapp =
  "https://wa.me/5511976086540?text=" +
  encodeURIComponent(
    "Olá! Gostaria de mais informações sobre os imóveis da Imobflex.",
  );
export default function Contact() {
  return (
    <section className="container company-hero contact-hero hero" data-enter>
      <div className="company-copy">
        <p className="company-kicker">Contato</p>
        <h1>Converse sobre seu próximo imóvel.</h1>
        <p className="company-lead">
          Conte o que procura ou tire suas dúvidas sobre um anúncio. Escolha o
          canal que atende ao seu pedido.
        </p>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          <MessageCircle size={20} aria-hidden="true" />
          Falar pelo WhatsApp
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
        <div className="contact-options">
          <div>
            <CalendarDays aria-hidden="true" />
            <div>
              <h2>Imóveis e visitas</h2>
              <p>
                Escolha um anúncio para enviar uma mensagem ao corretor ou
                solicitar um horário.
              </p>
              <Link href="/imoveis">Consultar imóveis</Link>
            </div>
          </div>
          <div>
            <MessageCircle aria-hidden="true" />
            <div>
              <h2>Dúvidas sobre o site</h2>
              <p>
                O assistente no canto da tela explica busca, cadastro e
                agendamento.
              </p>
            </div>
          </div>
          <div>
            <ShieldCheck aria-hidden="true" />
            <div>
              <h2>Seus dados e escolhas</h2>
              <p>
                Acesse a cópia dos seus dados ou registre uma solicitação de
                exclusão.
              </p>
              <Link href="/central-privacidade">
                Acessar Central de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
      <figure
        className="company-photo"
        data-moment="picture-develops"
        data-moment-opts='{"look":"film"}'
      >
        <img
          src="/regions-interior.jpg"
          alt="Quarto iluminado conectado a uma varanda com portas de vidro"
          width="1280"
          height="960"
          fetchPriority="high"
        />
      </figure>
    </section>
  );
}
