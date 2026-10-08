import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
      filter: (page) =>
        !page.includes("/404") &&
        !page.includes("/grazie") &&
        !page.includes("/carrello") &&
        !page.includes("/checkout") &&
        !page.includes("/admin") &&
        !page.includes("/account"),
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
