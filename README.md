# Corpoceleste

Sito statico dello shop. Hosting: GitHub Pages (gratis). Nessun abbonamento.

## Sviluppo

```bash
npm install
npm run dev
```

## Pubblicare su GitHub Pages

1. Push su `https://github.com/ultrastruttura/corpoceleste`.
2. Su GitHub: **Settings → Pages → Source: GitHub Actions**.
3. Il workflow in `.github/workflows/deploy.yml` pubblica a ogni push su `main`.
4. URL: `https://ultrastruttura.github.io/corpoceleste/`

Se usi un dominio (es. corpoceleste.com): in `astro.config.mjs` metti `base: "/"` e `site: "https://corpoceleste.com"`, e togli `GITHUB_PAGES: "true"` dal workflow.

## Contenuti da cambiare

- Email, Instagram, IBAN: `src/data/site.ts`
- Maglie: `src/data/products.ts` + file in `src/assets/prints/`
- Artisti: `src/data/artists.ts`
- News: `src/data/news.ts`
- Corsi: `src/data/workshops.ts`

I prodotti ora sono placeholder grafici. Sostituisci con foto delle maglie.

## Checkout (PayPal, senza abbonamento)

PayPal non ha canone mensile: solo commissione sull’ordine (in Italia circa 3% + 0,35 €).

1. Account **PayPal Business** (gratis).
2. In `src/data/site.ts` metti `paypalEmail` (l’email del conto).
3. Opzionale, bottone sulla pagina invece del redirect: [developer.paypal.com](https://developer.paypal.com/) → crea un’app → copia il **Client ID** in `paypalClientId`.

Prima di spedire, controlla in PayPal che l’importo corrisponda all’ordine (sito statico, senza server).
