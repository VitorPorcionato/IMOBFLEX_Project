export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/painel",
        "/api/",
        "/login",
        "/cadastro",
        "/confirmar-email",
        "/redefinir-senha",
      ],
    },
    sitemap:
      (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") +
      "/sitemap.xml",
  };
}
