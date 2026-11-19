import { Suspense } from "react";
import AuthForm from "@/features/AuthForm";
export const metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense fallback={<p className="container section">Carregando…</p>}>
      <AuthForm mode="esqueci-senha" />
    </Suspense>
  );
}
