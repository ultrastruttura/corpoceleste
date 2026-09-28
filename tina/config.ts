import { defineConfig } from "tinacms";

const githubPages = process.env.GITHUB_PAGES === "true";
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.HEAD ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
    basePath: githubPages ? "corpoceleste" : "",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "product",
        label: "Maglie",
        path: "content/products",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) =>
              (values?.title || "maglia")
                .toString()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
          },
        },
        fields: [
          { type: "string", name: "title", label: "Titolo", isTitle: true, required: true },
          {
            type: "reference",
            name: "artist",
            label: "Artista",
            collections: ["artist"],
            required: true,
          },
          { type: "number", name: "price", label: "Prezzo (€)", required: true },
          {
            type: "string",
            name: "status",
            label: "Stato",
            required: true,
            options: [
              { value: "available", label: "Disponibile" },
              { value: "soldout", label: "Esaurita" },
            ],
          },
          { type: "boolean", name: "nuovo", label: "Nuovo (in cima allo shop)" },
          { type: "datetime", name: "createdAt", label: "Data", required: true },
          { type: "string", name: "color", label: "Colore (hex)", required: true },
          {
            type: "string",
            name: "colorName",
            label: "Nome colore",
            required: true,
            options: [
              { value: "Nero", label: "Nero" },
              { value: "Viola", label: "Viola" },
            ],
          },
          {
            type: "string",
            name: "sizes",
            label: "Taglie",
            list: true,
            options: ["S", "M", "L", "XL"],
          },
          {
            type: "image",
            name: "images",
            label: "Foto (2–3)",
            list: true,
            required: true,
          },
          {
            type: "object",
            name: "description",
            label: "Descrizione",
            fields: [
              { type: "string", name: "it", label: "Italiano", ui: { component: "textarea" } },
              { type: "string", name: "en", label: "English", ui: { component: "textarea" } },
              { type: "string", name: "de", label: "Deutsch", ui: { component: "textarea" } },
            ],
          },
        ],
      },
      {
        name: "artist",
        label: "Artisti",
        path: "content/artists",
        format: "md",
        ui: {
          filename: {
            slugify: (values) =>
              (values?.name || "artista")
                .toString()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
          },
        },
        fields: [
          { type: "string", name: "name", label: "Nome", isTitle: true, required: true },
          {
            type: "object",
            name: "bio",
            label: "Bio",
            fields: [
              { type: "string", name: "it", label: "Italiano", ui: { component: "textarea" } },
              { type: "string", name: "en", label: "English", ui: { component: "textarea" } },
              { type: "string", name: "de", label: "Deutsch", ui: { component: "textarea" } },
            ],
          },
          { type: "string", name: "instagram", label: "Instagram (URL)" },
        ],
      },
      {
        name: "news",
        label: "News",
        path: "content/news",
        format: "md",
        ui: {
          filename: {
            slugify: (values) =>
              (values?.title_it || values?.title || "news")
                .toString()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
          },
        },
        fields: [
          { type: "datetime", name: "date", label: "Data", required: true },
          { type: "string", name: "title_it", label: "Titolo (IT)", isTitle: true, required: true },
          { type: "string", name: "title_en", label: "Title (EN)", required: true },
          { type: "string", name: "title_de", label: "Titel (DE)", required: true },
          { type: "string", name: "excerpt_it", label: "Estratto (IT)", ui: { component: "textarea" }, required: true },
          { type: "string", name: "excerpt_en", label: "Excerpt (EN)", ui: { component: "textarea" }, required: true },
          { type: "string", name: "excerpt_de", label: "Auszug (DE)", ui: { component: "textarea" }, required: true },
          { type: "string", name: "body_it", label: "Testo (IT)", ui: { component: "textarea" }, required: true },
          { type: "string", name: "body_en", label: "Body (EN)", ui: { component: "textarea" }, required: true },
          { type: "string", name: "body_de", label: "Text (DE)", ui: { component: "textarea" }, required: true },
        ],
      },
    ],
  },
});
