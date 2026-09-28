import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// GitHub Pages: https://ultrastruttura.github.io/corpoceleste/
// Locale: http://localhost:4321/
// Dominio custom: imposta GITHUB_PAGES=false e site sul dominio, base: "/"
const githubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  site: "https://ultrastruttura.github.io",
  base: githubPages ? "/corpoceleste/" : "/",
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
        !page.includes("/admin"),
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
