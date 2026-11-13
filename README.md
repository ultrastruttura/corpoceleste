# Corpoceleste

Shop e studio di **serigrafia a mano** di Andrea Baldelli Lorenzo (Nembro / Bergamo).  
Brand: **Corpoceleste** / **CORPOCELESTE** (una parola — non “Corpo Celeste”).

- Sito: [https://www.corpoceleste.eu](https://www.corpoceleste.eu/)
- Instagram: [https://www.instagram.com/cccorpocelesteee/](https://www.instagram.com/cccorpocelesteee/)
- Stack: Astro (statico) + TinaCMS · hosting **GitHub Pages** · API ordini/magazzino su **Vercel**

Lingue: **IT / EN / DE**.

## Sviluppo

Node **22+** (vedi `engines` in `package.json`).

```bash
npm install
npm run dev
```

Admin Tina in locale: [http://localhost:4321/admin/index.html](http://localhost:4321/admin/index.html)

| Script | Cosa fa |
|--------|---------|
| `npm run dev` | Tina + Astro |
| `npm run build` | Build Tina locale + sito |
| `npm run check` | Typecheck CI |
| `npm run check:tina` | Tina lock vs `tina/config.ts` |
| `npm run test:unit` | Test unitari |
| `npm run test:e2e` | Playwright |
| `npm run ci` | check + unit + `astro build` |

Dettaglio CI: [`docs/TESTING_AND_CI.md`](./docs/TESTING_AND_CI.md).  
Branch protection `main` (check obbligatori + admin enforced): `node scripts/apply-branch-protection.mjs`.  
Flusso: **PR → CI verde → merge** → Pages + Vercel (API). Evita push diretti su `main`.

## Pubblicare

1. Push su `main` → [`ultrastruttura/corpoceleste`](https://github.com/ultrastruttura/corpoceleste).
2. GitHub → **Settings → Pages → Source: GitHub Actions**.
3. Workflow: `.github/workflows/deploy.yml` (Tina Cloud se ci sono i secret `TINA_CLIENT_ID` / `TINA_TOKEN`).
4. Produzione: `https://www.corpoceleste.eu/` (dominio custom su Pages).

Dopo un cambio allo schema Tina (`tina/config.ts`), rigenera e committa `tina/tina-lock.json` (`npx tinacms build --local --skip-cloud-checks`), altrimenti il deploy può fallire con `ERR_CLOUD_CHECK_FAILED`.

## Contenuti (Tina)

Guida operativa: **[ADMIN.md](./ADMIN.md)**.

| Cosa | Dove |
|------|------|
| Email shop, IBAN, P.IVA, PayPal Client ID, `formApi`, **title/meta SEO home** | Tina → SEO e home · `content/settings/site.md` (fallback `src/data/site.ts`) |
| Maglie (prezzo, stock, foto, meta) | `content/products/` |
| Artisti | `content/artists/` |
| News | `content/news/` |
| Bio | `content/bio/page.md` |
| Modelli capo / taglie | `content/fit-models/` |
| Corsi (date) | `src/data/workshops.ts` |

### SEO brand (title / meta, non H1)

In Tina → **SEO e home**:

- *Title tag home* — es. `Corpoceleste — serigrafia a mano, Bergamo` (scheda Google / tab)
- *Meta description* — max ~155 caratteri; Andrea Baldelli + Nembro/Bergamo

Non usare “Corpo Celeste” con spazio (omonimi su altri siti).  
Google Business Profile (Nembro) e backlink da CORPOC → `.eu`: checklist in **[ADMIN.md](./ADMIN.md)** § Brand SEO.

## Checkout e magazzino

PayPal Business: commissione sull’ordine, senza canone. Senza Client ID resta solo **bonifico**.

Ordini PayPal, stock, mail Resend, Sendcloud: guida **[MAGAZZINO-VERCEL.md](./MAGAZZINO-VERCEL.md)**.  
Env: `.env.example`. Area clienti: **[PORTAL.md](./PORTAL.md)**.

In sintesi:

1. App PayPal + Client ID in Tina / settings.
2. Progetto Vercel (API) con le env del `.env.example`.
3. Webhook `PAYMENT.CAPTURE.COMPLETED` → `…/api/paypal-webhook`.
4. Stesso Client ID Live sul sito → push Pages.

## Repo

| Path | Ruolo |
|------|--------|
| `src/pages/` | Pagine Astro |
| `src/lib/seo.ts` | JSON-LD Organization / Product / FAQ |
| `src/lib/llms.ts` | `llms.txt` / robots |
| `tina/` | Config + lock TinaCMS |
| `api/` / Vercel | Webhook, form, account |
| `stock-ledger/` | Ledger locale (gitignored / non in Pages) |
