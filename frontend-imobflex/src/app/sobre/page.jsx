import Link from "next/link";
export const metadata = {
  title: "Sobre nós",
  description:
    "Conheça a Imobflex e como funciona a busca, o atendimento e a solicitação de visitas.",
};
export default function About() {
  return (
    <div className="company-page">
      <section className="container company-hero hero" data-enter>
        <div className="company-copy">
          <p className="company-kicker">Sobre nós</p>
          <h1>Imóveis em São Paulo, com atendimento próximo.</h1>
          <p className="company-lead">
            A Imobflex aproxima quem procura um imóvel de quem pode ajudar a
            encontrá-lo. Busca, conversa e visitas reunidas em um só lugar.
          </p>
          <Link href="/imoveis" className="btn">
            Consultar imóveis
          </Link>
          <p className="company-context">
            Capital, ABC, interior e litoral no catálogo.
          </p>
        </div>
        <figure
          className="company-photo"
          data-moment="picture-develops"
          data-moment-opts='{"look":"film"}'
        >
          <img
            src="/hero.jpg"
            alt="Sala com janelas amplas, poltronas e plantas junto à área de estar"
            width="1280"
            height="960"
            fetchPriority="high"
          />
        </figure>
      </section>
      <section className="company-process">
        <div className="container company-process-inner">
          <div>
            <p className="company-kicker">Como trabalhamos</p>
            <h2>Da busca à visita ao imóvel.</h2>
            <p>
              Você consulta as opções e fala com o corretor pelo anúncio. A
              conta reúne suas visitas e notificações para acompanhar cada
              solicitação.
            </p>
            <img
              className="company-process-photo"
              src="/regions-abc.jpg"
              alt="Casa com área externa e jardim, apresentada como exemplo de imóvel"
              width="1280"
              height="960"
              loading="lazy"
            />
            <Link href="/contato" className="btn secondary">
              Falar com a equipe
            </Link>
          </div>
          <dl className="company-principles">
            <div>
              <dt>Informações para comparar</dt>
              <dd>
                Fotos, características, preços e localização antes de escolher
                uma visita.
              </dd>
            </div>
            <div>
              <dt>Conversa ligada ao imóvel</dt>
              <dd>
                A mensagem do anúncio chega ao corretor responsável pelo
                atendimento.
              </dd>
            </div>
            <div>
              <dt>Você acompanha a solicitação</dt>
              <dd>
                O horário solicitado fica reservado e aguarda a confirmação do
                corretor.
              </dd>
            </div>
            <div>
              <dt>Escolhas sobre seus dados</dt>
              <dd>
                Marketing opcional e uma Central de Privacidade para acesso ou
                exclusão.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
