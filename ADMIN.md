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

Se è attivo il **webhook PayPal** (vedi README), dopo un pagamento con il bottone PayPal lo stock si abbassa da solo.  
**Bonifico** e form PayPal “classico”: aggiorna i numeri a mano qui dopo l’ordine.

Email allo shop: in **SEO e home** → *Email shop (ordini e form)*. Va a FormSubmit per **bonifico**, **PayPal SDK** (dopo capture), contatti, newsletter e altri form.  
Il form PayPal HTML “classico” non manda email automatica (nessun backend al ritorno da PayPal).

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
