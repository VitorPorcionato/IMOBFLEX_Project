import "./globals.css";
import "./visual-refresh.css";
import "./company.css";
import Script from "next/script";
import { cookies } from "next/headers";
import CookiePreferences from "@/components/CookiePreferences";
import WhatsAppButton from "@/components/WhatsAppButton";
import ChatAssistant from "@/components/ChatAssistant";
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
  other: { "page-type": "service", "site-kind": "other" },
};
export default async function RootLayout({ children }) {
  const theme =
    (await cookies()).get("imobflex-theme")?.value === "dark"
      ? "dark"
      : "light";
  return (
    <html lang="pt-BR" data-theme={theme} data-type="service" data-motion="">
      <body>
        <a href="#conteudo" className="skip">
          Ir para o conteúdo
        </a>
        <Header theme={theme} />
        <CookiePreferences />
        <main id="conteudo">{children}</main>
        <Footer />
        <WhatsAppButton />
        <ChatAssistant />
        <Script
          src="/assets/motion/motion.js"
          type="module"
          strategy="afterInteractive"
        />
        <Script
          src="/assets/imobflex-motion.js"
          type="module"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
