"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <Link
      href="/"
      className="back-button"
      aria-label="Voltar para a home"
      title="Voltar para a home"
    >
      <ArrowLeft size={21} aria-hidden="true" />
      <span>Voltar</span>
    </Link>
  );
}
