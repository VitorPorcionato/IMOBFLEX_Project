import "./globals.css";
import CookiePreferences from "@/components/CookiePreferences";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Header, Footer } from "@/components/SiteChrome";
export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Imobflex | Encontre seu próximo lugar",
    template: "%s | Imobflex",
  },
  description:
    "Imóveis para comprar e alugar. Conheça as opções e solicite uma visita com a Imobflex.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip">
          Ir para o conteúdo
        </a>
        <Header />
        <CookiePreferences />
        <main id="conteudo">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
