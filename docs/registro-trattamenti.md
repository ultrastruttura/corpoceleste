# Registro delle attività di trattamento (art. 30 GDPR)

Titolare: **Andrea Baldelli Lorenzo** (P. IVA IT04952110163), Via Moroni 51, Lonno, 24027 Nembro (BG), Italia.  
Contatto: info@corpoceleste.eu — PEC: andrealorenzobaldelli@pec.it.  
Ultimo aggiornamento: **23 novembre 2026**.

Questo foglio è il registro di accountability offline. Allinearlo a privacy/cookie policy e a `content/settings/site.md` a ogni nuovo fornitore.

| # | Attività | Categorie interessati | Dati | Finalità | Base giuridica | Destinatari / sistemi | Extra-UE | Retention |
|---|----------|----------------------|------|----------|----------------|----------------------|----------|-----------|
| 1 | Ordini e-commerce | Clienti / acquirenti | Nome, email, tel, indirizzo, righe ordine, importi, metodo pagamento | Esecuzione contratto, spedizione, contabilità | Art. 6.1 b e c | Vercel, Turso, Resend, Sendcloud, corrieri, PayPal (se wallet) | USA (Vercel, Turso, Resend; SCC/DPF) | 10 anni (obblighi fiscali) |
| 2 | Pagamenti PayPal / carta / Apple Pay / Google Pay | Clienti | Dati pagamento presso PayPal; anagrafica ordine al titolare | Pagamento | Art. 6.1 b | PayPal (Europe) S.à r.l. et Cie, S.C.A.; Google Pay se usato | Gruppo PayPal anche USA | Secondo policy PayPal + ordine 10 anni |
| 3 | Recesso e garanzia | Clienti | Come ordine + dichiarazione recesso | Obblighi Cod. consumo | Art. 6.1 c | Vercel, Resend, Turso | USA (come sopra) | Con l’ordine |
| 4 | Form contatti / corsi / consulenza / ristampa | Utenti del sito | Nome, email, messaggio | Risposta a richiesta | Art. 6.1 b | Vercel, Resend | USA | Entro 12 mesi dall’ultimo scambio |
| 5 | Newsletter | Iscritti | Email, locale, proof consenso (IP, UA, versione privacy), confirmed_at | Invio novità studio | Art. 6.1 a (consenso) | Turso, Resend Segment | USA | Fino a disiscrizione; poi solo flag «disiscritto» |
| 6 | Area artisti (portale) | Artisti collaboratori | Credenziali sessione, ordini collegati, anagrafiche deal | Contratto collaborazione | Art. 6.1 b | Vercel, Turso, cookie `cc_portal_session` | USA | Durata collaborazione + 10 anni conti |
| 7 | Anti-abuso form | Visitatori che inviano form | IP (breve) | Sicurezza / rate limit | Art. 6.1 f | Vercel | USA | ≤ 24 ore |
| 8 | Analytics Umami Cloud | Visitatori | Eventi aggregati (no cookie; DNT rispettato) | Misura traffico sito singolo | Assimilabile a strumento tecnico (Linee guida Garante cookie 2021); no profilazione | Umami Software, Inc. | USA | Secondo policy Umami |
| 9 | Carrello browser | Visitatori shop | localStorage carrello / riepilogo | Funzionamento shop | Strettamente necessario al servizio | Solo dispositivo utente | — | Fino a svuotamento / clear storage |
| 10 | Suggest città (CAP) | Utenti in checkout | Paese + CAP | Autocomplete indirizzo | Art. 6.1 b (passo checkout) | zippopotam.us | Terza parte | Transito; non conservato dal titolare |

## Misure di sicurezza (sintesi)

HTTPS; accessi Tina/GitHub/Vercel limitati; cookie sessione artisti HttpOnly; honeypot + rate limit sui form; prezzi e stock validati server-side; secret newsletter HMAC.

## Diritti e reclami

Canale: info@corpoceleste.eu. Reclamo: Garante per la protezione dei dati personali (garanteprivacy.it).
