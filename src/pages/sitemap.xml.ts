import type { APIRoute } from "astro";

export const prerender = true;

/**
 * Alias di /sitemap-index.xml — molti tool e utenti aprono /sitemap.xml
 * e altrimenti vedono la 404 del sito.
 */
export const GET: APIRoute = () => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.corpoceleste.eu/sitemap-0.xml</loc>
  </sitemap>
</sitemapindex>
`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
