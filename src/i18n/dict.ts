import type { Locale } from "./locales";

const it = {
  meta: {
    description:
      "Serigrafia d’artista a un colore, stampata a mano a Bergamo. Maglie, stampe ed edizioni — non print-on-demand. Spedizione in Italia e in Europa.",
  },
  home: {
    title: "Serigrafie d’autore",
    lede: "Un colore, stampato a mano a Bergamo. Maglie, stampe ed edizioni — non print-on-demand.",
    stageAlt: "Corpoceleste — stampa serigrafica olografica",
  },
  nav: {
    main: "Principale",
    shop: "Shop",
    artists: "Artisti",
    news: "News",
    workshops: "Corsi",
    bio: "Bio",
    contact: "Contatti",
    cart: "Carrello",
    menu: "Menu",
    language: "Lingua",
    skip: "Vai al contenuto",
    tagline: "Serigrafie d’autore",
    brandMark: "Corpoceleste",
    brandWord: "Corpoceleste",
  },
  footer: {
    studio: "Studio",
    subscribe: "Iscriviti",
    made: "Made in Bergamo.",
    social: "Social",
    terms: "Condizioni",
    withdrawal: "Recesso",
    privacy: "Privacy",
    cookies: "Cookie",
    account: "Area",
  },
  shop: {
    soldOut: "Esaurite",
    soldBadge: "Esaurito",
    preorderBadge: "Pre-order",
    lowStockBadge: "In esaurimento",
  },
  product: {
    size: "Taglia",
    add: "Aggiungi al carrello",
    sold: "Esaurita.",
    sizeOut: "Esaurita",
    stockLeft: (n: number) => (n === 1 ? "1 pezzo" : `${n} pezzi`),
    preorder: "Pre-order. Spedizione quando la stampa è pronta.",
    lowStock: "Pochi pezzi rimasti.",
    reprint: "Richiedi ristampa",
    printOne: "Serigrafia, un colore",
    vatIncluded: "Prezzo IVA inclusa",
    compositionLabel: "Come da etichetta cucita sul capo.",
    sizeChart: "Tabella taglie",
    sizeChest: "½ petto",
    sizeLength: "Lunghezza",
    sizeSleeve: "Manica",
    sizeUnit: "cm",
    sizeChartNote:
      "Misure del capo disteso, in centimetri. ½ petto = da cucitura a cucitura, non la circonferenza. Tolleranza di stampa circa ±1 cm. Confronta con una maglia che ti sta. Se l’etichetta cucita indica una composizione diversa da quella in pagina, vale l’etichetta.",
    careGuideAlt: "Guida al lavaggio della maglia serigrafata Corpoceleste",
    galleryPrev: "Foto precedente",
    galleryNext: "Foto successiva",
    shipLine: "Spedizione in Italia e in Europa — costo calcolato in checkout (Sendcloud).",
    /** Alt SEO commerciale: tipo + opera + artista + keyword vendita. */
    imageAlt: (kind: "shirt" | "print" | "edition", title: string, artist: string) => {
      const withArtist = artist && artist !== title;
      if (kind === "print") {
        return withArtist
          ? `Stampa d'artista «${title}» di ${artist}, edizione limitata Corpoceleste Bergamo`
          : `Stampa d'artista «${title}», edizione limitata Corpoceleste Bergamo`;
      }
      if (kind === "edition") {
        return withArtist
          ? `Edizione d'artista «${title}» di ${artist}, serigrafia a mano Corpoceleste Bergamo`
          : `Edizione d'artista «${title}», serigrafia a mano Corpoceleste Bergamo`;
      }
      return withArtist
        ? `Maglia serigrafata «${title}» di ${artist}, arte indossabile cotone stampata a mano a Bergamo — Corpoceleste`
        : `Maglia serigrafata «${title}», arte indossabile cotone stampata a mano a Bergamo — Corpoceleste`;
    },
    imageAltDetail: (base: string, n: number) => `${base} — dettaglio ${n}`,
    colors: {
      Nero: "Nero",
      Viola: "Viola",
    } as Record<string, string>,
    /** Composizione fibrosa (reg. UE 1007/2011): chiave in italiano, resa per lingua. */
    compositions: {
      "100% cotone": "100% cotone",
      "100% cotone biologico": "100% cotone biologico",
    } as Record<string, string>,
  },
  cart: {
    title: "Carrello",
    empty: "Il carrello è vuoto.",
    total: (n: number) => `Totale ${n} €`,
    totalLabel: "Totale",
    remove: "Rimuovi",
    close: "Chiudi",
    checkout: "Checkout",
    sizeOf: (title: string) => `Taglia ${title}`,
    qtyDown: "Diminuisci quantità",
    qtyUp: "Aumenta quantità",
    shipping: "Spedizione",
    shippingLater: "calcolata in seguito",
    viewPage: "Apri pagina carrello",
    sizeUnavailable: "Questa taglia non è più disponibile: scegline un’altra o rimuovi la riga.",
  },
  checkout: {
    title: "Checkout",
    empty: "Il carrello è vuoto.",
    shippingTitle: "Spedizioni",
    shippingBody:
      "Studio di una persona: stampo e imballo io. Spedisco due volte a settimana. Se ti serve per una data precisa, scrivi prima di ordinare.",
    termsLead: "Ho letto i tempi di spedizione e le ",
    termsLink: "condizioni di vendita",
    termsTail: ", recesso e garanzia inclusi.",
    vatIncluded: "Prezzi in euro, IVA inclusa. La spedizione è calcolata con Sendcloud per Italia e Unione europea.",
    payObligation: "Premendo il pulsante concludi un ordine con obbligo di pagamento.",
    readPrivacy: (privacy: string) => `Ho letto l’${privacy}.`,
    privacyLink: "informativa privacy",
    shipTo: "Spedizione",
    shipCountry: "Paese",
    shipZip: "Codice postale",
    italy: "Italia",
    europe: "Europa",
    shippingQuoteLoading: "Calcolo spedizione…",
    shippingQuoteError: "Spedizione non disponibile per questo paese o codice postale. Controlla o scrivimi.",
    shippingQuoteNeedZip: "Scegli il paese e il codice postale (Italia o UE) per calcolare la spedizione.",
    paypal: "PayPal",
    paypalBack: "Torna a Corpoceleste",
    payTitle: "Scegli il pagamento",
    methodPaypal: "PayPal (carta) / Apple Pay / Google Pay",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    bank: "Bonifico",
    bankNote:
      "L’importo da bonificare include merce e spedizione (stessa quote Sendcloud di PayPal). Invia il modulo: ti arriva subito una email con IBAN, importo e causale. L’ordine è confermato quando arriva il pagamento (riserva 5 giorni).",
    bankAmountDue: "Importo da bonificare",
    bankAmountOfWhichShip: "di cui spedizione",
    name: "Nome e cognome",
    email: "Email",
    phone: "Telefono (facoltativo)",
    address: "Indirizzo (via e numero)",
    city: "Città",
    province: "Provincia / regione (facoltativo)",
    notes: "Note",
    sendOrder: "Ordine con obbligo di pagamento",
    unlockPay: "Accetta condizioni e privacy, completa l’indirizzo e attendi il calcolo spedizione.",
  },
  forms: {
    name: "Nome",
    email: "Email",
    message: "Messaggio",
    notes: "Note",
    send: "Invia",
    subscribe: "Iscriviti",
    newsletterEmail: "Email newsletter",
    privacy: "informativa privacy",
    privacyCheck: (privacy: string) => `Ho letto l’${privacy}.`,
    newsletterCheck: (privacy: string) =>
      `Voglio ricevere la newsletter. Ho letto l’${privacy}.`,
    privacyLead: "Ho letto l’",
    newsletterLead: "Voglio ricevere la newsletter. Ho letto l’",
    privacyTail: ".",
  },
  contact: {
    title: "Contatti",
    previousShop: "Shop precedente, 2012–2019.",
    paintings: "Pittura e progetti paralleli di Andrea Baldelli.",
    linksTitle: "Contatti e social",
    pastTitle: "Vecchi progetti",
    photoAlt: (name: string) =>
      `${name}, serigrafo Corpoceleste — studio di serigrafia artistica e maglie stampate a mano a Bergamo`,
  },
  workshops: {
    title: "Corsi",
    introTitle: "",
    intro:
      "Oltre all’aspetto pratico di stampa mi è sempre interessata la parte didattica della tecnica: insegno serigrafia da poco dopo aver iniziato a stampare, più o meno in tutta Italia e anche all’estero.\n\nSe vuoi partecipare a un mio corso di serigrafia controlla qui sotto la lista di quelli in programma, oppure iscriviti alla LISTA D’ATTESA tramite il form: quando raggiungiamo un certo numero di persone ne organizziamo uno nel mio studio a Bergamo.\n\nSe invece sei un’associazione, una scuola, una serigrafia, una galleria d’arte o comunque hai uno spazio a disposizione e vuoi organizzare un corso nella tua città, contattami nell’altro form (ORGANIZZAZIONE WORKSHOP) e ne parliamo.",
    waitlist: "Lista d’attesa",
    waitlistBody:
      "Workshop nel mio studio a Bergamo: fammi sapere che sei interessata/o, quando ho un certo numero di persone in attesa vi scrivo e fissiamo una data (un sabato o una domenica)",
    onSite: "Organizzazione workshop",
    onSiteBody:
      "Scrivimi per organizzare un workshop nella tua città. Ho una versione portatile di tutti i macchinari necessari, serve solo una stanza, un tavolo e dell’acqua corrente.",
    spaceName: "Nome e spazio",
    city: "Città / sede",
    archive: "Archivio",
    since: "Workshop di stampa tenuti in passato.",
    upcoming: "Prossimi workshop",
    upcomingLead: "Per iscriversi contatta l’organizzatore della data che ti interessa.",
    upcomingEmpty: "Nessuna data pubblica in programma. Usa la lista d’attesa sopra, oppure proponi un workshop presso di voi.",
    organizedBy: "Organizzato da",
    signup: "Iscriviti",
    studioAlt:
      "Corso di serigrafia artistica Corpoceleste a Bergamo — workshop di stampa a mano su telaio, maglie e carta",
  },
  bio: {
    title: "Bio",
    print: "Stampa",
    printBody: "Impianti, inchiostri, flussi di lavoro, formazione.",
    printCv:
      "Formazione del personale Za.Er. ad Asmara, in studio e in Eritrea. Responsabile R&D in Quaglia.",
    live: "Stampa dal vivo",
    liveBody: "Telai in sede durante eventi.",
    about: "Di cosa si tratta",
    optPrint: "Consulenza di stampa",
    optStaff: "Formazione personale",
    optLive: "Stampa dal vivo",
    optOther: "Altro",
  },
  news: {
    title: "News",
    empty: "Nessun post ancora.",
    imageAlt: (title: string) =>
      `${title} — news Corpoceleste, maglie serigrafate e stampe d'artista Bergamo`,
    imageAltGallery: (title: string, n: number) =>
      `${title} — galleria Corpoceleste, serigrafia artistica e arte indossabile (${n})`,
  },
  artists: {
    title: "Artisti",
    closed: "Elenco in aggiornamento — intanto Bio, Corsi o Contatti.",
  },
  thanks: {
    received: "Ricevuto",
    order: "Ordine ricevuto",
    contact: "Ti rispondo per email.",
    newsletter: "Ti ho mandato una email di conferma: clicca il link per attivare la newsletter.",
    reprint: "Se ristampo, ti avviso.",
    waitlist: "Quando il gruppo c’è, fisso la data.",
    bank: "Controlla la email: trovi IBAN, importo e causale. L’ordine vale quando arriva il pagamento (riserva 5 giorni).",
    paypal:
      "Se PayPal ha confermato il pagamento, ti scrivo per la spedizione. Questa pagina da sola non è una ricevuta.",
    withdrawal:
      "Recesso registrato. Ricevi via email l’avviso di ricevimento con contenuto, data e ora; poi ti scrivo come rimandare indietro l’articolo.",
  },
  notFound: {
    title: "Pagina non trovata",
    body: "Questa pagina non c’è.",
  },
  privacy: {
    title: "Privacy",
    lede: "Chi tratta i dati, perché, e a chi arrivano.",
    updated: "Ultimo aggiornamento: 28 ottobre 2026.",
    controller: "Titolare",
    controllerBody: (name: string, sede: string) =>
      `${name}, per il sito Corpoceleste. Sede: ${sede}.`,
    vat: (id: string) => `P. IVA ${id}.`,
    contact: "Contatto:",
    cookies: "Cookie e storage",
    cookiesP1:
      "Niente cookie di profilazione o pubblicità: per questo non c’è un banner. Il carrello resta solo nel tuo browser. Umami Analytics conta le visite in forma aggregata, senza cookie sul dispositivo.",
    cookiesP3:
      "Il carrello e il riepilogo ordine stanno sul tuo dispositivo, non su un server nostro.",
    cookiesPaypal:
      "La pagina di checkout carica gli script di PayPal (anche per carta e Apple Pay) e di Google Pay, necessari al pagamento: valgono i loro cookie e le loro informative",
    cookiesMore: "Dettaglio nella",
    cookiesMoreLink: "cookie policy",
    data: "Quali dati, perché",
    dataIntro: "Trattiamo solo ciò che ci scrivi tu:",
    dataOrder:
      "nome, email, telefono, indirizzo, ordine — per spedire e per i conti.",
    dataPaypal: "se paghi con PayPal, carta, Apple Pay o Google Pay, i dati di pagamento li gestisce PayPal; nome, email, telefono e indirizzo arrivano anche a me per l’ordine e la spedizione.",
    dataForms: "nome, email, messaggio — per risponderti, poi li tolgo.",
    dataNewsletter: (email: string) =>
      `solo l’email, se spunti la casella. Revoca quando vuoi scrivendo a ${email}.`,
    noProfiling: "Niente profilazione a fini pubblicitari.",
    basis: "Perché trattiamo i dati e per quanto li teniamo",
    basisItems: [
      "Ordini, spedizioni, fatture — esecuzione del contratto e obblighi fiscali (art. 6.1 b e c GDPR). Conservati 10 anni, come richiesto per le scritture contabili.",
      "Recesso e garanzia — obbligo di legge (art. 6.1 c). Conservati insieme all’ordine.",
      "Contatti, corsi, consulenza, ristampe — risposta a una tua richiesta (art. 6.1 b). Cancellati entro 12 mesi dall’ultimo scambio.",
      "Newsletter — consenso (art. 6.1 a), fino alla disiscrizione. Dopo resta solo l’indirizzo segnato come «disiscritto», per non scriverti più.",
      "Area artisti — contratto con l’artista (art. 6.1 b), per la durata della collaborazione e poi 10 anni per i conti.",
      "Protezione da abusi dei moduli — legittimo interesse (art. 6.1 f). Indirizzo IP cancellato entro 24 ore.",
      "Statistiche Umami — legittimo interesse, dati aggregati e anonimi, nessun cookie.",
    ],
    basisTail:
      "I dati d’ordine servono per spedire; tutto il resto è facoltativo. Nessuna decisione automatizzata.",
    recipients: "Chi riceve i dati",
    transfers: "Trasferimenti extra-UE",
    transfersBody:
      "Pagine su GitHub (USA). Magazzino, webhook PayPal, form e mail su Vercel e Resend (USA). Database di ordini, newsletter e area artisti su Turso (società USA). Statistiche di visita su Umami Cloud (società USA). Pagamenti su PayPal. Se l’API non è attiva, i form possono passare da FormSubmit (USA).",
    formsubmit:
      "fallback dei form se Vercel non è configurato. Società USA. Informativa:",
    paypalRecv: "se paghi con PayPal (sede europea, gruppo anche USA).",
    github: "hosting delle pagine pubbliche. Informativa su github.com.",
    vercel: "webhook PayPal, magazzino, form del sito, area artisti, mail di conferma. Dati d’ordine, non la carta.",
    resend: "invio delle mail (ordini, recesso, contatti, newsletter, corsi), mittente Corpoceleste.",
    umami: "statistiche di visita aggregate, senza cookie e senza profilazione. Informativa:",
    turso: "database di ordini, iscritti alla newsletter e area artisti.",
    sendcloud: "calcolo della spedizione in checkout (paese e CAP) ed etichette di spedizione (nome, indirizzo, telefono).",
    googlePay: "se paghi con Google Pay: il pagamento passa poi da PayPal.",
    couriers: "Corrieri, solo per spedire un ordine.",
    noSell: "I dati non si vendono e non si cedono per marketing di terzi.",
    rights: "Diritti",
    rightsBody:
      "Puoi chiedere accesso, rettifica, cancellazione, limitazione, opposizione e, dove applicabile, portabilità, scrivendo a",
    rightsTail:
      "Revoca la newsletter quando vuoi. Reclamo: Garante privacy,",
    orderBank: "Ordine (bonifico)",
    payPaypal: "Pagamento PayPal",
    formsLabel: "Contatti, corsi, consulenza, richiesta ristampa",
    newsletter: "Newsletter",
  },
  cookiePolicy: {
    title: "Cookie policy",
    lede: "Niente profilazione. Carrello nel browser. Analytics senza cookie. PayPal e Google Pay in checkout.",
    updated: "Ultimo aggiornamento: 28 ottobre 2026.",
    noBanner: "Niente banner",
    noBannerBody:
      "Niente cookie di profilazione o pubblicità: per questo non c’è un banner. Non usiamo Google Analytics né pixel pubblicitari.",
    onSite: "Sul tuo browser",
    onSiteBody:
      "Carrello e riepilogo dopo il checkout restano sul tuo dispositivo (localStorage / sessionStorage), non su un server nostro. Servono solo a far funzionare lo shop.",
    third: "Terze parti",
    thirdBody:
      "Umami Analytics: statistiche di visita aggregate, senza cookie. La pagina di checkout carica gli script di PayPal e Google Pay necessari al pagamento: valgono i loro cookie e le loro informative. Se scrivi il CAP in checkout, solo paese e CAP vanno a zippopotam.us per suggerirti la città.",
    manage: "Come toglierli",
    manageBody: "Impostazioni del browser → dati del sito. Oppure svuota il carrello da qui. Per PayPal, gestisci i cookie dal tuo account o dalle impostazioni del browser.",
    privacyLink: "Informativa privacy completa",
    contact: "Contatto titolare:",
  },
  terms: {
    title: "Condizioni di vendita",
    lede: "Chi vende, cosa compri, come si paga, come si recede.",
    updated: "Ultimo aggiornamento: 28 ottobre 2026.",
    seller: "Venditore",
    vatLabel: "Partita IVA:",
    reaLabel: "REA:",
    sdiLabel: "Codice SDI:",
    pecLabel: "PEC:",
    ibanLabel: "IBAN:",
    ibanHolderLabel: "Intestatario:",
    vatMissing: "Partita IVA: la pubblico quando è attiva.",
    contactLabel: "Contatto:",
    scope: "Cosa regolano",
    scopeBody:
      "Queste condizioni valgono per gli acquisti fatti su questo sito. Sono scritte per chi compra come consumatore, cioè fuori da attività d’impresa o professione. Comprando accetti queste condizioni nella versione pubblicata al momento dell’ordine.",
    products: "Cosa vendo",
    productsBody:
      "Serigrafie stampate a mano, una per volta, in tiratura limitata: maglie, stampe su carta, pezzi numerati. Essendo stampa manuale, piccole differenze di registro, inchiostro e posizione fanno parte del pezzo e non sono difetti. Le foto sono indicative: colore e resa possono variare leggermente da schermo a schermo.",
    prices: "Prezzi",
    pricesBody:
      "I prezzi sono in euro e IVA inclusa, salvo diversa indicazione. La spedizione è a parte: in checkout, per Italia e Unione europea, Sendcloud calcola il corriere più economico da paese e codice postale; il costo entra nel totale da pagare (PayPal o bonifico).",
    order: "Come si conclude l’ordine",
    orderBody:
      "Il contratto si conclude in checkout, quando premi il pulsante di pagamento e ricevi la conferma via email. Se un pezzo non c’è più dopo il pagamento, ti avviso e ti rimborso.",
    payment: "Pagamenti",
    paymentBody:
      "PayPal (anche con carta, tramite PayPal) oppure bonifico bancario. Non tratto né conservo i dati della tua carta: se paghi con PayPal, il pagamento avviene sui sistemi di PayPal. Con bonifico l’ordine è confermato quando ricevo l’accredito; tengo il pezzo in riserva 5 giorni.",
    shipping: "Spedizione e consegna",
    shippingBody: (days: string) =>
      `Imballo e spedisco io dallo studio, di norma entro ${days} giorni lavorativi dalla conferma del pagamento. In ogni caso consegno entro 30 giorni dalla conclusione del contratto, salvo diverso accordo scritto. Il rischio di perdita o danno passa a te alla consegna del pacco. Se il pacco arriva visibilmente danneggiato, accetta con riserva e scrivimi.`,
    withdrawal: "Diritto di recesso: 14 giorni",
    withdrawalBody:
      "Hai 14 giorni per recedere senza dover dare motivazioni. Il termine parte dal giorno in cui tu (o una persona da te indicata) ricevi fisicamente il pacco; se l’ordine contiene più pezzi consegnati separatamente, dall’ultimo.",
    withdrawalHow: "Per recedere puoi usare la funzione online, oppure scrivermi via email una dichiarazione esplicita:",
    withdrawalLink: "recedere dal contratto qui",
    withdrawalEffects:
      "Dopo la comunicazione hai 14 giorni per rispedire il pezzo. Rimborso tutto quello che hai pagato, spedizione standard di andata compresa, entro 14 giorni dal giorno in cui ricevo la tua comunicazione di recesso, con lo stesso mezzo di pagamento che hai usato. Posso sospendere il rimborso finché non ricevo il pezzo o la prova che l’hai rispedito, se arriva prima. Il costo della restituzione è a tuo carico. Rispondi della diminuzione di valore se hai usato il pezzo oltre quanto serve a verificarne natura e caratteristiche: provalo come faresti in negozio.",
    withdrawalExceptions:
      "Il recesso non si applica ai pezzi realizzati su tua misura o chiaramente personalizzati su tua richiesta (art. 59 Codice del consumo). Su ogni pezzo personalizzato lo segnalo prima dell’acquisto.",
    warranty: "Garanzia legale di conformità",
    warrantyBody:
      "Su tutto quello che vendo vale la garanzia legale di 2 anni dalla consegna (artt. 128 e seguenti Codice del consumo). Se il pezzo è difettoso o diverso da quanto descritto, hai diritto a riparazione o sostituzione senza spese e, se non sono possibili o non risolvono, a riduzione del prezzo o risoluzione del contratto con rimborso. Scrivimi con foto e numero d’ordine: le spese di reso per difetto di conformità sono a mio carico. La garanzia legale è distinta dal recesso e vale anche dopo i 14 giorni.",
    complaints: "Reclami e controversie",
    complaintsBody:
      "Per qualsiasi problema scrivimi prima a me: rispondo entro pochi giorni e nella pratica si risolve così. Non aderisco a un organismo ADR specifico. Se non troviamo un accordo, puoi comunque rivolgerti a un organismo iscritto all’elenco del Ministero delle imprese e del made in Italy. La piattaforma europea ODR è stata dismessa nel luglio 2025 e non è più utilizzabile.",
    law: "Legge applicabile",
    lawBody:
      "Legge italiana. Se vivi in un altro paese UE, restano le tutele più favorevoli di lì. Foro: dove abiti tu.",
  },
  withdrawal: {
    title: "Recesso",
    entry: "Recedere dal contratto qui",
    lede: "Modulo online per comunicare il recesso da un ordine fatto su questo sito. Hai 14 giorni dalla consegna.",
    intro:
      "Compila i dati, rileggi il riepilogo e conferma. Dopo la conferma ricevi via email l’avviso di ricevimento con il contenuto della dichiarazione, la data e l’ora di trasmissione.",
    legend: "Dichiarazione di recesso",
    declaration:
      "Con la presente comunico il recesso dal contratto di vendita dei beni sotto indicati, ai sensi dell’art. 52 del Codice del consumo.",
    name: "Nome e cognome",
    email: "Email per l’avviso di ricevimento",
    orderRef: "Ordine da cui recedi",
    orderRefHelp: "Numero d’ordine se ce l’hai, oppure data d’acquisto e pezzi ordinati.",
    received: "Data di consegna (se la ricordi)",
    note: "Note",
    noteHelp: "Facoltative. Non devi motivare il recesso.",
    continue: "Continua",
    reviewTitle: "Rileggi e conferma",
    edit: "Modifica",
    confirm: "Conferma recesso",
    after:
      "Dopo la conferma ti scrivo entro pochi giorni con l’indirizzo per la restituzione. Hai 14 giorni dalla comunicazione per rispedire il pezzo; il costo del reso è a tuo carico.",
    termsLead: "Costi, tempi di rimborso ed eccezioni sono nelle ",
    termsLink: "condizioni di vendita",
    alt: "In alternativa puoi scrivere una dichiarazione esplicita via email a",
  },
};

