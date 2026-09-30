# Guida: Vercel + magazzino automatico (PayPal)

Il sito resta su **GitHub Pages**.  
**Vercel** serve solo a ricevere il segnale “pagamento riuscito” da PayPal e a:

1. abbassare i pezzi in Tina / markdown (`stock` per taglia)
2. mandarti una mail d’ordine
3. (se configurato il portal artisti) scrivere la vendita sul deal in Turso — vedi [PORTAL.md](PORTAL.md)

**Gratis** (piano Hobby Vercel + PayPal senza canone, solo commissioni sull’ordine).

**Non vale per il bonifico:** lì aggiorni lo stock a mano in Tina dopo il pagamento.

---

## Cosa ti serve prima

- [ ] Account GitHub sul repo `ultrastruttura/corpoceleste`
- [ ] Account [PayPal Business](https://www.paypal.com/)
- [ ] Accesso a [developer.paypal.com](https://developer.paypal.com/) (stesso login PayPal)
- [ ] Account [Vercel](https://vercel.com) (login con GitHub, più semplice)
- [ ] In Tina, pezzi reali per taglia (non lasciare i `5` di prova se non sono veri)

---

## Panoramica (5 pezzi)

```text
Cliente paga con PayPal sul sito
        ↓
PayPal conferma il pagamento
        ↓
PayPal chiama Vercel (webhook)
        ↓
Vercel aggiorna lo stock su GitHub + ti manda email
        ↓
GitHub Pages ricostruisce il sito (1–3 minuti)
```

---

## Passo 1 — App PayPal (Client ID + Secret)

1. Vai su [developer.paypal.com](https://developer.paypal.com/) → **Dashboard** → **Apps & Credentials**.
2. In alto scegli **Live** (produzione) oppure **Sandbox** (solo prove).
3. **Create App** (tipo Merchant / Checkout).
4. Copia e tieni da parte:
   - **Client ID**
   - **Secret** (mostra/copia: lo vedi una volta, salvalo)

Questi due valori devono essere **uguali** su:

- sito (`paypalClientId` = solo il Client ID)
- Vercel (`PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET`)

---

## Passo 2 — Token GitHub (per scrivere lo stock)

1. GitHub → la tua foto profilo → **Settings**.
2. In basso a sinistra: **Developer settings** → **Personal access tokens** → **Fine-grained tokens**.
3. **Generate new token**:
   - Nome: es. `corpoceleste-stock`
   - Expiration: scegli tu (es. 1 anno; poi andrà rinnovato)
   - Repository access: **Only select repositories** → `ultrastruttura/corpoceleste`
   - Permissions → **Repository permissions** → **Contents**: **Read and write**
4. Genera e **copia il token** (inizia spesso con `github_pat_…`). Non si rivela più dopo.

---

## Passo 3 — Progetto Vercel

1. [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. Importa il repo **`ultrastruttura/corpoceleste`** (autorizza GitHub se chiede).
3. Impostazioni progetto:
   - **Framework Preset:** `Other`
   - **Build Command:** vuoto (il repo ha già `vercel.json`)
   - **Root Directory:** lascia `.` / vuoto
4. **Deploy** (anche se ancora mancano le variabili: le metti subito dopo).

Quando il deploy è fatto, annota l’URL tipo:

`https://corpoceleste-xxxx.vercel.app`

La funzione magazzino sarà:

`https://corpoceleste-xxxx.vercel.app/api/paypal-webhook`

Copia anche l’URL base (`https://corpoceleste-xxxx.vercel.app`) in `src/data/site.ts` → `formApi`: da lì partono conferma d’ordine (bonifico) e avviso di recesso.

Apri quell’URL nel browser (GET): deve rispondere qualcosa tipo:

```json
{ "ok": true, "service": "paypal-webhook" }
```

Se non risponde, aspetta il deploy o controlla i log su Vercel → Deployments.

---

## Passo 4 — Variabili d’ambiente su Vercel

Vercel → il progetto → **Settings** → **Environment Variables**.

Aggiungi queste (Environment: **Production**, e anche Preview se vuoi testare i branch):

| Nome | Valore |
|------|--------|
| `PAYPAL_CLIENT_ID` | Client ID dell’app PayPal |
| `PAYPAL_CLIENT_SECRET` | Secret dell’app PayPal |
| `PAYPAL_MODE` | `live` oppure `sandbox` (deve coincidere con l’app) |
| `PAYPAL_WEBHOOK_ID` | *(lo metti al passo 5, dopo aver creato il webhook)* |
| `SHOP_EMAIL` | es. `info@corpoceleste.com` (stessa inbox di Tina *Email shop*) |
| `SITE_URL` | URL pubblico del sito, es. `https://ultrastruttura.github.io/corpoceleste` |
| `RESEND_API_KEY` | chiave da [resend.com](https://resend.com) (mail di conferma al cliente) |
| `MAIL_FROM` | es. `Corpoceleste <info@corpoceleste.com>` (dominio verificato su Resend) |
| `GITHUB_TOKEN` | il fine-grained token |
| `GITHUB_REPO` | `ultrastruttura/corpoceleste` |
| `GITHUB_BRANCH` | `main` |

Salva, poi **Redeploy** l’ultimo deployment (Deployments → ⋮ → Redeploy), altrimenti le variabili non entrano in vigore.

---

## Passo 5 — Webhook PayPal → Vercel

1. [developer.paypal.com](https://developer.paypal.com/) → la tua app → **Webhooks** → **Add webhook**.
2. **Webhook URL:**  
   `https://TUO-PROGETTO.vercel.app/api/paypal-webhook`
3. Evento da spuntare:
   - **Payment capture completed**  
     (nome tecnico: `PAYMENT.CAPTURE.COMPLETED`)
4. Salva e copia il **Webhook ID**.
5. Incollalo su Vercel in `PAYPAL_WEBHOOK_ID` → **Redeploy** di nuovo.

Senza Webhook ID corretto, Vercel rifiuta le chiamate (firma non verificata).

---

## Passo 6 — Client ID sul sito (GitHub Pages)

1. Apri `src/data/site.ts` nel repo.
2. Metti:

```ts
paypalClientId: "IL_TUO_CLIENT_ID_LIVE_O_SANDBOX",
```

(stesso Client ID del passo 1)

3. Commit + push su `main`.
4. Aspetta che GitHub Actions finisca (Pages aggiornato).

In checkout deve comparire il **bottone PayPal**.  
Se `paypalClientId` è vuoto, vedi solo il bonifico.

---

## Passo 7 — Prova che funziona

### Opzione A — Sandbox (consigliata la prima volta)

1. App e `PAYPAL_MODE=sandbox`, Client ID **Sandbox** sia su Vercel sia in `site.ts`.
2. Account acquirente di test da developer.paypal.com → Sandbox → Accounts.
3. Ordina una maglia, paga con l’account sandbox.
4. Controlla:
   - [ ] Repo GitHub: nuovo file in `stock-ledger/`
   - [ ] File prodotto in `content/products/…`: numeri `stock` diminuiti
   - [ ] Email a `SHOP_EMAIL` (FormSubmit; la prima volta FormSubmit può chiedere conferma all’indirizzo)
   - [ ] Dopo 1–3 minuti, sul sito la taglia aggiornata (o esaurita se a 0)

### Opzione B — Live

Stesso flusso con `PAYPAL_MODE=live`, Client ID Live, e un ordine reale piccolo.

---

## Uso quotidiano

| Situazione | Cosa fare |
|------------|-----------|
| Vendita **PayPal** (bottone sul sito) | Niente: stock e mail automatici |
| Vendita **bonifico** | Quando arriva il soldi → Tina → Maglia → **Magazzino** → abbassa la taglia → Salva |
| Nuova maglia | Tina: pezzi iniziali per S/M/L/XL |
| Taglia a 0 | Non acquistabile da sola; se tutte a 0 → trattata come esaurita |
| Mail “ATTENZIONE oversell” | Due ordini quasi insieme sulla stessa pezza: verifica a mano e scusa/ristorna se serve |

---

## Problemi frequenti

| Sintomo | Cosa controllare |
|---------|------------------|
| Nessun bottone PayPal | `paypalClientId` vuoto o Pages non ancora aggiornato dopo il push |
| Bottone ok ma stock non scende | Webhook URL sbagliato; `PAYPAL_WEBHOOK_ID` mancante; Redeploy non fatto; evento non è *Payment capture completed* |
| GET `/api/paypal-webhook` non risponde | Deploy Vercel fallito; Framework non su Other; log in Deployments |
| Stock non si scrive su GitHub | Token senza **Contents: Read and write**; `GITHUB_REPO` / branch sbagliati; token scaduto |
| Nessuna email | `SHOP_EMAIL` vuoto; conferma FormSubmit sulla prima mail a quell’indirizzo |
| Sandbox vs Live misti | Client ID Sandbox con `PAYPAL_MODE=live` (o il contrario) → fallisce |

---

## Cosa non fa questo setup

- Non sposta il sito su Vercel (resta Pages)
- Non aggiorna lo stock per i bonifici
- Non evita al 100% la doppia vendita nello stesso minuto (volume basso: ok; se cresci, serve altro)

---

## Riferimenti nel repo

- Variabili: `.env.example`
- Codice webhook: `api/paypal-webhook.ts`
- Magazzino in Tina: campo **Magazzino** su ogni prodotto + **Tipo** (maglia/stampa/edizione)
- Email shop (form sito): Tina → **SEO e home** → *Email shop*
