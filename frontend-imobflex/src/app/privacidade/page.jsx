import LegalDocument from "@/components/LegalDocument";
export const dynamic = "force-dynamic";
export const metadata = { title: "Política de Privacidade" };
export default function Page() {
  return <LegalDocument kind="privacy" />;
}
