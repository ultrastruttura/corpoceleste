# Admin Corpoceleste (TinaCMS)

Chi gestisce lo shop **non deve programmare**. Apre il pannello, modifica, salva.

## Cosa si può fare

| Sezione | Azioni |
|---------|--------|
| **Maglie** | Aggiungere / togliere prodotti, prezzo, stato, taglie, **magazzino (pezzi per taglia)**, **2–3 foto**, descrizione IT/EN/DE, **meta SEO** |
| **Artisti** | Aggiungere / togliere artisti, bio, **meta SEO** |
| **News** | Aggiungere / togliere / modificare articoli |
| **SEO e home** | Meta description, H1 home, immagine Open Graph, **bio Andrea**, **email shop** (ordini e form FormSubmit) |

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
   `https://ultrastruttura.github.io/corpoceleste/admin/`  
   Accedi con GitHub, modifica, salva → Tina fa commit → Pages si ricostruisce.

Senza questi secret (o senza un nuovo deploy dopo averli messi) l’admin online non autentica.

## Magazzino

In ogni maglia imposta i pezzi per taglia (S/M/L/XL). Taglia a 0 = non acquistabile.

Se è attivo il **webhook PayPal** (guida: [MAGAZZINO-VERCEL.md](./MAGAZZINO-VERCEL.md)), dopo un pagamento PayPal lo stock si abbassa da solo e arriva una mail ordine (FormSubmit dal server Vercel).  
**Bonifico:** aggiorna i numeri a mano qui dopo il pagamento; la mail parte dal form del sito.

Email shop (form + fallback): **SEO e home** → *Email shop (ordini e form)*. Per le mail PayPal dal webhook imposta anche `SHOP_EMAIL` su Vercel.

## Dati legali (da compilare)

Le pagine **Condizioni di vendita** (`/vendita/`) e **Recesso** (`/recesso/`) prendono i dati del venditore da `src/data/site.ts`:

| Campo | Cosa metterci |
|-------|---------------|
| `vatId` | Partita IVA. Finché è vuoto la pagina scrive «in corso di attribuzione» |
| `indirizzo` | Indirizzo completo della sede (obbligatorio nelle info precontrattuali) |
| `rea` | Numero REA / Registro imprese, se c’è |
| `telefono` | Telefono di contatto, se lo pubblichi |
| `shippingDays` | Giorni lavorativi indicativi per la spedizione |

I testi delle pagine legali stanno in `src/i18n/dict.ts` (`terms` e `withdrawal`, in IT/EN/DE). Sono bozze operative: falle validare da un legale prima di vendere.

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
