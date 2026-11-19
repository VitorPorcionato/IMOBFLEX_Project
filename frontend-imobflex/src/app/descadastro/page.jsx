import PrivacyCenter from "@/features/PrivacyCenter";
export const metadata = {
  title: "Privacidade",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <PrivacyCenter unsubscribe />;
}
