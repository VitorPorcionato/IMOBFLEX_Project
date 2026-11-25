"use client";
import { useEffect, useRef } from "react";

export default function FilterPanel({ children }) {
  const panel = useRef(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1025px)");
    const adapt = () => {
      if (panel.current) panel.current.open = desktop.matches;
    };
    adapt();
    desktop.addEventListener("change", adapt);
    return () => desktop.removeEventListener("change", adapt);
  }, []);
  return (
    <details ref={panel} open className="mobile-filter">
      <summary>Filtrar imóveis</summary>
      {children}
    </details>
  );
}
