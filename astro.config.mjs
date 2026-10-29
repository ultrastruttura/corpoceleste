import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { discoverySitemapBlockFragments } from "./src/lib/discovery.ts";

const blockedDiscovery = discoverySitemapBlockFragments();

// Produzione: https://www.corpoceleste.eu/
// Locale: http://localhost:4321/
export default defineConfig({
  site: "https://www.corpoceleste.eu",
  base: "/",
  trailingSlash: "always",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "it",
        locales: {
          it: "it-IT",
          en: "en-GB",
          de: "de-DE",
        },
      },
      filter: (page) => {
        if (
          page.includes("/404") ||
          page.includes("/grazie") ||
          page.includes("/carrello") ||
          page.includes("/checkout") ||
          page.includes("/admin") ||
          page.includes("/account")
        ) {
          return false;
        }
        // CMS placeholders (Maglia 1… / Artista 1…) stay out of the public sitemap until filled.
        return !blockedDiscovery.some((frag) => page.includes(frag));
      },
    }),
  ],
  i18n: {
    defaultLocale: "it",
    locales: ["it", "en", "de"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
