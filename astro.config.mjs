import { defineConfig } from "astro/config";

// GitHub Pages: https://ultrastruttura.github.io/corpoceleste/
// Locale: http://localhost:4321/
// Dominio custom: imposta GITHUB_PAGES=false e site sul dominio, base: "/"
const githubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  site: "https://ultrastruttura.github.io",
  base: githubPages ? "/corpoceleste/" : "/",
  trailingSlash: "always",
});
