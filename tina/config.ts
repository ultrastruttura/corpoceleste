import { defineConfig } from "tinacms";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.HEAD ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  "main";

const localizedText = (name: string, label: string, textarea = true) => ({
  type: "object" as const,
  name,
  label,
  fields: [
    {
      type: "string" as const,
      name: "it",
      label: "Italiano",
      ...(textarea ? { ui: { component: "textarea" as const } } : {}),
    },
    {
      type: "string" as const,
      name: "en",
      label: "English",
      ...(textarea ? { ui: { component: "textarea" as const } } : {}),
    },
    {
      type: "string" as const,
      name: "de",
      label: "Deutsch",
      ...(textarea ? { ui: { component: "textarea" as const } } : {}),
    },
  ],
});

export default defineConfig({
  branch,
  // Client ID must use NEXT_PUBLIC_ / TINA_PUBLIC_ so tinacms build embeds it in /admin
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
    basePath: "",
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
              { value: "preorder", label: "Pre-order" },
              { value: "soldout", label: "Esaurita" },
            ],
          },
          {
            type: "string",
            name: "kind",
            label: "Tipo",
            description:
              "Per le didascalie immagine: maglia, stampa su carta, o edizione/pezzo d’artista.",
            required: true,
            options: [
              { value: "shirt", label: "Maglia" },
              { value: "print", label: "Stampa (foglio)" },
              { value: "edition", label: "Edizione / pezzo" },
            ],
          },
          {
            type: "reference",
            name: "fitModel",
            label: "Modello misure (tabella taglie)",
            description:
              "Solo maglie/felpe. Scegli un modello capo (Tina → Modelli capo). Se vuoto, usa la tabella di fallback del sito.",
            collections: ["fitModel"],
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
            name: "composition",
            label: "Composizione tessile",
            description:
              "Obbligatoria sui tessili (reg. UE 1007/2011). Deve coincidere con l’etichetta cucita. Scrivila in italiano, es. «100% cotone»: viene tradotta in EN/DE se la stringa è nota. Lascia vuoto per stampe su carta.",
          },
          {
            type: "string",
            name: "sizes",
            label: "Taglie",
            list: true,
            options: ["S", "M", "L", "XL"],
          },
          {
            type: "object",
            name: "stock",
            label: "Magazzino (pezzi per taglia)",
            required: true,
            fields: [
              { type: "number", name: "S", label: "S", required: true },
              { type: "number", name: "M", label: "M", required: true },
              { type: "number", name: "L", label: "L", required: true },
              { type: "number", name: "XL", label: "XL", required: true },
            ],
          },
          {
            type: "image",
            name: "images",
            label: "Foto (fino a 4)",
            list: true,
            required: true,
          },
          localizedText("description", "Descrizione (pagina prodotto)"),
          localizedText("seoDescription", "Meta SEO (max ~160 caratteri)"),
        ],
      },
      {
        name: "fitModel",
        label: "Modelli capo",
        path: "content/fit-models",
        format: "md",
        ui: {
          filename: {
            slugify: (values) =>
              (values?.name || "modello")
                .toString()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
          },
        },
        fields: [
          { type: "string", name: "name", label: "Nome modello", isTitle: true, required: true },
          {
            type: "string",
            name: "kind",
            label: "Tipo capo",
            required: true,
            options: [
              { value: "shirt", label: "T-shirt / maglia" },
              { value: "hoodie", label: "Felpa" },
            ],
          },
          {
            type: "object",
            name: "rows",
            label: "Misure (cm, capo disteso)",
            list: true,
            description:
              "chest = ½ petto (ascella–ascella). length = spalla–orlo. sleeve = spalla–polsino.",
            ui: {
              itemProps: (item: { size?: string }) => ({
                label: item?.size ? `Taglia ${item.size}` : "Taglia",
              }),
            },
            fields: [
              {
                type: "string",
                name: "size",
                label: "Taglia",
                required: true,
                options: ["S", "M", "L", "XL"],
              },
              { type: "number", name: "chest", label: "½ petto (cm)", required: true },
              { type: "number", name: "length", label: "Lunghezza (cm)", required: true },
              { type: "number", name: "sleeve", label: "Manica (cm)", required: true },
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
            type: "string",
            name: "sortAs",
            label: "Ordina sotto (opzionale)",
            description:
              "Per l’elenco A–Z. Vuoto = prima parola del nome (Lapis Niger → L, Dottor Pira → D). Nome+cognome reale: metti il cognome (Rudy Fritsch → Fritsch).",
          },
          localizedText("bio", "Bio"),
          localizedText("seoDescription", "Meta SEO (max ~160 caratteri)"),
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
          {
            type: "image",
            name: "cover",
            label: "Immagine di copertina",
            description: "Opzionale. Compare in elenco News e in cima al post.",
          },
          {
            type: "image",
            name: "images",
            label: "Galleria (altre immagini)",
            list: true,
            description:
              "Opzionale. Solo foto DI QUESTO pezzo, sotto il testo. Non mettere qui la cover (già sopra) né immagini di altre news: altrimenti compare una miniatura in fondo all’articolo.",
          },
          { type: "string", name: "body_it", label: "Testo (IT)", ui: { component: "textarea" }, required: true },
          { type: "string", name: "body_en", label: "Body (EN)", ui: { component: "textarea" }, required: true },
          { type: "string", name: "body_de", label: "Text (DE)", ui: { component: "textarea" }, required: true },
        ],
      },
      {
        name: "bio",
        label: "Bio",
        path: "content/bio",
        format: "md",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          { type: "string", name: "title", label: "Titolo interno", isTitle: true, required: true },
          { type: "string", name: "name", label: "Nome", required: true },
          localizedText("body", "Testo bio"),
          localizedText("printTitle", "Titolo sezione stampa", false),
          localizedText("printBody", "Testo sezione stampa"),
          localizedText("printCv", "Curriculum / esperienza stampa"),
          localizedText("liveTitle", "Titolo stampa dal vivo", false),
          localizedText("liveBody", "Testo stampa dal vivo"),
        ],
      },
      {
        name: "settings",
        label: "SEO e home",
        path: "content/settings",
        format: "md",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          { type: "string", name: "title", label: "Titolo interno", isTitle: true, required: true },
          {
            type: "string",
            name: "shopEmail",
            label: "Email shop (ordini e form)",
            description:
              "Destinazione FormSubmit: ordini (bonifico / PayPal), contatti, newsletter, corsi, consulenza, ristampe. Se vuoto, usa il fallback in codice.",
          },
          localizedText(
            "metaDescription",
            "Meta description (SEO + anteprima link; non visibile in pagina)",
          ),
          localizedText(
            "homeTitle",
            "H1 SEO home (es. Serigrafie d’autore — solo nascosto in pagina, non in anteprima link)",
            false,
          ),
          localizedText(
            "homeLede",
            "Sottotitolo home (vuoto = nascosto; non usato se vuoto)",
          ),
          {
            type: "boolean",
            name: "announcementEnabled",
            label: "Mostra barra annuncio in alto",
            description:
              "Accendi solo quando hai una comunicazione extra (spedizioni, chiusure, eventi). Se spento o senza testo, non compare.",
          },
          localizedText("announcementText", "Testo barra annuncio"),
          {
            type: "string",
            name: "announcementLink",
            label: "Link barra (opzionale)",
            description:
              "Path interno (es. contatti/) con lingua automatica, oppure https://… / mailto:… — se vuoto il testo non è cliccabile.",
          },
          {
            type: "string",
            name: "andreaName",
            label: "Nome in Contatti",
            description: "Compare solo nella pagina Contatti (non nella Bio lunga).",
          },
          localizedText("andreaBio", "Testo breve Contatti"),
          {
            type: "image",
            name: "ogImage",
            label: "Immagine Open Graph (condivisione social)",
          },
          {
            type: "string",
            name: "umamiWebsiteId",
            label: "Umami Analytics — Website ID",
            description:
              "OBBLIGATORIO per vedere le visite. cloud.umami.is → Settings → Websites → Add website → copia il Website ID (o data-website-id dallo snippet). Vuoto = analytics spente.",
          },
          {
            type: "number",
            name: "lowStockThreshold",
            label: "Soglia “in esaurimento” (pezzi totali)",
            description:
              "Se i pezzi rimasti (somma di tutte le taglie) sono ≤ questo numero, sul sito compare il badge “In esaurimento”. Default 10. Metti 0 per spegnere.",
          },
          {
            type: "string",
            name: "iban",
            label: "IBAN (bonifico)",
            description: "Vuoto = resta il valore di default in codice.",
          },
          {
            type: "string",
            name: "intestatario",
            label: "Intestatario IBAN",
          },
          {
            type: "string",
            name: "legalName",
            label: "Ragione sociale / ditta",
          },
          {
            type: "string",
            name: "vatId",
            label: "Partita IVA",
          },
          {
            type: "string",
            name: "rea",
            label: "REA / Registro imprese",
            description: "Se ce l’hai; altrimenti lascia vuoto.",
          },
          {
            type: "string",
            name: "telefono",
            label: "Telefono contatto",
            description: "Opzionale; compare in Condizioni di vendita se compilato.",
          },
          {
            type: "string",
            name: "indirizzo",
            label: "Indirizzo sede completo",
          },
          {
            type: "string",
            name: "pec",
            label: "PEC",
          },
          {
            type: "string",
            name: "sdiCode",
            label: "Codice SDI",
          },
          {
            type: "string",
            name: "paypalClientId",
            label: "PayPal Client ID",
            description: "Da developer.paypal.com (Live). Vuoto = default in codice.",
          },
          {
            type: "string",
            name: "formApi",
            label: "URL API Vercel",
            description: "Es. https://corpoceleste.vercel.app — senza slash finale.",
          },
        ],
      },
    ],
  },
});
