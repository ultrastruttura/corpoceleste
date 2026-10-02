# Area artisti (portal)

Area personale privata per Andrea (admin) e gli artisti invitati: deal, costi, vendite, quote e saldi mensili.

Lo shop resta su **GitHub Pages**. Auth + database + API vivono su **Vercel** (stesso progetto del webhook PayPal).

## Cosa fa

- **Admin (Andrea):** invita artisti via magic link, crea deal (prodotto + %, costi edizione), conferma vendite bonifico, segna “saldato” per mese.
- **Artista:** vede pezzi venduti, costi, utile, sua quota, totale dovuto, storico saldi.
- **PayPal:** il webhook, oltre allo stock, scrive le righe vendita sui deal collegati al `product_id`.

Tina resta solo per catalogo pubblico. Percentuali e saldi **non** vanno nei markdown.

## Setup (una volta)

### 1. Database Turso

1. Crea un DB su [turso.tech](https://turso.tech) (piano free va bene).
2. Copia URL (`libsql://…`) e auth token.
3. Su Vercel → Project → Settings → Environment Variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `PORTAL_ADMIN_EMAIL` = email di Andrea (diventa admin al primo accesso API)
   - opzionale: `PORTAL_ADMIN_NAME`, `PORTAL_CORS_ORIGINS` (origini esatte separate da virgola, es. `https://ultrastruttura.github.io,http://localhost:4321`), `PORTAL_SESSION_DAYS` (default 14), `PORTAL_MAGIC_MINUTES` (default 30)
   - **mai** `PORTAL_DEV_LINKS=1` in produzione

Serve già anche (mail / sito):

- `RESEND_API_KEY`, `MAIL_FROM` o `SHOP_EMAIL`
- `SITE_URL` = URL pubblico del sito (es. `https://ultrastruttura.github.io/corpoceleste`) — usato per i link in mail; il CORS usa solo l’**origin** (`https://ultrastruttura.github.io`)

### 2. Sito

In Tina / `site` settings: `formApi` = URL Vercel senza slash finale (stesso usato per ordini/recesso).

Deploy GitHub Pages: compare `/account/` e `/account/auth/`.

### 3. Primo accesso admin

1. Apri `/account/`
2. Inserisci `PORTAL_ADMIN_EMAIL` → ricevi magic link via mail
3. Invita artisti, crea un deal col **product id** Tina uguale allo slug prodotto
4. Le vendite PayPal si collegano da sole; i bonifici si confermano in admin sul deal

Solo in locale / preview: `PORTAL_DEV_LINKS=1` (mai su Production). Con quella flag il login apre la sessione subito, senza mail né link.

## Sicurezza (v1)

- Magic link in **hash** (`#t=…`), non in query; URL pulito dopo il click
- Sessione in **sessionStorage** (scade chiudendo il tab)
- Nessun `devLink` in risposta API su Vercel Production
- Login: stessa risposta se l’email esiste o no
- Rate limit DB su login / verify / invite
- CORS: match **esatto** dell’Origin

## API (Bearer session)

| Path | Uso |
|------|-----|
| `POST /api/account/auth` | `login` / `invite` / `verify` / `logout` / `me` |
| `GET/DELETE /api/account/users` | lista / rimuovi artisti (admin) |
| `GET/POST/DELETE /api/account/deals` | CRUD deal |
| `POST /api/account/sales` | conferma bonifico / vendita manuale |
| `GET/POST/DELETE /api/account/settle` | dashboard + saldi |

## Limiti v1

- Non genera FatturaPA: l’artista vede il **lordo da fatturare**, Andrea segna quando ha pagato.
- Un settlement per artista per mese (`YYYY-MM`); pagamenti successivi nello stesso mese si **sommano**.
- Spedizione / fee PayPal fuori dal prospetto (solo costi di edizione sul deal).

---

## Guida test

### Prerequisiti

- [ ] Env Vercel: `TURSO_*`, `PORTAL_ADMIN_EMAIL`, Resend, `SITE_URL`, `formApi` sul sito
- [ ] Deploy Vercel + Pages aggiornato (o `npm run dev` + `vercel dev` in locale)
- [ ] In locale CORS: apri il sito da `http://localhost:4321` (non un altro host)

### A. Auth admin

1. Vai su `/account/`, inserisci email **non** invitata → messaggio generico, **nessuna** mail
2. Stessa email di nuovo 6+ volte in pochi minuti → `429` / “Troppi tentativi”
3. Inserisci `PORTAL_ADMIN_EMAIL` → mail con link `#t=…`
4. Apri il link → atterri in area admin; barra indirizzi **senza** token
5. Chiudi il tab del browser, riapri `/account/` → chiedi di nuovo il login (sessionStorage)

### B. Invito artista + isolamento

1. Admin: invita un artista (email tua di prova)
2. Esci, entra come artista → vedi solo i suoi deal (vuoto all’inizio)
3. Da artista, chiama (DevTools) `POST .../api/account/users` senza essere admin → `403`
4. Admin: crea un deal con `product_id` = slug Tina reale, costi tipo `Maglie|8.5|pezzo` e `Affitto|100|fisso`, % 40

### C. Vendite e saldi

1. Admin sul deal: **Conferma bonifico** qty 1 → pezzi / quota artista aggiornati
2. Sezione **Saldi per artista**: residuo > 0 → **Segna saldato** mese corrente
3. Rientra come artista → vedi vendita, costi, quota, saldo
4. (Opz.) Ordine PayPal di test su quel prodotto → dopo webhook, stessa riga vendita `source: paypal`

### D. Regressioni sicurezza rapide

1. Risposta `login` **senza** campo `devLink` su Production
2. Da Origin fake (es. pagina su altro dominio) le API account non devono rispondere con `Access-Control-Allow-Origin` di quel dominio
3. Magic link già usato una seconda volta → “non valido o scaduto”
