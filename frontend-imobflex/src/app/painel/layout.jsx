import DashboardShell from "@/features/DashboardShell";
export const metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};
export default function Layout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