const en: typeof it = {
  meta: {
    description:
      "One-colour artist screen printing, hand-printed in Bergamo. Shirts, prints and editions — not print-on-demand. Shipping in Italy and across Europe.",
  },
  home: {
    title: "Author’s screen prints",
    lede: "One colour, hand-printed in Bergamo. Shirts, prints and editions — not print-on-demand.",
    stageAlt: "Corpoceleste — holographic screen print",
  },
  nav: {
    main: "Main",
    shop: "Shop",
    artists: "Artists",
    news: "News",
    workshops: "Workshops",
    bio: "Bio",
    contact: "Contact",
    cart: "Cart",
    menu: "Menu",
    language: "Language",
    skip: "Skip to content",
    tagline: "Author’s screen prints",
    brandMark: "Corpoceleste",
    brandWord: "Corpoceleste",
  },
  footer: {
    studio: "Studio",
    subscribe: "Subscribe",
    made: "Made in Bergamo.",
    social: "Social",
    terms: "Terms",
    withdrawal: "Withdrawal",
    privacy: "Privacy",
    cookies: "Cookies",
    account: "Account",
  },
  shop: {
    soldOut: "Sold out",
    soldBadge: "Sold out",
    preorderBadge: "Pre-order",
    lowStockBadge: "Low stock",
  },
  product: {
    size: "Size",
    add: "Add to cart",
    sold: "Sold out.",
    sizeOut: "Sold out",
    stockLeft: (n: number) => (n === 1 ? "1 left" : `${n} left`),
    preorder: "Pre-order. Ships when the print is ready.",
    lowStock: "Only a few left.",
    reprint: "Request a reprint",
    printOne: "Screen print, one colour",
    vatIncluded: "Price includes VAT",
    compositionLabel: "As on the sewn-in label.",
    sizeChart: "Size chart",
    sizeChest: "½ chest",
    sizeLength: "Length",
    sizeSleeve: "Sleeve",
    sizeUnit: "cm",
    sizeChartNote:
      "Garment laid flat, in centimetres. ½ chest is seam to seam, not circumference. Print tolerance about ±1 cm. Compare with a shirt that fits you. If the sewn-in label states a different fibre composition, the label prevails.",
    careGuideAlt: "Care guide for Corpoceleste screen-printed shirts",
    galleryPrev: "Previous photo",
    galleryNext: "Next photo",
    shipLine: "Shipping in Italy and across Europe — cost calculated at checkout (Sendcloud).",
    imageAlt: (kind: "shirt" | "print" | "edition", title: string, artist: string) => {
      const withArtist = artist && artist !== title;
      if (kind === "print") {
        return withArtist
          ? `Artist print “${title}” by ${artist}, limited edition Corpoceleste Bergamo`
          : `Artist print “${title}”, limited edition Corpoceleste Bergamo`;
      }
      if (kind === "edition") {
        return withArtist
          ? `Artist edition “${title}” by ${artist}, hand screen print Corpoceleste Bergamo`
          : `Artist edition “${title}”, hand screen print Corpoceleste Bergamo`;
      }
      return withArtist
        ? `Screen-printed shirt “${title}” by ${artist}, wearable art cotton hand-printed in Bergamo — Corpoceleste`
        : `Screen-printed shirt “${title}”, wearable art cotton hand-printed in Bergamo — Corpoceleste`;
    },
    imageAltDetail: (base: string, n: number) => `${base} — detail ${n}`,
    colors: {
      Nero: "Black",
      Viola: "Purple",
    },
    compositions: {
      "100% cotone": "100% cotton",
      "100% cotone biologico": "100% organic cotton",
    },
  },
  cart: {
    title: "Cart",
    empty: "Your cart is empty.",
    total: (n: number) => `Total ${n} €`,
    totalLabel: "Total",
    remove: "Remove",
    close: "Close",
    checkout: "Checkout",
    sizeOf: (title: string) => `Size ${title}`,
    qtyDown: "Decrease quantity",
    qtyUp: "Increase quantity",
    shipping: "Shipping",
    shippingLater: "calculated later",
    viewPage: "Open cart page",
    sizeUnavailable: "This size is no longer available — pick another or remove the line.",
  },
  checkout: {
    title: "Checkout",
    empty: "Your cart is empty.",
    shippingTitle: "Shipping",
    shippingBody:
      "One-person studio: I print and pack the shirts myself. I ship twice a week. If you need them by a given date, write before you order.",
    termsLead: "I have read the shipping times and the ",
    termsLink: "terms of sale",
    termsTail: ", including withdrawal and legal guarantee.",
    vatIncluded: "Prices in euro, VAT included. Shipping is calculated with Sendcloud for Italy and the EU.",
    payObligation: "Pressing the button places an order with an obligation to pay.",
    readPrivacy: (privacy: string) => `I have read the ${privacy}.`,
    privacyLink: "privacy notice",
    shipTo: "Shipping",
    shipCountry: "Country",
    shipZip: "Postcode",
    italy: "Italy",
    europe: "Europe",
    shippingQuoteLoading: "Calculating shipping…",
    shippingQuoteError: "Shipping is not available for this country or postcode. Check it or write to me.",
    shippingQuoteNeedZip: "Choose country and postcode (Italy or EU) to calculate shipping.",
    paypal: "PayPal",
    paypalBack: "Back to Corpoceleste",
    payTitle: "Choose how to pay",
    methodPaypal: "PayPal (card) / Apple Pay / Google Pay",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    bank: "Bank transfer",
    bankNote:
      "The amount to transfer includes goods and shipping (same Sendcloud quote as PayPal). Send the form: you get an email right away with IBAN, amount and payment reference. The order is confirmed when payment arrives (5-day hold).",
    bankAmountDue: "Amount to transfer",
    bankAmountOfWhichShip: "of which shipping",
    name: "Full name",
    email: "Email",
    phone: "Phone (optional)",
    address: "Address (street and number)",
    city: "City",
    province: "Province / region (optional)",
    notes: "Notes",
    sendOrder: "Order with obligation to pay",
    unlockPay: "Accept terms and privacy, complete the address, and wait for the shipping quote.",
  },
  forms: {
    name: "Name",
    email: "Email",
    message: "Message",
    notes: "Notes",
    send: "Send",
    subscribe: "Subscribe",
    newsletterEmail: "Newsletter email",
    privacy: "privacy notice",
    privacyCheck: (privacy: string) => `I have read the ${privacy}.`,
    newsletterCheck: (privacy: string) =>
      `I want the newsletter. I have read the ${privacy}.`,
    privacyLead: "I have read the ",
    newsletterLead: "I want the newsletter. I have read the ",
    privacyTail: ".",
  },
  contact: {
    title: "Contact",
    previousShop: "Previous shop, 2012–2019.",
    paintings: "Painting and parallel projects by Andrea Baldelli.",
    linksTitle: "Contact and social",
    pastTitle: "Past projects",
    photoAlt: (name: string) =>
      `${name}, Corpoceleste screen printer — artist screen-printing studio and hand-printed shirts in Bergamo`,
  },
  workshops: {
    title: "Workshops",
    introTitle: "",
    intro:
      "Beyond the practical side of printing, I’ve always cared about teaching the craft: I’ve taught screen printing almost since I started printing, more or less across Italy and abroad too.\n\nIf you want to join one of my screen-printing courses, check the upcoming list below, or sign up to the WAITING LIST via the form: when we reach enough people we run one in my Bergamo studio.\n\nIf you’re an association, a school, a print shop, an art gallery, or you have a space and want to organise a course in your city, write through the other form (WORKSHOP ORGANISATION) and we’ll talk.",
    waitlist: "Waiting list",
    waitlistBody:
      "Workshop in my Bergamo studio: let me know you’re interested; when I have enough people on the list I’ll write to you and we’ll set a date (a Saturday or a Sunday).",
    onSite: "Workshop organisation",
    onSiteBody:
      "Write to me to organise a workshop in your city. I have a portable version of all the equipment needed — you only need a room, a table and running water.",
    spaceName: "Name and space",
    city: "City / venue",
    archive: "Archive",
    since: "Past screen-printing workshops.",
    upcoming: "Upcoming workshops",
    upcomingLead: "To sign up, contact the organiser of the date you’re interested in.",
    upcomingEmpty: "No public dates right now. Use the waiting list above, or propose a workshop at your space.",
    organizedBy: "Organised by",
    signup: "Sign up",
    studioAlt:
      "Corpoceleste artist screen-printing workshop in Bergamo — hand-printing class on shirts and paper",
  },
  bio: {
    title: "Bio",
    print: "Printing",
    printBody: "Setups, inks, workflow, training.",
    printCv:
      "Staff training for Za.Er. in Asmara, in the studio and in Eritrea. Head of R&D at Quaglia.",
    live: "Live printing",
    liveBody: "Screens on site at events.",
    about: "What is this about",
    optPrint: "Print consulting",
    optStaff: "Staff training",
    optLive: "Live printing",
    optOther: "Other",
  },
  news: {
    title: "News",
    empty: "No posts yet.",
    imageAlt: (title: string) =>
      `${title} — Corpoceleste news, screen-printed shirts and artist prints Bergamo`,
    imageAltGallery: (title: string, n: number) =>
      `${title} — Corpoceleste gallery, artist screen printing and wearable art (${n})`,
  },
  artists: {
    title: "Artists",
    closed: "List coming soon — for now see Bio, Workshops or Contact.",
  },
  thanks: {
    received: "Received",
    order: "Order received",
    contact: "I’ll write back by email.",
    newsletter: "I sent you a confirmation email: click the link to activate the newsletter.",
    reprint: "If I reprint, I’ll let you know.",
    waitlist: "When the group is together, I’ll set the date.",
    bank: "Check your email: IBAN, amount and payment reference are there. The order stands when payment arrives (5-day hold).",
    paypal:
      "If PayPal confirmed the payment, I’ll write about shipping. This page alone is not a receipt.",
    withdrawal:
      "Withdrawal registered. You’ll get an acknowledgement by email with its content, date and time; then I’ll write about sending the item back.",
  },
  notFound: {
    title: "Page not found",
    body: "This page isn’t here.",
  },
  privacy: {
    title: "Privacy",
    lede: "Who processes the data, why, and who receives it.",
    updated: "Last updated: 28 October 2026.",
    controller: "Controller",
    controllerBody: (name: string, sede: string) =>
      `${name}, for the Corpoceleste site. Address: ${sede}.`,
    vat: (id: string) => `VAT ${id}.`,
    contact: "Contact:",
    cookies: "Cookies and storage",
    cookiesP1:
      "No profiling or advertising cookies: that is why there is no banner. The cart stays only in your browser. Umami Analytics counts visits in aggregate, without cookies on your device.",
    cookiesP3:
      "The cart and order summary stay on your device, not on a server of ours.",
    cookiesPaypal:
      "The checkout page loads the PayPal scripts (also for card and Apple Pay) and Google Pay, needed for payment; their cookies and privacy notices apply",
    cookiesMore: "Detail in the",
    cookiesMoreLink: "cookie policy",
    data: "What data, and why",
    dataIntro: "We only process what you send us:",
    dataOrder:
      "name, email, phone, address, order — to ship and for the accounts.",
    dataPaypal: "if you pay with PayPal, card, Apple Pay or Google Pay, payment data is handled by PayPal; name, email, phone and address also reach me for the order and shipping.",
    dataForms: "name, email, message — to reply, then we delete them.",
    dataNewsletter: (email: string) =>
      `email only, if you tick the box. Withdraw whenever you want by writing to ${email}.`,
    noProfiling: "No advertising profiling.",
    basis: "Why we process data and how long we keep it",
    basisItems: [
      "Orders, shipping, invoices — performance of the contract and tax obligations (art. 6(1)(b) and (c) GDPR). Kept 10 years, as required for accounting records.",
      "Withdrawal and guarantee — legal obligation (art. 6(1)(c)). Kept together with the order.",
      "Contact, workshops, consulting, reprints — answering your request (art. 6(1)(b)). Deleted within 12 months of the last exchange.",
      "Newsletter — consent (art. 6(1)(a)), until you unsubscribe. Afterwards only the address marked “unsubscribed” is kept, so we never write again.",
      "Artist area — contract with the artist (art. 6(1)(b)), for the length of the collaboration and then 10 years for the accounts.",
      "Form abuse protection — legitimate interest (art. 6(1)(f)). IP address deleted within 24 hours.",
      "Umami statistics — legitimate interest, aggregated anonymous data, no cookies.",
    ],
    basisTail:
      "Order data is needed to ship; everything else is optional. No automated decision-making.",
    recipients: "Who receives the data",
    transfers: "Transfers outside the EU",
    transfersBody:
      "Pages on GitHub (USA). Stock, PayPal webhook, forms and mail on Vercel and Resend (USA). Orders, newsletter and artist-area database on Turso (US company). Visit statistics on Umami Cloud (US company). Payments on PayPal. If the API is off, forms may use FormSubmit (USA).",
    formsubmit:
      "form fallback if Vercel is not configured. US company. Notice:",
    paypalRecv: "if you pay with PayPal (European seat, group also in the USA).",
    github: "hosts the public pages. Notice on github.com.",
    vercel: "PayPal webhook, stock, site forms, artist area, confirmation mail. Order data, not the card.",
    resend: "sends mail (orders, withdrawal, contact, newsletter, workshops), from Corpoceleste.",
    umami: "aggregated visit statistics, no cookies and no profiling. Notice:",
    turso: "database for orders, newsletter subscribers and the artist area.",
    sendcloud: "shipping quote at checkout (country and postcode) and shipping labels (name, address, phone).",
    googlePay: "if you pay with Google Pay; the payment then goes through PayPal.",
    couriers: "Couriers, only to ship an order.",
    noSell: "Data is not sold or passed on for third-party marketing.",
    rights: "Rights",
    rightsBody:
      "You can ask for access, rectification, erasure, restriction, objection and, where it applies, portability, by writing to",
    rightsTail:
      "Withdraw the newsletter whenever you want. Complaint: Garante privacy,",
    orderBank: "Order (bank transfer)",
    payPaypal: "PayPal payment",
    formsLabel: "Contact, workshops, consulting, reprint request",
    newsletter: "Newsletter",
  },
  cookiePolicy: {
    title: "Cookie policy",
    lede: "No profiling. Cart in the browser. Cookieless analytics. PayPal and Google Pay at checkout.",
    updated: "Last updated: 28 October 2026.",
    noBanner: "No banner",
    noBannerBody:
      "No profiling or advertising cookies: that is why there is no banner. We do not use Google Analytics or advertising pixels.",
    onSite: "On your browser",
    onSiteBody:
      "Cart and post-checkout summary stay on your device (localStorage / sessionStorage), not on a server of ours. They only make the shop work.",
    third: "Third parties",
    thirdBody:
      "Umami Analytics: aggregated visit statistics, no cookies. The checkout page loads the PayPal and Google Pay scripts needed for payment: their cookies and notices apply. Typing a postcode at checkout sends only country and postcode to zippopotam.us to suggest the city.",
    manage: "How to remove them",
    manageBody: "Browser settings → site data. Or empty the cart from here. For PayPal, manage cookies in your account or browser settings.",
    privacyLink: "Full privacy notice",
    contact: "Controller contact:",
  },
  terms: {
    title: "Terms of sale",
    lede: "Who sells, what you buy, how you pay, how you withdraw.",
    updated: "Last updated: 28 October 2026.",
    seller: "Seller",
    vatLabel: "VAT number:",
    reaLabel: "Business register:",
    sdiLabel: "SDI code:",
    pecLabel: "PEC:",
    ibanLabel: "IBAN:",
    ibanHolderLabel: "Account holder:",
    vatMissing: "VAT number: I’ll publish it when it is active.",
    contactLabel: "Contact:",
    scope: "What these terms cover",
    scopeBody:
      "These terms apply to purchases made on this site. They are written for people buying as consumers, that is outside a business or profession. By ordering you accept the version published at the time of your order.",
    products: "What I sell",
    productsBody:
      "Hand-pulled screen prints in limited runs: shirts, prints on paper, numbered pieces. Because printing is manual, small differences in registration, ink and placement are part of the piece and are not defects. Photos are indicative: colour can vary slightly from screen to screen.",
    prices: "Prices",
    pricesBody:
      "Prices are in euro and include VAT unless stated otherwise. Shipping is charged separately: at checkout, from country and postcode, Sendcloud picks the cheapest carrier and the cost is added to the total you pay (PayPal or bank transfer).",
    order: "How the order is concluded",
    orderBody:
      "The contract is concluded at checkout, when you press the payment button and receive the confirmation by email. If a piece is gone after payment, I tell you and refund you.",
    payment: "Payment",
    paymentBody:
      "PayPal (card payments also go through PayPal) or bank transfer. I never receive or store your card details: with PayPal the payment happens on PayPal’s systems. With bank transfer the order is confirmed when the money arrives; I hold the piece for 5 days.",
    shipping: "Shipping and delivery",
    shippingBody: (days: string) =>
      `I pack and ship from the studio myself, normally within ${days} working days of confirmed payment. In any case I deliver within 30 days of the contract, unless we agree otherwise in writing. Risk of loss or damage passes to you on delivery of the parcel. If a parcel arrives visibly damaged, accept it with reservation and write to me.`,
    withdrawal: "Right of withdrawal: 14 days",
    withdrawalBody:
      "You have 14 days to withdraw without giving any reason. The period starts the day you (or someone you nominate) physically receive the parcel; if the order contains several pieces delivered separately, from the last one.",
    withdrawalHow: "To withdraw you can use the online function, or send me an explicit statement by email:",
    withdrawalLink: "withdraw from the contract here",
    withdrawalEffects:
      "After notifying me you have 14 days to send the piece back. I refund everything you paid, including standard outbound shipping, within 14 days of the day I receive your withdrawal notice, using the same payment method you used. I may withhold the refund until I have the piece back or proof that you sent it, whichever comes first. Return shipping is at your cost. You are liable for any diminished value if you handled the piece beyond what is needed to establish its nature and characteristics: try it as you would in a shop.",
    withdrawalExceptions:
      "Withdrawal does not apply to pieces made to your measurements or clearly personalised at your request (art. 59 Consumer Code). I flag any personalised piece before purchase.",
    warranty: "Legal guarantee of conformity",
    warrantyBody:
      "Everything I sell carries the 2-year legal guarantee from delivery (arts. 128 ff. Consumer Code). If a piece is faulty or not as described, you are entitled to free repair or replacement and, if those are impossible or fail, to a price reduction or to cancel the contract with a refund. Write to me with photos and your order number: return costs for a conformity defect are on me. The legal guarantee is separate from withdrawal and applies well beyond the 14 days.",
    complaints: "Complaints and disputes",
    complaintsBody:
      "For any problem write to me first: I answer within a few days and in practice that settles it. I do not adhere to a specific ADR body. If we cannot agree, you can still turn to a body listed by the Italian Ministry of Enterprise. The European ODR platform was shut down in July 2025 and is no longer available.",
    law: "Applicable law",
    lawBody:
      "Italian law. If you live in another EU country, the more favourable protections there still apply. Court: where you live.",
  },
  withdrawal: {
    title: "Withdrawal",
    entry: "Withdraw from the contract here",
    lede: "Online form to declare withdrawal from an order placed on this site. You have 14 days from delivery.",
    intro:
      "Fill in the details, read the summary and confirm. After confirming you receive an acknowledgement by email with the content of the declaration and the date and time it was sent.",
    legend: "Declaration of withdrawal",
    declaration:
      "I hereby give notice of withdrawal from the contract of sale of the goods indicated below, under art. 52 of the Italian Consumer Code.",
    name: "Full name",
    email: "Email for the acknowledgement",
    orderRef: "Order you are withdrawing from",
    orderRefHelp: "Order number if you have it, otherwise purchase date and items ordered.",
    received: "Delivery date (if you remember it)",
    note: "Notes",
    noteHelp: "Optional. You do not have to give a reason.",
    continue: "Continue",
    reviewTitle: "Read and confirm",
    edit: "Edit",
    confirm: "Confirm withdrawal",
    after:
      "After you confirm I write within a few days with the return address. You have 14 days from the notice to send the piece back; return shipping is at your cost.",
    termsLead: "Costs, refund times and exceptions are in the ",
    termsLink: "terms of sale",
    alt: "Alternatively you can send an explicit statement by email to",
  },
};

