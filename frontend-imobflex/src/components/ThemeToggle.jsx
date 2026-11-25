"use client";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ initialTheme }) {
  const [theme, setTheme] = useState(initialTheme);
  function toggle() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `imobflex-theme=${next}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setTheme(next);
  }
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Modo escuro"
      aria-pressed={theme === "dark"}
      title={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
    >
      {theme === "dark" ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
      <span className="theme-label">
        {theme === "dark" ? "Claro" : "Escuro"}
      </span>
    </button>
  );
}
