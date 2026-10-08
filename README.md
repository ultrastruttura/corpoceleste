# Corpoceleste

Sito statico dello shop. Hosting: GitHub Pages (gratis). Webhook magazzino: Vercel (gratis).

## Sviluppo

```bash
npm install
npm run dev
```

## Pubblicare su GitHub Pages

1. Push su `https://github.com/ultrastruttura/corpoceleste`.
2. Su GitHub: **Settings → Pages → Source: GitHub Actions**.
3. Il workflow in `.github/workflows/deploy.yml` pubblica a ogni push su `main`.
4. URL: `https://www.corpoceleste.eu/` (dominio custom su GitHub Pages; DNS su Cloudflare).

## Contenuti da cambiare

- Email, Instagram, IBAN: `src/data/site.ts`
- Maglie: Tina / `content/products/` (inclusi pezzi magazzino per taglia)
- Artisti: `content/artists/`
- News: `content/news/`
- Corsi: `src/data/workshops.ts`

## Checkout (PayPal, senza abbonamento)

PayPal non ha canone mensile: solo commissione sull’ordine (in Italia circa 3% + 0,35 €).

1. Account **PayPal Business** (gratis).
2. [developer.paypal.com](https://developer.paypal.com/) → crea un’app → copia il **Client ID** in `src/data/site.ts` → `paypalClientId`.
3. Senza Client ID il checkout mostra **solo bonifico** (niente form PayPal classico).

### Magazzino + mail ordine (Vercel webhook)

Guida completa passo-passo: **[MAGAZZINO-VERCEL.md](./MAGAZZINO-VERCEL.md)**.

Dopo `PAYMENT.CAPTURE.COMPLETED` il webhook:
- abbassa lo stock nei markdown (patch solo delle righe `stock:`)
- crea spedizione Packlink + link etichetta (se `PACKLINK_*` è configurato)
- manda email allo shop (**server-side**, non dal browser)

**Bonifico:** stock a mano in Tina; spedizione quotata in checkout, etichetta Packlink a mano.

Limite noto: due acquisti sulla stessa pezza nello stesso minuto possono ancora “oversell”; in quel caso la mail ha oggetto `ATTENZIONE oversell`.

#### Env Vercel (oltre a PayPal/GitHub)

- `SHOP_EMAIL` — stessa inbox di Tina *Email shop* (es. `info@corpoceleste.eu`)
- vedi `.env.example` per l’elenco completo


#### 1. GitHub token

1. GitHub → Settings → Developer settings → Personal access tokens (fine-grained).
2. Repo `ultrastruttura/corpoceleste`, permesso **Contents: Read and write**.
3. Copia il token.

#### 2. Progetto Vercel (solo API)

1. [vercel.com](https://vercel.com) → Import del repo (piano Hobby gratis).
2. Framework Preset: **Other**.
3. Build Command: lascia vuoto (usa `vercel.json`).
4. Deploy.
5. Project → Settings → Environment Variables (Production), come in `.env.example`:
   - `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (stessa app PayPal del sito)
   - `PAYPAL_WEBHOOK_ID` (dopo lo step 3)
   - `PAYPAL_MODE=live` (o `sandbox` per prove)
   - `SHOP_EMAIL` (inbox ordini, es. info@corpoceleste.eu)
   - `GITHUB_TOKEN`
   - `GITHUB_REPO=ultrastruttura/corpoceleste`
   - `GITHUB_BRANCH=main`
   - `PACKLINK_API_KEY` + `PACKLINK_FROM_*` (vedi `.env.example` / [MAGAZZINO-VERCEL.md](./MAGAZZINO-VERCEL.md))
6. URL funzione: `https://TUO-PROGETTO.vercel.app/api/paypal-webhook`  
   (GET deve rispondere `{ ok: true }`).

#### 3. Webhook PayPal

1. developer.paypal.com → la tua app → **Webhooks** → Add webhook.
2. URL: `https://TUO-PROGETTO.vercel.app/api/paypal-webhook`
3. Evento: **Payment capture completed** (`PAYMENT.CAPTURE.COMPLETED`).
4. Copia il **Webhook ID** in `PAYPAL_WEBHOOK_ID` su Vercel → Redeploy.

#### 4. Sito

Metti lo stesso **Client ID** Live in `src/data/site.ts` → `paypalClientId`, push, aspetta Pages.

Dopo un ordine di prova (sandbox o 1€), in repo dovresti vedere:
- un file in `stock-ledger/`
- stock aggiornato nel markdown del prodotto
- email a `SHOP_EMAIL` (FormSubmit)
