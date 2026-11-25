import { publicApi } from "@/lib/api";
export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const urls = ["", "/imoveis", "/sobre", "/contato"].map((p) => ({ url: base + p }));
  try {
    const first = await publicApi("/properties");
    for (let page = 0; page < Math.ceil(first.total / 12); page++) {
      const data =
        page === 0 ? first : await publicApi("/properties?page=" + page);
      urls.push(...data.items.map((p) => ({ url: base + "/imoveis/" + p.id })));
    }
  } catch {}
  return urls;
}
export const dynamic = "force-dynamic";
