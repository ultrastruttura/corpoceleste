# Admin Corpoceleste (TinaCMS)

Chi gestisce lo shop **non deve programmare**. Apre il pannello, modifica, salva.

## Cosa si può fare

| Sezione | Azioni |
|---------|--------|
| **Maglie** | Aggiungere / togliere prodotti, prezzo, stato, taglie, **2–3 foto**, descrizione IT/EN/DE, **meta SEO** |
| **Artisti** | Aggiungere / togliere artisti, bio, **meta SEO** |
| **News** | Aggiungere / togliere / modificare articoli |
| **SEO e home** | Meta description, H1 home, immagine Open Graph, **bio Andrea** |

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
   - `TINA_CLIENT_ID`
   - `TINA_TOKEN`
4. Dopo il deploy, apri:  
   `https://ultrastruttura.github.io/corpoceleste/admin/`  
   Accedi con GitHub, modifica, salva → Tina fa commit → Pages si ricostruisce.

Senza questi secret l’admin online non salva (in locale funziona comunque).

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
