"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      className="mobile-menu"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="menu-toggle"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        <span>Menu</span>
      </button>
      <nav
        id="mobile-navigation"
        aria-label="Navegação móvel"
        hidden={!open}
        onClick={() => setOpen(false)}
      >
        <Link href="/imoveis?purpose=SALE">Comprar</Link>
        <Link href="/imoveis?purpose=RENT">Alugar</Link>
        <Link href="/sobre">Sobre nós</Link>
        <Link href="/contato">Contato</Link>
        <Link href="/painel" className="btn secondary">
          Minha conta
        </Link>
      </nav>
    </div>
  );
}
