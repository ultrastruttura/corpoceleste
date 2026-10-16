# Admin Corpoceleste (TinaCMS)

Chi gestisce lo shop **non deve programmare**. Apre il pannello, modifica, salva.

## Cosa si può fare

| Sezione | Azioni |
|---------|--------|
| **Maglie** | Aggiungere / togliere prodotti, prezzo, stato, taglie, **magazzino (pezzi per taglia)**, **2–3 foto**, descrizione IT/EN/DE, **meta SEO** |
| **Artisti** | Aggiungere / togliere artisti, bio, **meta SEO** |
| **News** | Aggiungere / togliere / modificare articoli |
| **Bio** | Nome, testo bio IT/EN/DE, sezioni stampa e stampa dal vivo |
| **SEO e home** | Meta description, H1 home, immagine Open Graph, **email shop**, **token Cloudflare Web Analytics** |

Le foto vanno caricate dal pannello (finiscono in `public/uploads/`).

## In locale (sul PC)

```bash
npm install
npm run dev
```

Poi apri: [http://localhost:4321/admin/index.html](http://localhost:4321/admin/index.html)

Salva → i file in `content/` e le foto in `public/uploads/` si aggiornano. Poi:

```bash
git add content public/uploads
git commit -m "Aggiorna maglie"
git push
```

(Oppure usa Tina Cloud online, sotto.)

## Sul sito online

1. Crea un progetto gratis su [app.tina.io](https://app.tina.io) collegato al repo `ultrastruttura/corpoceleste`
2. Copia **Client ID** e **Token**
3. Su GitHub → Settings → Secrets and variables → Actions, aggiungi:
   - `TINA_CLIENT_ID` (Client ID da Overview)
   - `TINA_TOKEN` (token Content Read)
4. **Actions → Run workflow** (il Client ID va nel build come `NEXT_PUBLIC_…`, altrimenti login = Forbidden)
5. Dopo il deploy, apri:  
   `https://www.corpoceleste.eu/admin/`  
   Accedi con GitHub, modifica, salva → Tina fa commit → Pages si ricostruisce.

Senza questi secret (o senza un nuovo deploy dopo averli messi) l’admin online non autentica.

## Magazzino

In ogni maglia imposta i pezzi per taglia (S/M/L/XL). Taglia a 0 = non acquistabile.

Badge **In esaurimento**: in Tina → **SEO e home** → *Soglia “in esaurimento”*. Se la somma dei pezzi di tutte le taglie è ≤ quel numero (default **10**), in griglia e scheda prodotto compare il badge come per Pre-order. Metti **0** per spegnerlo.

Se è attivo il **webhook PayPal** (guida: [MAGAZZINO-VERCEL.md](./MAGAZZINO-VERCEL.md)), lo stock si prenota già alla creazione ordine PayPal e si conferma al pagamento; mail a te e al cliente via Resend.  
**Bonifico:** stock in riserva subito; il cliente riceve email con IBAN + causale. In area riservata → **Pagato** quando arriva l’accredito. Se non segni pagato entro **5 giorni**, lo stock si libera da solo (cron Vercel).

Email shop: **SEO e home** → *Email shop*. Su Vercel: `SHOP_EMAIL`, `RESEND_API_KEY`, `MAIL_FROM`, `CRON_SECRET` (per il rilascio stock).

### Cloudflare Web Analytics (gratis)

1. Account gratis su [dash.cloudflare.com](https://dash.cloudflare.com) (non serve spostare il DNS).
2. **Analytics & logs** → **Web Analytics** → **Add a site** → hostname `corpoceleste.eu` (o `www.corpoceleste.eu`).
3. Copia il **token** dallo snippet JS (`token: "…"`).
4. In Tina → **SEO e home** → *Cloudflare Web Analytics — token*, incolla e salva → push / publish.

**Senza token le visite non si vedono.** Dashboard: stessa sezione Web Analytics su Cloudflare.

## Dati legali (da compilare)

IBAN, P.IVA, REA, telefono, PayPal Client ID e URL Vercel si impostano in Tina → **SEO e home** (override dei default in `src/data/site.ts`).

| Campo Tina | Cosa metterci |
|------------|---------------|
| Partita IVA / IBAN / indirizzo | Obbligatori in pratica per vendere |
| REA / telefono | Se ce li hai; altrimenti lascia vuoti |
| PayPal Client ID / URL API Vercel | Solo se cambi rispetto al default |

I testi di **Condizioni** e **Recesso** stanno in `src/i18n/dict.ts` (IT/EN/DE): **falle firmare al commercialista/avvocato** prima di vendere.

## Mail di conferma (non FormSubmit)

Bonifico e recesso, più la conferma PayPal dal webhook, devono partire **da Vercel con Resend** (mittente `info@corpoceleste.eu`), non in copia da FormSubmit.

1. Account [Resend](https://resend.com) (piano free), verifica il dominio `corpoceleste.eu`
2. Su Vercel: `RESEND_API_KEY`, `MAIL_FROM`, `SHOP_EMAIL`, `SITE_URL`
3. In `src/data/site.ts` imposta `formApi` sull’URL Vercel (es. `https://corpoceleste-xxxx.vercel.app`)

Finché `formApi` è vuoto, bonifico e recesso restano su FormSubmit — solo per lo sviluppo. Le mail al cliente **non** sono una conferma legale finché Resend non è acceso.

## Tabella taglie

Le misure (cm, capo disteso) sono in `src/data/site.ts` → `sizeChart`. **Misura i blank veri** e correggi i numeri prima di vendere. La composizione in Tina deve coincidere con l’etichetta cucita.

## Flusso tipico: nuova maglia

1. Admin → Maglie → **Create New**
2. Titolo, artista, prezzo, stato
3. Carica 2 o 3 foto
4. Salva
5. Push (o salva online via Tina Cloud)
6. Lo shop si aggiorna al prossimo build

## File contenuti (per chi vuole vedere il repo)

- `content/products/` — maglie
- `content/artists/` — artisti
- `content/news/` — news
- `public/uploads/` — immagini caricate