const de: typeof it = {
  meta: {
    description:
      "Einfarbiger Künstlersiebdruck, handgedruckt in Bergamo. Shirts, Drucke und Editionen — kein Print-on-Demand. Versand in Italien und Europa.",
  },
  home: {
    title: "Siebdrucke von Autoren",
    lede: "Eine Farbe, handgedruckt in Bergamo. Shirts, Drucke und Editionen — kein Print-on-Demand.",
    stageAlt: "Corpoceleste — holographischer Siebdruck",
  },
  nav: {
    main: "Hauptnavigation",
    shop: "Shop",
    artists: "Künstler",
    news: "News",
    workshops: "Kurse",
    bio: "Bio",
    contact: "Kontakt",
    cart: "Warenkorb",
    menu: "Menü",
    language: "Sprache",
    skip: "Zum Inhalt",
    tagline: "Siebdrucke von Autoren",
    brandMark: "Corpoceleste",
    brandWord: "Corpoceleste",
  },
  footer: {
    studio: "Atelier",
    subscribe: "Anmelden",
    made: "Made in Bergamo.",
    social: "Social",
    terms: "AGB",
    withdrawal: "Widerruf",
    privacy: "Datenschutz",
    cookies: "Cookies",
    account: "Bereich",
  },
  shop: {
    soldOut: "Ausverkauft",
    soldBadge: "Ausverkauft",
    preorderBadge: "Pre-order",
    lowStockBadge: "Fast ausverkauft",
  },
  product: {
    size: "Größe",
    add: "In den Warenkorb",
    sold: "Ausverkauft.",
    sizeOut: "Ausverkauft",
    stockLeft: (n: number) => (n === 1 ? "1 Stück" : `${n} Stück`),
    preorder: "Pre-order. Versand, sobald der Druck fertig ist.",
    lowStock: "Nur noch wenige Stück.",
    reprint: "Nachdruck anfragen",
    printOne: "Siebdruck, eine Farbe",
    vatIncluded: "Preis inkl. MwSt.",
    compositionLabel: "Wie auf dem eingenähten Etikett.",
    sizeChart: "Größentabelle",
    sizeChest: "½ Brust",
    sizeLength: "Länge",
    sizeSleeve: "Ärmel",
    sizeUnit: "cm",
    sizeChartNote:
      "Maß des flach liegenden Kleidungsstücks, in Zentimetern. ½ Brust ist Naht zu Naht, nicht der Umfang. Drucktoleranz etwa ±1 cm. Vergleich mit einem Shirt, das dir passt. Steht auf dem eingenähten Etikett eine andere Faserzusammensetzung, gilt das Etikett.",
    careGuideAlt: "Pflegehinweise für siebgedruckte Corpoceleste-Shirts",
    galleryPrev: "Vorheriges Foto",
    galleryNext: "Nächstes Foto",
    shipLine: "Versand in Italien und Europa — Kosten an der Kasse (Sendcloud).",
    imageAlt: (kind: "shirt" | "print" | "edition", title: string, artist: string) => {
      const withArtist = artist && artist !== title;
      if (kind === "print") {
        return withArtist
          ? `Künstlerdruck „${title}“ von ${artist}, limitierte Edition Corpoceleste Bergamo`
          : `Künstlerdruck „${title}“, limitierte Edition Corpoceleste Bergamo`;
      }
      if (kind === "edition") {
        return withArtist
          ? `Künstleredition „${title}“ von ${artist}, handgemachter Siebdruck Corpoceleste Bergamo`
          : `Künstleredition „${title}“, handgemachter Siebdruck Corpoceleste Bergamo`;
      }
      return withArtist
        ? `Siebgedrucktes Shirt „${title}“ von ${artist}, Wearable Art Baumwolle handgedruckt in Bergamo — Corpoceleste`
        : `Siebgedrucktes Shirt „${title}“, Wearable Art Baumwolle handgedruckt in Bergamo — Corpoceleste`;
    },
    imageAltDetail: (base: string, n: number) => `${base} — Detail ${n}`,
    colors: {
      Nero: "Schwarz",
      Viola: "Violett",
    },
    compositions: {
      "100% cotone": "100% Baumwolle",
      "100% cotone biologico": "100% Bio-Baumwolle",
    },
  },
  cart: {
    title: "Warenkorb",
    empty: "Der Warenkorb ist leer.",
    total: (n: number) => `Summe ${n} €`,
    totalLabel: "Summe",
    remove: "Entfernen",
    close: "Schließen",
    checkout: "Kasse",
    sizeOf: (title: string) => `Größe ${title}`,
    qtyDown: "Menge verringern",
    qtyUp: "Menge erhöhen",
    shipping: "Versand",
    shippingLater: "später berechnet",
    viewPage: "Warenkorb-Seite öffnen",
    sizeUnavailable: "Diese Größe ist nicht mehr verfügbar — wähle eine andere oder entferne die Zeile.",
  },
  checkout: {
    title: "Kasse",
    empty: "Der Warenkorb ist leer.",
    shippingTitle: "Versand",
    shippingBody:
      "Ein-Personen-Atelier: ich drucke und packe selbst. Ich schicke zweimal die Woche. Wenn du die Shirts zu einem bestimmten Datum brauchst, schreib vor der Bestellung.",
    termsLead: "Ich habe die Versandzeiten und die ",
    termsLink: "Verkaufsbedingungen",
    termsTail: " gelesen, inklusive Widerruf und Gewährleistung.",
    vatIncluded: "Preise in Euro, inklusive MwSt. Versand wird mit Sendcloud für Italien und die EU berechnet.",
    payObligation: "Mit dem Button gibst du eine zahlungspflichtige Bestellung ab.",
    readPrivacy: (privacy: string) => `Ich habe die ${privacy} gelesen.`,
    privacyLink: "Datenschutzhinweise",
    shipTo: "Versand",
    shipCountry: "Land",
    shipZip: "Postleitzahl",
    italy: "Italien",
    europe: "Europa",
    shippingQuoteLoading: "Versand wird berechnet…",
    shippingQuoteError: "Versand für dieses Land oder diese PLZ nicht verfügbar. Prüfe sie oder schreib mir.",
    shippingQuoteNeedZip: "Land und Postleitzahl wählen (Italien oder EU), um den Versand zu berechnen.",
    paypal: "PayPal",
    paypalBack: "Zurück zu Corpoceleste",
    payTitle: "Zahlung wählen",
    methodPaypal: "PayPal (Karte) / Apple Pay / Google Pay",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    bank: "Überweisung",
    bankNote:
      "Der Überweisungsbetrag enthält Ware und Versand (gleiche Sendcloud-Quote wie PayPal). Schick das Formular: du bekommst sofort eine E-Mail mit IBAN, Betrag und Verwendungszweck. Die Bestellung gilt, wenn die Zahlung da ist (5 Tage Reserve).",
    bankAmountDue: "Zu überweisender Betrag",
    bankAmountOfWhichShip: "davon Versand",
    name: "Vor- und Nachname",
    email: "E-Mail",
    phone: "Telefon (optional)",
    address: "Adresse (Straße und Hausnummer)",
    city: "Ort",
    province: "Provinz / Region (optional)",
    notes: "Anmerkungen",
    sendOrder: "Zahlungspflichtig bestellen",
    unlockPay: "AGB und Datenschutz akzeptieren, Adresse ausfüllen und Versandberechnung abwarten.",
  },
  forms: {
    name: "Name",
    email: "E-Mail",
    message: "Nachricht",
    notes: "Anmerkungen",
    send: "Senden",
    subscribe: "Anmelden",
    newsletterEmail: "E-Mail für den Newsletter",
    privacy: "Datenschutzhinweise",
    privacyCheck: (privacy: string) => `Ich habe die ${privacy} gelesen.`,
    newsletterCheck: (privacy: string) =>
      `Ich möchte den Newsletter. Ich habe die ${privacy} gelesen.`,
    privacyLead: "Ich habe die ",
    newsletterLead: "Ich möchte den Newsletter. Ich habe die ",
    privacyTail: " gelesen.",
  },
  contact: {
    title: "Kontakt",
    previousShop: "Vorheriger Shop, 2012–2019.",
    paintings: "Malerei und parallele Projekte von Andrea Baldelli.",
    linksTitle: "Kontakt und Social",
    pastTitle: "Frühere Projekte",
    photoAlt: (name: string) =>
      `${name}, Siebdrucker Corpoceleste — Atelier für künstlerischen Siebdruck und handgedruckte Shirts in Bergamo`,
  },
  workshops: {
    title: "Kurse",
    introTitle: "",
    intro:
      "Neben dem praktischen Druck hat mich die Didaktik der Technik immer interessiert: ich unterrichte Siebdruck schon seit kurz nach meinem Anfang, mehr oder weniger in ganz Italien und auch im Ausland.\n\nWenn du an einem meiner Siebdruckkurse teilnehmen willst, schau unten in die Liste der Termine, oder trag dich über das Formular in die WARTELISTE ein: wenn wir genug Leute sind, machen wir einen in meinem Atelier in Bergamo.\n\nBist du ein Verein, eine Schule, eine Siebdruckerei, eine Galerie oder hast du einen Raum und willst einen Kurs in deiner Stadt organisieren, schreib über das andere Formular (WORKSHOP-ORGANISATION) und wir sprechen darüber.",
    waitlist: "Warteliste",
    waitlistBody:
      "Workshop in meinem Atelier in Bergamo: melde dich, wenn du interessiert bist; sobald genug Leute auf der Liste sind, schreibe ich euch und wir legen einen Termin fest (Samstag oder Sonntag).",
    onSite: "Workshop-Organisation",
    onSiteBody:
      "Schreib mir, um einen Workshop in deiner Stadt zu organisieren. Ich habe eine transportable Version aller nötigen Maschinen — es braucht nur einen Raum, einen Tisch und fließendes Wasser.",
    spaceName: "Name und Ort",
    city: "Stadt / Ort",
    archive: "Archiv",
    since: "Frühere Siebdruck-Workshops.",
    upcoming: "Nächste Workshops",
    upcomingLead: "Zur Anmeldung kontaktiere den Organisator des Termins, der dich interessiert.",
    upcomingEmpty: "Keine öffentlichen Termine. Nutze die Warteliste oben, oder schlage einen Workshop bei euch vor.",
    organizedBy: "Organisiert von",
    signup: "Anmelden",
    studioAlt:
      "Corpoceleste Siebdruck-Workshop in Bergamo — Kurs für Handdruck auf Shirts und Papier",
  },
  bio: {
    title: "Bio",
    print: "Druck",
    printBody: "Anlagen, Farben, Abläufe, Schulung.",
    printCv:
      "Schulung des Personals von Za.Er. in Asmara, im Atelier und in Eritrea. Leiter F&E bei Quaglia.",
    live: "Live-Druck",
    liveBody: "Siebe vor Ort bei Veranstaltungen.",
    about: "Worum geht es",
    optPrint: "Druckberatung",
    optStaff: "Personalschulung",
    optLive: "Live-Druck",
    optOther: "Anderes",
  },
  news: {
    title: "News",
    empty: "Noch keine Beiträge.",
    imageAlt: (title: string) =>
      `${title} — Corpoceleste News, siebgedruckte Shirts und Künstlerdrucke Bergamo`,
    imageAltGallery: (title: string, n: number) =>
      `${title} — Corpoceleste Galerie, künstlerischer Siebdruck und Wearable Art (${n})`,
  },
  artists: {
    title: "Künstler",
    closed: "Liste in Vorbereitung — vorerst Bio, Kurse oder Kontakt.",
  },
  thanks: {
    received: "Angekommen",
    order: "Bestellung angekommen",
    contact: "Ich antworte per E-Mail.",
    newsletter: "Ich habe dir eine Bestätigungs-E-Mail geschickt: Link klicken, um den Newsletter zu aktivieren.",
    reprint: "Wenn ich nachdrucke, gebe ich Bescheid.",
    waitlist: "Wenn die Gruppe steht, lege ich den Termin fest.",
    bank: "Prüfe deine E-Mail: IBAN, Betrag und Verwendungszweck stehen dort. Die Bestellung gilt, wenn die Zahlung da ist (5 Tage Reserve).",
    paypal:
      "Wenn PayPal die Zahlung bestätigt hat, schreibe ich zum Versand. Diese Seite allein ist keine Quittung.",
    withdrawal:
      "Widerruf erfasst. Du erhältst per E-Mail eine Empfangsbestätigung mit Inhalt, Datum und Uhrzeit; danach schreibe ich zur Rücksendung.",
  },
  notFound: {
    title: "Seite nicht gefunden",
    body: "Diese Seite gibt es nicht.",
  },
  privacy: {
    title: "Datenschutz",
    lede: "Wer die Daten verarbeitet, wozu, und wer sie erhält.",
    updated: "Stand: 28. Oktober 2026.",
    controller: "Verantwortlicher",
    controllerBody: (name: string, sede: string) =>
      `${name}, für die Website Corpoceleste. Sitz: ${sede}.`,
    vat: (id: string) => `USt-IdNr. ${id}.`,
    contact: "Kontakt:",
    cookies: "Cookies und Speicher",
    cookiesP1:
      "Keine Profiling- oder Werbe-Cookies: deshalb gibt es kein Banner. Der Warenkorb bleibt nur in deinem Browser. Umami Analytics zählt Besuche aggregiert, ohne Cookies auf dem Gerät.",
    cookiesP3:
      "Warenkorb und Bestellübersicht bleiben auf deinem Gerät, nicht auf einem Server von uns.",
    cookiesPaypal:
      "Die Kasse lädt die für die Zahlung nötigen Skripte von PayPal (auch für Karte und Apple Pay) und Google Pay; es gelten deren Cookies und Datenschutzhinweise",
    cookiesMore: "Details in der",
    cookiesMoreLink: "Cookie-Richtlinie",
    data: "Welche Daten, wozu",
    dataIntro: "Wir verarbeiten nur, was du uns schreibst:",
    dataOrder:
      "Name, E-Mail, Telefon, Adresse, Bestellung — zum Versand und für die Buchhaltung.",
    dataPaypal: "zahlst du mit PayPal, Karte, Apple Pay oder Google Pay, verarbeitet PayPal die Zahlungsdaten; Name, E-Mail, Telefon und Adresse erhalte auch ich für Bestellung und Versand.",
    dataForms: "Name, E-Mail, Nachricht — zum Antworten, dann löschen wir sie.",
    dataNewsletter: (email: string) =>
      `nur die E-Mail, wenn du das Kästchen ankreuzt. Widerruf jederzeit an ${email}.`,
    noProfiling: "Kein Profiling für Werbung.",
    basis: "Warum wir Daten verarbeiten und wie lange wir sie speichern",
    basisItems: [
      "Bestellungen, Versand, Rechnungen — Vertragserfüllung und steuerliche Pflichten (Art. 6 Abs. 1 lit. b und c DSGVO). 10 Jahre gespeichert, wie für Buchhaltungsunterlagen vorgeschrieben.",
      "Widerruf und Gewährleistung — rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c). Zusammen mit der Bestellung gespeichert.",
      "Kontakt, Kurse, Beratung, Nachdrucke — Beantwortung deiner Anfrage (Art. 6 Abs. 1 lit. b). Gelöscht spätestens 12 Monate nach dem letzten Austausch.",
      "Newsletter — Einwilligung (Art. 6 Abs. 1 lit. a), bis zur Abmeldung. Danach bleibt nur die als „abgemeldet“ markierte Adresse, damit wir dir nicht mehr schreiben.",
      "Künstlerbereich — Vertrag mit dem Künstler (Art. 6 Abs. 1 lit. b), für die Dauer der Zusammenarbeit und danach 10 Jahre für die Abrechnung.",
      "Schutz der Formulare vor Missbrauch — berechtigtes Interesse (Art. 6 Abs. 1 lit. f). IP-Adresse innerhalb von 24 Stunden gelöscht.",
      "Umami-Statistiken — berechtigtes Interesse, aggregierte anonyme Daten, keine Cookies.",
    ],
    basisTail:
      "Bestelldaten sind für den Versand nötig; alles andere ist freiwillig. Keine automatisierten Entscheidungen.",
    recipients: "Wer die Daten erhält",
    transfers: "Übermittlungen außerhalb der EU",
    transfersBody:
      "Seiten auf GitHub (USA). Bestand, PayPal-Webhook, Formulare und Mails auf Vercel und Resend (USA). Datenbank für Bestellungen, Newsletter und Künstlerbereich auf Turso (US-Unternehmen). Besuchsstatistiken auf Umami Cloud (US-Unternehmen). Zahlungen auf PayPal. Ist die API aus, können Formulare über FormSubmit (USA) laufen.",
    formsubmit:
      "Formular-Fallback, wenn Vercel nicht konfiguriert ist. US-Unternehmen. Hinweise:",
    paypalRecv: "wenn du mit PayPal zahlst (Sitz in Europa, Gruppe auch in den USA).",
    github: "hostet die öffentlichen Seiten. Hinweise auf github.com.",
    vercel: "PayPal-Webhook, Bestand, Formulare, Künstlerbereich, Bestätigungsmails. Bestelldaten, keine Karte.",
    resend: "versendet Mails (Bestellung, Widerruf, Kontakt, Newsletter, Kurse), Absender Corpoceleste.",
    umami: "aggregierte Besuchsstatistiken, ohne Cookies und ohne Profiling. Hinweise:",
    turso: "Datenbank für Bestellungen, Newsletter-Abonnenten und Künstlerbereich.",
    sendcloud: "Versandberechnung an der Kasse (Land und PLZ) und Versandetiketten (Name, Adresse, Telefon).",
    googlePay: "wenn du mit Google Pay zahlst; die Zahlung läuft dann über PayPal.",
    couriers: "Paketdienste, nur zum Versand einer Bestellung.",
    noSell: "Daten werden nicht verkauft und nicht für Werbung Dritter weitergegeben.",
    rights: "Rechte",
    rightsBody:
      "Du kannst Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und, soweit es gilt, Datenübertragbarkeit verlangen, per Mail an",
    rightsTail:
      "Newsletter jederzeit widerrufen. Beschwerde: Garante privacy,",
    orderBank: "Bestellung (Überweisung)",
    payPaypal: "PayPal-Zahlung",
    formsLabel: "Kontakt, Kurse, Beratung, Nachdruck",
    newsletter: "Newsletter",
  },
  cookiePolicy: {
    title: "Cookie-Richtlinie",
    lede: "Kein Profiling. Warenkorb im Browser. Analytics ohne Cookies. PayPal und Google Pay an der Kasse.",
    updated: "Stand: 28. Oktober 2026.",
    noBanner: "Kein Banner",
    noBannerBody:
      "Keine Profiling- oder Werbe-Cookies: deshalb gibt es kein Banner. Wir nutzen weder Google Analytics noch Werbe-Pixel.",
    onSite: "In deinem Browser",
    onSiteBody:
      "Warenkorb und Zusammenfassung nach dem Checkout bleiben auf deinem Gerät (localStorage / sessionStorage), nicht auf einem Server von uns. Sie dienen nur dem Shop.",
    third: "Dritte",
    thirdBody:
      "Umami Analytics: aggregierte Besuchsstatistiken, ohne Cookies. Die Kasse lädt die für die Zahlung nötigen Skripte von PayPal und Google Pay: es gelten deren Cookies und Hinweise. Gibst du an der Kasse eine Postleitzahl ein, gehen nur Land und PLZ an zippopotam.us, um den Ort vorzuschlagen.",
    manage: "Wie du sie entfernst",
    manageBody: "Browser-Einstellungen → Website-Daten. Oder den Warenkorb hier leeren. Bei PayPal: Cookies im Konto oder in den Browser-Einstellungen verwalten.",
    privacyLink: "Vollständiger Datenschutzhinweis",
    contact: "Kontakt Verantwortlicher:",
  },
  terms: {
    title: "Verkaufsbedingungen",
    lede: "Wer verkauft, was du kaufst, wie bezahlt wird, wie du widerrufst.",
    updated: "Stand: 28. Oktober 2026.",
    seller: "Verkäufer",
    vatLabel: "USt-IdNr.:",
    reaLabel: "Handelsregister:",
    sdiLabel: "SDI-Code:",
    pecLabel: "PEC:",
    ibanLabel: "IBAN:",
    ibanHolderLabel: "Kontoinhaber:",
    vatMissing: "USt-IdNr.: ich veröffentliche sie, sobald sie aktiv ist.",
    contactLabel: "Kontakt:",
    scope: "Geltungsbereich",
    scopeBody:
      "Diese Bedingungen gelten für Käufe auf dieser Website. Sie sind für Verbraucher geschrieben, also für Käufe außerhalb einer gewerblichen oder beruflichen Tätigkeit. Mit der Bestellung akzeptierst du die zum Zeitpunkt der Bestellung veröffentlichte Fassung.",
    products: "Was ich verkaufe",
    productsBody:
      "Von Hand gedruckte Siebdrucke in limitierter Auflage: Shirts, Papierdrucke, nummerierte Stücke. Weil von Hand gedruckt wird, gehören kleine Abweichungen bei Register, Farbe und Position zum Stück und sind keine Mängel. Fotos sind Anhaltspunkte: Farben können je nach Bildschirm leicht abweichen.",
    prices: "Preise",
    pricesBody:
      "Preise verstehen sich in Euro und inklusive MwSt., sofern nicht anders angegeben. Der Versand wird getrennt berechnet: an der Kasse ermittelt Sendcloud aus Land und PLZ den günstigsten Carrier und der Betrag fließt in die zu zahlende Summe (PayPal oder Überweisung).",
    order: "Zustandekommen der Bestellung",
    orderBody:
      "Der Vertrag kommt an der Kasse zustande, wenn du den Zahlungsbutton drückst und die Bestätigung per E-Mail erhältst. Ist ein Stück nach der Zahlung weg, melde ich mich und erstatte.",
    payment: "Zahlung",
    paymentBody:
      "PayPal (auch Kartenzahlung läuft über PayPal) oder Banküberweisung. Ich erhalte und speichere keine Kartendaten: bei PayPal läuft die Zahlung über die Systeme von PayPal. Bei Überweisung gilt die Bestellung als bestätigt, wenn das Geld eingeht; ich reserviere das Stück 5 Tage.",
    shipping: "Versand und Lieferung",
    shippingBody: (days: string) =>
      `Ich packe und verschicke selbst aus dem Atelier, in der Regel innerhalb von ${days} Werktagen nach bestätigter Zahlung. In jedem Fall liefere ich innerhalb von 30 Tagen nach Vertragsschluss, sofern nichts anderes schriftlich vereinbart ist. Die Gefahr von Verlust oder Beschädigung geht bei Übergabe des Pakets auf dich über. Kommt ein Paket sichtbar beschädigt an, nimm es unter Vorbehalt an und schreib mir.`,
    withdrawal: "Widerrufsrecht: 14 Tage",
    withdrawalBody:
      "Du hast 14 Tage Zeit, ohne Angabe von Gründen zu widerrufen. Die Frist beginnt an dem Tag, an dem du (oder eine von dir benannte Person) das Paket in Besitz nimmst; bei mehreren getrennt gelieferten Stücken ab dem letzten.",
    withdrawalHow: "Zum Widerruf kannst du die Online-Funktion nutzen oder mir eine eindeutige Erklärung per E-Mail schicken:",
    withdrawalLink: "hier vom Vertrag zurücktreten",
    withdrawalEffects:
      "Nach der Mitteilung hast du 14 Tage, um das Stück zurückzuschicken. Ich erstatte alles, was du gezahlt hast, inklusive Standardversand hin, innerhalb von 14 Tagen ab dem Tag, an dem mich dein Widerruf erreicht, über dasselbe Zahlungsmittel. Ich kann die Erstattung zurückhalten, bis ich das Stück zurückhabe oder du den Rückversand nachweist, je nachdem, was früher eintritt. Die Rücksendekosten trägst du. Für einen Wertverlust haftest du, wenn du das Stück über das hinaus benutzt hast, was zur Prüfung von Beschaffenheit und Eigenschaften nötig ist: probier es wie im Laden.",
    withdrawalExceptions:
      "Kein Widerrufsrecht besteht bei Stücken, die nach deinen Maßen gefertigt oder eindeutig auf deine Wünsche zugeschnitten sind (Art. 59 Verbrauchergesetzbuch). Personalisierte Stücke kennzeichne ich vor dem Kauf.",
    warranty: "Gesetzliche Gewährleistung",
    warrantyBody:
      "Für alles, was ich verkaufe, gilt die gesetzliche Gewährleistung von 2 Jahren ab Lieferung (Art. 128 ff. Verbrauchergesetzbuch). Ist ein Stück mangelhaft oder nicht wie beschrieben, hast du Anspruch auf kostenlose Nachbesserung oder Ersatz und, wenn das unmöglich ist oder nicht hilft, auf Minderung oder Vertragsauflösung mit Erstattung. Schreib mir mit Fotos und Bestellnummer: Rücksendekosten bei Mangel trage ich. Die Gewährleistung ist etwas anderes als der Widerruf und gilt weit über die 14 Tage hinaus.",
    complaints: "Beschwerden und Streitigkeiten",
    complaintsBody:
      "Bei Problemen schreib zuerst mir: ich antworte innerhalb weniger Tage, und in der Praxis erledigt sich das so. Ich bin keiner bestimmten AS-Stelle angeschlossen. Kommen wir nicht zusammen, kannst du dich trotzdem an eine beim italienischen Unternehmensministerium gelistete Stelle wenden. Die europäische OS-Plattform wurde im Juli 2025 abgeschaltet und steht nicht mehr zur Verfügung.",
    law: "Anwendbares Recht",
    lawBody:
      "Italienisches Recht. Wohnst du in einem anderen EU-Land, bleiben die günstigeren Schutzvorschriften von dort. Gericht: wo du wohnst.",
  },
  withdrawal: {
    title: "Widerruf",
    entry: "Hier vom Vertrag zurücktreten",
    lede: "Online-Formular, um den Widerruf einer auf dieser Website getätigten Bestellung zu erklären. Du hast 14 Tage ab Lieferung.",
    intro:
      "Daten ausfüllen, Zusammenfassung lesen, bestätigen. Nach der Bestätigung bekommst du per E-Mail eine Empfangsbestätigung mit dem Inhalt der Erklärung sowie Datum und Uhrzeit der Übermittlung.",
    legend: "Widerrufserklärung",
    declaration:
      "Hiermit widerrufe ich den Kaufvertrag über die unten angegebenen Waren gemäß Art. 52 des italienischen Verbrauchergesetzbuchs.",
    name: "Vor- und Nachname",
    email: "E-Mail für die Empfangsbestätigung",
    orderRef: "Betroffene Bestellung",
    orderRefHelp: "Bestellnummer, falls vorhanden, sonst Kaufdatum und bestellte Stücke.",
    received: "Lieferdatum (falls bekannt)",
    note: "Anmerkungen",
    noteHelp: "Freiwillig. Eine Begründung ist nicht nötig.",
    continue: "Weiter",
    reviewTitle: "Lesen und bestätigen",
    edit: "Ändern",
    confirm: "Widerruf bestätigen",
    after:
      "Nach der Bestätigung schreibe ich dir innerhalb weniger Tage die Rücksendeadresse. Du hast 14 Tage ab der Mitteilung, um das Stück zurückzuschicken; die Rücksendekosten trägst du.",
    termsLead: "Kosten, Erstattungsfristen und Ausnahmen stehen in den ",
    termsLink: "Verkaufsbedingungen",
    alt: "Alternativ kannst du eine eindeutige Erklärung per E-Mail schicken an",
  },
};

export const ui = { it, en, de } satisfies Record<Locale, typeof it>;
export type Ui = typeof it;
