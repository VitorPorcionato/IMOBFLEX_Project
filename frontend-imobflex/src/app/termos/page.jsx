import LegalDocument from "@/components/LegalDocument";
export const dynamic = "force-dynamic";
export const metadata = { title: "Termos de Uso" };
export default function Page() {
  return <LegalDocument kind="terms" />;
}
