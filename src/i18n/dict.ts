import type { Locale } from "./locales";

const it = {
  meta: {
    description:
      "Serigrafia d’artista a un colore, stampata a mano a Bergamo. Maglie, stampe ed edizioni — non print-on-demand. Spedizione in Italia e in Europa.",
  },
  home: {
    title: "Serigrafia d’artista",
    lede: "Edizioni stampate a mano nello studio di Bergamo. Un colore, non print-on-demand — maglie, stampe, pezzi numerati.",
  },
  nav: {
    main: "Principale",
    shop: "Shop",
    artists: "Artisti",
    news: "News",
    workshops: "Corsi",
    consulting: "Consulenza",
    contact: "Contatti",
    cart: "Carrello",
    menu: "Menu",
    language: "Lingua",
  },
  footer: {
    studio: "Studio",
    subscribe: "Iscriviti",
    made: "Made in Bergamo.",
    social: "Social",
  },
  shop: {
    soldOut: "Esaurite",
    soldBadge: "Esaurito",
    preorderBadge: "Pre-order",
  },
  product: {
    size: "Taglia",
    add: "Aggiungi al carrello",
    sold: "Esaurita.",
    sizeOut: "Esaurita",
    stockLeft: (n: number) => (n === 1 ? "1 pezzo" : `${n} pezzi`),
    preorder: "Pre-order. Spedizione quando la stampa è pronta.",
    reprint: "Richiedi ristampa",
    printOne: "Serigrafia, un colore",
    vatIncluded: "Prezzo IVA inclusa",
    galleryPrev: "Foto precedente",
    galleryNext: "Foto successiva",
    shipLine: (itPrice: number, euPrice: number) =>
      `Spedizione Italia ${itPrice} €, Europa ${euPrice} €`,
    /** Alt descrittiva: mezzo + opera + artista + studio. */
    imageAlt: (kind: "shirt" | "print" | "edition", title: string, artist: string) => {
      const withArtist = artist && artist !== title;
      if (kind === "print") {
        return withArtist
          ? `Stampa «${title}» di ${artist}, serigrafia Corpoceleste`
          : `Stampa «${title}», serigrafia Corpoceleste`;
      }
      if (kind === "edition") {
        return withArtist
          ? `«${title}» di ${artist}, edizione serigrafica Corpoceleste`
          : `«${title}», edizione serigrafica Corpoceleste`;
      }
      return withArtist
        ? `Maglia «${title}» di ${artist}, serigrafia Corpoceleste`
        : `Maglia «${title}», serigrafia Corpoceleste`;
    },
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
    vatIncluded: "Prezzi in euro, IVA inclusa. La spedizione è quella scelta qui sopra.",
    payObligation: "Premendo il pulsante concludi un ordine con obbligo di pagamento.",
    readPrivacy: (privacy: string) => `Ho letto l’${privacy}.`,
    privacyLink: "informativa privacy",
    shipTo: "Spedizione",
    italy: (n: number) => `Italia — ${n} €`,
    europe: (n: number) => `Europa — ${n} €`,
    paypal: "Paga con PayPal",
    paypalBack: "Torna a Corpoceleste",
    payTitle: "Scegli il pagamento",
    methodPaypal: "PayPal o carta",
    paypalSoon: "Attivo appena collego l’account PayPal. Per ora usa il bonifico.",
    bank: "Bonifico",
    bankNote:
      "Invia il modulo: ricevi l’IBAN via email. L’ordine è confermato quando arriva il pagamento; poi spedisco.",
    name: "Nome e cognome",
    email: "Email",
    phone: "Telefono",
    address: "Indirizzo",
    city: "CAP e città",
    notes: "Note",
    sendOrder: "Ordine con obbligo di pagamento",
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
    paintings: "Quadri.",
  },
  workshops: {
    title: "Corsi",
    waitlist: "Lista d’attesa",
    waitlistBody: "Quando si raggiunge un minimo di iscritti, fisso la data.",
    onSite: "Workshop presso di voi",
    onSiteBody: "Corso nella vostra sede.",
    spaceName: "Nome e spazio",
    city: "Città / sede",
    archive: "Archivio",
    since: "Dal 2014.",
    studioAlt: "Studio di serigrafia Corpoceleste, Bergamo",
  },
  consulting: {
    title: "Consulenza",
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
  },
  artists: {
    title: "Artisti",
  },
  thanks: {
    received: "Ricevuto",
    order: "Ordine ricevuto",
    contact: "Ti rispondo per email.",
    newsletter: "Quando c’è una maglia nuova, scrivo.",
    reprint: "Se ristampo, ti avviso.",
    waitlist: "Quando il gruppo c’è, fisso la data.",
    bank: "Ti scrivo per il bonifico. L’ordine vale quando arriva il pagamento.",
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
    lede:
      "Informativa sul trattamento dei dati e sull’uso di cookie e storage, art. 13 GDPR.",
    updated: "Ultimo aggiornamento: 1 ottobre 2026.",
    controller: "Titolare",
    controllerBody: (name: string, sede: string) =>
      `${name}, in qualità di titolare del trattamento per il sito Corpoceleste. Sede: ${sede}.`,
    vat: (id: string) => `P. IVA ${id}.`,
    contact: "Contatto:",
    cookies: "Cookie e storage",
    cookiesP1:
      "Questo sito non usa cookie di profilazione, analytics o pubblicità. Non c’è un banner di consenso perché, secondo le Linee guida del Garante (cookie e altri identificatori, 10 giugno 2021, ancora il riferimento in Italia nel 2026), il consenso serve solo per strumenti non tecnici.",
    cookiesP2: "Strumenti di prima parte, tutti tecnici:",
    cartStorage:
      "contenuto del carrello, sul tuo browser. Serve a comprare. Resta finché lo svuoti o pulisci i dati del sito.",
    orderStorage:
      "riepilogo dell’ultimo ordine, solo per mostrarlo dopo il checkout. Fine sessione.",
    cookiesP3:
      "Nessun dato del carrello va su un server nostro: il sito è statico (GitHub Pages). Chiudi il browser o cancella i dati del sito per toglierli.",
    cookiesPaypal:
      "Se paghi con PayPal, lasci questo sito e valgono i cookie e l’informativa di PayPal",
    cookiesMore: "Dettaglio nella",
    cookiesMoreLink: "cookie policy",
    data: "Quali dati, perché",
    dataIntro:
      "Trattiamo solo ciò che ci scrivi tu, per queste finalità e basi giuridiche (art. 6 GDPR):",
    dataOrder:
      "nome, email, telefono, indirizzo, contenuto dell’ordine. Base: contratto, art. 6.1.b. Conservazione: il tempo dell’ordine, della spedizione e degli obblighi contabili/fiscali.",
    dataPaypal:
      "l’importo e l’indirizzo li gestisce PayPal. Base: contratto, art. 6.1.b.",
    dataForms:
      "nome, email, messaggio. Base: misure precontrattuali o legittimo interesse a rispondere, art. 6.1.b o 6.1.f. Conservazione: finché serve a gestire la richiesta, poi cancellazione.",
    dataNewsletter: (email: string) =>
      `solo l’email, e solo se spunti la casella. Base: consenso, art. 6.1.a. Puoi revocare in qualsiasi momento scrivendo a ${email}. Conservazione: fino alla revoca.`,
    noProfiling: "Non facciamo profilazione, né decisioni automatizzate.",
    recipients: "Chi riceve i dati",
    formsubmit:
      "i moduli del sito gli arrivano e ci inoltra la mail. Opera anche fuori UE; il trasferimento avviene perché hai inviato il form (art. 49.1.b GDPR). Informativa:",
    paypalRecv: "se scegli PayPal.",
    github:
      "hosting delle pagine pubbliche, non dei moduli. Informativa GitHub sul sito github.com.",
    vercel:
      "Vercel Inc. — funzione tecnica che, dopo un pagamento PayPal confermato, aggiorna il magazzino e inoltra il riepilogo dell’ordine. Tratta i dati dell’ordine, non i dati di pagamento.",
    couriers: "Corrieri, solo per spedire un ordine.",
    noSell: "I dati non si vendono e non si cedono per marketing di terzi.",
    rights: "Diritti",
    rightsBody:
      "Puoi chiedere accesso, rettifica, cancellazione, limitazione, opposizione e, dove applicabile, portabilità, scrivendo a",
    rightsTail:
      "Puoi revocare il consenso alla newsletter senza pregiudicare quanto fatto prima. Reclamo: Garante per la protezione dei dati personali,",
    orderBank: "Ordine (bonifico)",
    payPaypal: "Pagamento PayPal",
    formsLabel: "Contatti, corsi, consulenza, richiesta ristampa",
    newsletter: "Newsletter",
  },
  cookiePolicy: {
    title: "Cookie policy",
    lede:
      "Come usiamo cookie e storage sul sito Corpoceleste. Complemento dell’informativa privacy.",
    updated: "Ultimo aggiornamento: 28 settembre 2026.",
    what: "Cosa sono",
    whatBody:
      "I cookie sono piccoli file che un sito può salvare sul tuo dispositivo. Qui usiamo soprattutto storage del browser (localStorage / sessionStorage), non cookie HTTP di terze parti.",
    noBanner: "Perché non c’è un banner",
    noBannerBody:
      "Non installiamo cookie di profilazione, analytics o pubblicità. Secondo le Linee guida del Garante (cookie e altri identificatori, 10 giugno 2021), il consenso preventivo serve solo per strumenti non strettamente necessari. Quelli elencati sotto sono tecnici: servono al carrello e al riepilogo ordine.",
    table: "Strumenti sul sito",
    name: "Nome",
    type: "Tipo",
    purpose: "Scopo",
    duration: "Durata",
    cartName: "corpoceleste-cart",
    cartType: "localStorage (prima parte)",
    cartPurpose: "Memorizzare maglie e quantità nel carrello.",
    cartDuration: "Fino a svuotamento carrello o cancellazione dati del sito.",
    orderName: "cc-last-order",
    orderType: "sessionStorage (prima parte)",
    orderPurpose: "Mostrare il riepilogo dopo il checkout.",
    orderDuration: "Fine sessione del browser.",
    third: "Terze parti",
    thirdBody:
      "Il sito pubblico non carica script di analytics o pubblicità. Se paghi con PayPal, esci da questo dominio: valgono cookie e informativa di PayPal.",
    manage: "Come gestirli",
    manageBody:
      "Puoi cancellare i dati del sito dalle impostazioni del browser (cronologia / dati dei siti). Svuotando il carrello da Corpoceleste rimuovi il contenuto di corpoceleste-cart.",
    privacyLink: "Informativa privacy completa",
    contact: "Contatto titolare:",
  },
  terms: {
    title: "Condizioni di vendita",
    lede: "Chi vende, cosa compri, come si paga, come si recede. Vendita a distanza a consumatori ai sensi del Codice del consumo (d.lgs. 206/2005).",
    updated: "Ultimo aggiornamento: 1 ottobre 2026.",
    seller: "Venditore",
    vatLabel: "Partita IVA:",
    reaLabel: "REA:",
    vatMissing: "Partita IVA: in corso di attribuzione. Contattami per i dati fiscali completi.",
    contactLabel: "Contatto:",
    scope: "Cosa regolano",
    scopeBody:
      "Queste condizioni valgono per gli acquisti fatti su questo sito. Sono scritte per chi compra come consumatore, cioè fuori da attività d’impresa o professione. Comprando accetti queste condizioni nella versione pubblicata al momento dell’ordine.",
    products: "Cosa vendo",
    productsBody:
      "Serigrafie stampate a mano, una per volta, in tiratura limitata: maglie, stampe su carta, pezzi numerati. Essendo stampa manuale, piccole differenze di registro, inchiostro e posizione fanno parte del pezzo e non sono difetti. Le foto sono indicative: colore e resa possono variare leggermente da schermo a schermo.",
    prices: "Prezzi",
    pricesBody: (italy: number, europe: number) =>
      `I prezzi sono in euro e IVA inclusa, salvo diversa indicazione. La spedizione è a parte e viene mostrata prima del pagamento: ${italy} € in Italia, ${europe} € in Europa. Il totale da pagare, spedizione compresa, è quello che vedi in checkout.`,
    order: "Come si conclude l’ordine",
    orderBody:
      "Le pagine prodotto sono un invito all’acquisto, non un’offerta vincolante. Il contratto si conclude quando premi il pulsante di pagamento in checkout, che riporta «ordine con obbligo di pagamento», e ricevi la conferma d’ordine via email. Se un pezzo non fosse più disponibile dopo il pagamento, ti avviso e ti rimborso per intero.",
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
      "Dopo la comunicazione hai 14 giorni per rispedire il pezzo. Rimborso tutto quello che hai pagato, spedizione standard di andata compresa, entro 14 giorni dal momento in cui ricevo il reso o la prova della spedizione, con lo stesso mezzo di pagamento che hai usato. Il costo della restituzione è a tuo carico. Rispondi della diminuzione di valore se hai usato il pezzo oltre quanto serve a verificarne natura e caratteristiche: provalo come faresti in negozio.",
    withdrawalExceptions:
      "Il recesso non si applica ai pezzi realizzati su tua misura o chiaramente personalizzati su tua richiesta (art. 59 Codice del consumo). Su ogni pezzo personalizzato lo segnalo prima dell’acquisto.",
    warranty: "Garanzia legale di conformità",
    warrantyBody:
      "Su tutto quello che vendo vale la garanzia legale di 2 anni dalla consegna (artt. 128 e seguenti Codice del consumo). Se il pezzo è difettoso o diverso da quanto descritto, hai diritto a riparazione o sostituzione senza spese e, se non sono possibili o non risolvono, a riduzione del prezzo o risoluzione del contratto con rimborso. Scrivimi con foto e numero d’ordine: le spese di reso per difetto di conformità sono a mio carico. La garanzia legale è distinta dal recesso e vale anche dopo i 14 giorni.",
    complaints: "Reclami e controversie",
    complaintsBody:
      "Per qualsiasi problema scrivimi prima a me: rispondo entro pochi giorni e nella pratica si risolve così. Se non troviamo un accordo, puoi rivolgerti a un organismo ADR iscritto all’elenco del Ministero delle imprese e del made in Italy per la risoluzione alternativa delle controversie di consumo. La piattaforma europea ODR è stata dismessa nel luglio 2025 e non è più utilizzabile.",
    law: "Legge applicabile",
    lawBody:
      "Al contratto si applica la legge italiana. Restano ferme le tutele più favorevoli previste dalla legge del paese dell’Unione europea in cui risiedi come consumatore. Per le controversie è competente il foro del tuo luogo di residenza o domicilio.",
    disclaimer:
      "Testo informativo, non consulenza legale. Se hai dubbi sui tuoi diritti, scrivimi o rivolgiti a un’associazione di consumatori.",
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
    orderRef: "Ordine da cui receda",
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
    title: "Artist screen printing",
    lede: "Editions hand-printed in the Bergamo studio. One colour, not print-on-demand — shirts, prints, numbered pieces.",
  },
  nav: {
    main: "Main",
    shop: "Shop",
    artists: "Artists",
    news: "News",
    workshops: "Workshops",
    consulting: "Consulting",
    contact: "Contact",
    cart: "Cart",
    menu: "Menu",
    language: "Language",
  },
  footer: {
    studio: "Studio",
    subscribe: "Subscribe",
    made: "Made in Bergamo.",
    social: "Social",
  },
  shop: {
    soldOut: "Sold out",
    soldBadge: "Sold out",
    preorderBadge: "Pre-order",
  },
  product: {
    size: "Size",
    add: "Add to cart",
    sold: "Sold out.",
    sizeOut: "Sold out",
    stockLeft: (n: number) => (n === 1 ? "1 left" : `${n} left`),
    preorder: "Pre-order. Ships when the print is ready.",
    reprint: "Request a reprint",
    printOne: "Screen print, one colour",
    vatIncluded: "Price includes VAT",
    galleryPrev: "Previous photo",
    galleryNext: "Next photo",
    shipLine: (itPrice: number, euPrice: number) =>
      `Shipping Italy ${itPrice} €, Europe ${euPrice} €`,
    imageAlt: (kind: "shirt" | "print" | "edition", title: string, artist: string) => {
      const withArtist = artist && artist !== title;
      if (kind === "print") {
        return withArtist
          ? `Screen print “${title}” by ${artist}, Corpoceleste`
          : `Screen print “${title}”, Corpoceleste`;
      }
      if (kind === "edition") {
        return withArtist
          ? `“${title}” by ${artist}, Corpoceleste serigraph edition`
          : `“${title}”, Corpoceleste serigraph edition`;
      }
      return withArtist
        ? `“${title}” shirt by ${artist}, Corpoceleste screen print`
        : `“${title}” shirt, Corpoceleste screen print`;
    },
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
    vatIncluded: "Prices in euro, VAT included. Shipping is the option selected above.",
    payObligation: "Pressing the button places an order with an obligation to pay.",
    readPrivacy: (privacy: string) => `I have read the ${privacy}.`,
    privacyLink: "privacy notice",
    shipTo: "Shipping",
    italy: (n: number) => `Italy — ${n} €`,
    europe: (n: number) => `Europe — ${n} €`,
    paypal: "Pay with PayPal",
    paypalBack: "Back to Corpoceleste",
    payTitle: "Choose how to pay",
    methodPaypal: "PayPal or card",
    paypalSoon: "Active as soon as the PayPal account is connected. For now use the bank transfer.",
    bank: "Bank transfer",
    bankNote:
      "Send the form: you’ll get the IBAN by email. The order is confirmed when payment arrives; then I ship.",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    city: "Postcode and city",
    notes: "Notes",
    sendOrder: "Order with obligation to pay",
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
    paintings: "Paintings.",
  },
  workshops: {
    title: "Workshops",
    waitlist: "Waiting list",
    waitlistBody: "When enough people have signed up, I set the date.",
    onSite: "Workshop at your space",
    onSiteBody: "A course at your studio or venue.",
    spaceName: "Name and space",
    city: "City / venue",
    archive: "Archive",
    since: "Since 2014.",
    studioAlt: "Corpoceleste screen-printing studio, Bergamo",
  },
  consulting: {
    title: "Consulting",
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
  },
  artists: {
    title: "Artists",
  },
  thanks: {
    received: "Received",
    order: "Order received",
    contact: "I’ll write back by email.",
    newsletter: "When a new shirt is ready, I’ll write.",
    reprint: "If I reprint, I’ll let you know.",
    waitlist: "When the group is together, I’ll set the date.",
    bank: "I’ll write with the transfer details. The order stands when payment arrives.",
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
    lede:
      "Information on the processing of personal data and on cookies and storage, Art. 13 GDPR.",
    updated: "Last updated: 1 October 2026.",
    controller: "Controller",
    controllerBody: (name: string, sede: string) =>
      `${name}, controller of personal data for the Corpoceleste website. Address: ${sede}.`,
    vat: (id: string) => `VAT ${id}.`,
    contact: "Contact:",
    cookies: "Cookies and storage",
    cookiesP1:
      "This site does not use profiling, analytics or advertising cookies. There is no consent banner because, under the Italian DPA guidelines (cookies and other identifiers, 10 June 2021, still the reference in Italy in 2026), consent is required only for non-essential tools.",
    cookiesP2: "First-party tools, all strictly necessary:",
    cartStorage:
      "cart contents, in your browser. Needed to buy. It stays until you empty the cart or clear this site’s data.",
    orderStorage:
      "summary of the last order, only to show it after checkout. Ends with the session.",
    cookiesP3:
      "No cart data is sent to a server of ours: the site is static (GitHub Pages). Close the browser or clear this site’s data to remove it.",
    cookiesPaypal:
      "If you pay with PayPal, you leave this site; PayPal’s cookies and privacy notice then apply",
    cookiesMore: "Full detail in the",
    cookiesMoreLink: "cookie policy",
    data: "What data, and why",
    dataIntro:
      "We only process what you send us, for these purposes and legal bases (Art. 6 GDPR):",
    dataOrder:
      "name, email, phone, address, order contents. Basis: contract, Art. 6(1)(b). Kept for the order, the shipment, and accounting/tax duties.",
    dataPaypal:
      "the amount and the address are handled by PayPal. Basis: contract, Art. 6(1)(b).",
    dataForms:
      "name, email, message. Basis: steps prior to a contract, or legitimate interest in answering, Art. 6(1)(b) or 6(1)(f). Kept for as long as needed to handle the request, then deleted.",
    dataNewsletter: (email: string) =>
      `email only, and only if you tick the box. Basis: consent, Art. 6(1)(a). You can withdraw at any time by writing to ${email}. Kept until withdrawal.`,
    noProfiling: "No profiling, no automated decisions.",
    recipients: "Who receives the data",
    formsubmit:
      "site forms are sent there, and it forwards the email to us. It also operates outside the EU; the transfer takes place because you submitted the form (Art. 49(1)(b) GDPR). Notice:",
    paypalRecv: "if you choose PayPal.",
    github:
      "hosts the public pages, not the forms. GitHub’s notice is on github.com.",
    vercel:
      "Vercel Inc. — technical function that updates stock and forwards the order summary after a confirmed PayPal payment. It handles order data, not payment data.",
    couriers: "Couriers, only to ship an order.",
    noSell: "Data is not sold or passed on for third-party marketing.",
    rights: "Rights",
    rightsBody:
      "You can ask for access, rectification, erasure, restriction, objection and, where it applies, portability, by writing to",
    rightsTail:
      "You can withdraw newsletter consent without affecting anything done before. Complaint: Garante per la protezione dei dati personali,",
    orderBank: "Order (bank transfer)",
    payPaypal: "PayPal payment",
    formsLabel: "Contact, workshops, consulting, reprint request",
    newsletter: "Newsletter",
  },
  cookiePolicy: {
    title: "Cookie policy",
    lede:
      "How we use cookies and storage on Corpoceleste. Complements the privacy notice.",
    updated: "Last updated: 28 September 2026.",
    what: "What they are",
    whatBody:
      "Cookies are small files a site may store on your device. Here we mainly use browser storage (localStorage / sessionStorage), not third-party HTTP cookies.",
    noBanner: "Why there is no banner",
    noBannerBody:
      "We do not install profiling, analytics or advertising cookies. Under the Italian DPA guidelines (cookies and other identifiers, 10 June 2021), prior consent is required only for non-essential tools. Those listed below are strictly necessary: cart and order summary.",
    table: "Tools on this site",
    name: "Name",
    type: "Type",
    purpose: "Purpose",
    duration: "Duration",
    cartName: "corpoceleste-cart",
    cartType: "localStorage (first-party)",
    cartPurpose: "Store shirts and quantities in the cart.",
    cartDuration: "Until you empty the cart or clear this site’s data.",
    orderName: "cc-last-order",
    orderType: "sessionStorage (first-party)",
    orderPurpose: "Show the summary after checkout.",
    orderDuration: "End of the browser session.",
    third: "Third parties",
    thirdBody:
      "The public site does not load analytics or advertising scripts. If you pay with PayPal, you leave this domain; PayPal’s cookies and notice then apply.",
    manage: "How to manage them",
    manageBody:
      "You can clear this site’s data in the browser settings (history / site data). Emptying the Corpoceleste cart removes corpoceleste-cart.",
    privacyLink: "Full privacy notice",
    contact: "Controller contact:",
  },
  terms: {
    title: "Terms of sale",
    lede: "Who sells, what you buy, how you pay, how you withdraw. Distance selling to consumers under the Italian Consumer Code (d.lgs. 206/2005), which implements EU consumer law.",
    updated: "Last updated: 1 October 2026.",
    seller: "Seller",
    vatLabel: "VAT number:",
    reaLabel: "Business register:",
    vatMissing: "VAT number: being assigned. Write to me for full tax details.",
    contactLabel: "Contact:",
    scope: "What these terms cover",
    scopeBody:
      "These terms apply to purchases made on this site. They are written for people buying as consumers, that is outside a business or profession. By ordering you accept the version published at the time of your order.",
    products: "What I sell",
    productsBody:
      "Hand-pulled screen prints in limited runs: shirts, prints on paper, numbered pieces. Because printing is manual, small differences in registration, ink and placement are part of the piece and are not defects. Photos are indicative: colour can vary slightly from screen to screen.",
    prices: "Prices",
    pricesBody: (italy: number, europe: number) =>
      `Prices are in euro and include VAT unless stated otherwise. Shipping is charged separately and shown before payment: €${italy} to Italy, €${europe} within Europe. The total you see at checkout, shipping included, is what you pay.`,
    order: "How the order is concluded",
    orderBody:
      "Product pages are an invitation to buy, not a binding offer. The contract is concluded when you press the payment button at checkout, labelled “order with obligation to pay”, and receive the order confirmation by email. If a piece is no longer available after payment, I tell you and refund you in full.",
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
      "After notifying me you have 14 days to send the piece back. I refund everything you paid, including standard outbound shipping, within 14 days of receiving the return or proof that you sent it, using the same payment method you used. Return shipping is at your cost. You are liable for any diminished value if you handled the piece beyond what is needed to establish its nature and characteristics: try it as you would in a shop.",
    withdrawalExceptions:
      "Withdrawal does not apply to pieces made to your measurements or clearly personalised at your request (art. 59 Consumer Code). I flag any personalised piece before purchase.",
    warranty: "Legal guarantee of conformity",
    warrantyBody:
      "Everything I sell carries the 2-year legal guarantee from delivery (arts. 128 ff. Consumer Code). If a piece is faulty or not as described, you are entitled to free repair or replacement and, if those are impossible or fail, to a price reduction or to cancel the contract with a refund. Write to me with photos and your order number: return costs for a conformity defect are on me. The legal guarantee is separate from withdrawal and applies well beyond the 14 days.",
    complaints: "Complaints and disputes",
    complaintsBody:
      "For any problem write to me first: I answer within a few days and in practice that settles it. If we cannot agree, you can turn to an ADR body listed by the Italian Ministry of Enterprise for alternative dispute resolution in consumer matters. The European ODR platform was shut down in July 2025 and is no longer available.",
    law: "Applicable law",
    lawBody:
      "Italian law applies to the contract. More favourable protections under the law of the EU country where you live as a consumer still apply. For disputes, the court of your place of residence or domicile has jurisdiction.",
    disclaimer:
      "Informative text, not legal advice. If you are unsure about your rights, write to me or contact a consumer association.",
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
    title: "Künstlersiebdruck",
    lede: "Editionen, handgedruckt im Atelier in Bergamo. Eine Farbe, kein Print-on-Demand — Shirts, Drucke, nummerierte Stücke.",
  },
  nav: {
    main: "Hauptnavigation",
    shop: "Shop",
    artists: "Künstler",
    news: "News",
    workshops: "Kurse",
    consulting: "Beratung",
    contact: "Kontakt",
    cart: "Warenkorb",
    menu: "Menü",
    language: "Sprache",
  },
  footer: {
    studio: "Atelier",
    subscribe: "Anmelden",
    made: "Made in Bergamo.",
    social: "Social",
  },
  shop: {
    soldOut: "Ausverkauft",
    soldBadge: "Ausverkauft",
    preorderBadge: "Pre-order",
  },
  product: {
    size: "Größe",
    add: "In den Warenkorb",
    sold: "Ausverkauft.",
    sizeOut: "Ausverkauft",
    stockLeft: (n: number) => (n === 1 ? "1 Stück" : `${n} Stück`),
    preorder: "Pre-order. Versand, sobald der Druck fertig ist.",
    reprint: "Nachdruck anfragen",
    printOne: "Siebdruck, eine Farbe",
    vatIncluded: "Preis inkl. MwSt.",
    galleryPrev: "Vorheriges Foto",
    galleryNext: "Nächstes Foto",
    shipLine: (itPrice: number, euPrice: number) =>
      `Versand Italien ${itPrice} €, Europa ${euPrice} €`,
    imageAlt: (kind: "shirt" | "print" | "edition", title: string, artist: string) => {
      const withArtist = artist && artist !== title;
      if (kind === "print") {
        return withArtist
          ? `Siebdruck „${title}“ von ${artist}, Corpoceleste`
          : `Siebdruck „${title}“, Corpoceleste`;
      }
      if (kind === "edition") {
        return withArtist
          ? `„${title}“ von ${artist}, Corpoceleste-Siebdruckedition`
          : `„${title}“, Corpoceleste-Siebdruckedition`;
      }
      return withArtist
        ? `Shirt „${title}“ von ${artist}, Corpoceleste-Siebdruck`
        : `Shirt „${title}“, Corpoceleste-Siebdruck`;
    },
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
    vatIncluded: "Preise in Euro, inklusive MwSt. Versand wie oben gewählt.",
    payObligation: "Mit dem Button gibst du eine zahlungspflichtige Bestellung ab.",
    readPrivacy: (privacy: string) => `Ich habe die ${privacy} gelesen.`,
    privacyLink: "Datenschutzhinweise",
    shipTo: "Versand",
    italy: (n: number) => `Italien — ${n} €`,
    europe: (n: number) => `Europa — ${n} €`,
    paypal: "Mit PayPal bezahlen",
    paypalBack: "Zurück zu Corpoceleste",
    payTitle: "Zahlung wählen",
    methodPaypal: "PayPal oder Karte",
    paypalSoon: "Aktiv, sobald das PayPal-Konto verbunden ist. Zahle bis dahin per Überweisung.",
    bank: "Überweisung",
    bankNote:
      "Schick das Formular: du bekommst die IBAN per E-Mail. Die Bestellung gilt, wenn die Zahlung da ist; danach verschicke ich.",
    name: "Vor- und Nachname",
    email: "E-Mail",
    phone: "Telefon",
    address: "Adresse",
    city: "PLZ und Ort",
    notes: "Anmerkungen",
    sendOrder: "Zahlungspflichtig bestellen",
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
    paintings: "Bilder.",
  },
  workshops: {
    title: "Kurse",
    waitlist: "Warteliste",
    waitlistBody: "Wenn genug Anmeldungen da sind, lege ich den Termin fest.",
    onSite: "Workshop bei euch",
    onSiteBody: "Ein Kurs in eurem Atelier oder Raum.",
    spaceName: "Name und Ort",
    city: "Stadt / Ort",
    archive: "Archiv",
    since: "Seit 2014.",
    studioAlt: "Corpoceleste-Siebdruckatelier, Bergamo",
  },
  consulting: {
    title: "Beratung",
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
  },
  artists: {
    title: "Künstler",
  },
  thanks: {
    received: "Angekommen",
    order: "Bestellung angekommen",
    contact: "Ich antworte per E-Mail.",
    newsletter: "Wenn ein neues Shirt da ist, schreibe ich.",
    reprint: "Wenn ich nachdrucke, gebe ich Bescheid.",
    waitlist: "Wenn die Gruppe steht, lege ich den Termin fest.",
    bank: "Ich schreibe wegen der Überweisung. Die Bestellung gilt, wenn die Zahlung da ist.",
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
    lede:
      "Informationen zur Verarbeitung personenbezogener Daten und zu Cookies und Speicher, Art. 13 DSGVO.",
    updated: "Stand: 1. Oktober 2026.",
    controller: "Verantwortlicher",
    controllerBody: (name: string, sede: string) =>
      `${name}, Verantwortlicher für die Verarbeitung auf der Website Corpoceleste. Sitz: ${sede}.`,
    vat: (id: string) => `USt-IdNr. ${id}.`,
    contact: "Kontakt:",
    cookies: "Cookies und Speicher",
    cookiesP1:
      "Diese Website verwendet keine Profiling-, Analyse- oder Werbe-Cookies. Es gibt kein Einwilligungsbanner, weil nach den Leitlinien der italienischen Datenschutzbehörde (Cookies und andere Kennungen, 10. Juni 2021, in Italien 2026 weiterhin maßgeblich) eine Einwilligung nur für nicht notwendige Werkzeuge nötig ist.",
    cookiesP2: "First-Party-Werkzeuge, alle technisch erforderlich:",
    cartStorage:
      "Inhalt des Warenkorbs, in deinem Browser. Nötig zum Kaufen. Bleibt, bis du den Warenkorb leerst oder die Daten dieser Website löschst.",
    orderStorage:
      "Zusammenfassung der letzten Bestellung, nur zur Anzeige nach dem Checkout. Endet mit der Sitzung.",
    cookiesP3:
      "Keine Warenkorbdaten gehen auf einen Server von uns: die Website ist statisch (GitHub Pages). Browser schließen oder die Daten dieser Website löschen, um sie zu entfernen.",
    cookiesPaypal:
      "Wenn du mit PayPal zahlst, verlässt du diese Website; es gelten dann Cookies und Hinweise von PayPal",
    cookiesMore: "Details in der",
    cookiesMoreLink: "Cookie-Richtlinie",
    data: "Welche Daten, wozu",
    dataIntro:
      "Wir verarbeiten nur, was du uns schreibst, zu diesen Zwecken und Rechtsgrundlagen (Art. 6 DSGVO):",
    dataOrder:
      "Name, E-Mail, Telefon, Adresse, Bestellinhalt. Grundlage: Vertrag, Art. 6 Abs. 1 lit. b. Speicherung: für Bestellung, Versand und buchhalterische/steuerliche Pflichten.",
    dataPaypal:
      "Betrag und Adresse verarbeitet PayPal. Grundlage: Vertrag, Art. 6 Abs. 1 lit. b.",
    dataForms:
      "Name, E-Mail, Nachricht. Grundlage: vorvertragliche Schritte oder berechtigtes Interesse an einer Antwort, Art. 6 Abs. 1 lit. b oder f. Speicherung: solange die Anfrage es braucht, dann Löschung.",
    dataNewsletter: (email: string) =>
      `nur die E-Mail, und nur wenn du das Kästchen ankreuzt. Grundlage: Einwilligung, Art. 6 Abs. 1 lit. a. Widerruf jederzeit an ${email}. Speicherung: bis zum Widerruf.`,
    noProfiling: "Kein Profiling, keine automatisierten Entscheidungen.",
    recipients: "Wer die Daten erhält",
    formsubmit:
      "die Formulare der Website kommen dort an und werden per Mail an uns weitergeleitet. Der Dienst arbeitet auch außerhalb der EU; die Übermittlung erfolgt, weil du das Formular abgeschickt hast (Art. 49 Abs. 1 lit. b DSGVO). Hinweise:",
    paypalRecv: "wenn du PayPal wählst.",
    github:
      "hostet die öffentlichen Seiten, nicht die Formulare. Hinweise von GitHub auf github.com.",
    vercel:
      "Vercel Inc. — technische Funktion, die nach bestätigter PayPal-Zahlung den Bestand aktualisiert und die Bestellübersicht weiterleitet. Verarbeitet Bestelldaten, keine Zahlungsdaten.",
    couriers: "Paketdienste, nur zum Versand einer Bestellung.",
    noSell: "Daten werden nicht verkauft und nicht für Werbung Dritter weitergegeben.",
    rights: "Rechte",
    rightsBody:
      "Du kannst Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und, soweit es gilt, Datenübertragbarkeit verlangen, per Mail an",
    rightsTail:
      "Die Einwilligung zum Newsletter kannst du widerrufen, ohne dass Früheres unwirksam wird. Beschwerde: Garante per la protezione dei dati personali,",
    orderBank: "Bestellung (Überweisung)",
    payPaypal: "PayPal-Zahlung",
    formsLabel: "Kontakt, Kurse, Beratung, Nachdruck",
    newsletter: "Newsletter",
  },
  cookiePolicy: {
    title: "Cookie-Richtlinie",
    lede:
      "Wie wir Cookies und Speicher auf Corpoceleste nutzen. Ergänzung zum Datenschutzhinweis.",
    updated: "Stand: 28. September 2026.",
    what: "Was sie sind",
    whatBody:
      "Cookies sind kleine Dateien, die eine Website auf deinem Gerät speichern kann. Hier nutzen wir vor allem Browser-Speicher (localStorage / sessionStorage), keine HTTP-Cookies Dritter.",
    noBanner: "Warum kein Banner",
    noBannerBody:
      "Wir installieren keine Profiling-, Analyse- oder Werbe-Cookies. Nach den Leitlinien der italienischen Datenschutzbehörde (Cookies und andere Kennungen, 10. Juni 2021) ist eine vorherige Einwilligung nur für nicht notwendige Werkzeuge nötig. Die unten genannten sind technisch erforderlich: Warenkorb und Bestellübersicht.",
    table: "Werkzeuge auf dieser Website",
    name: "Name",
    type: "Typ",
    purpose: "Zweck",
    duration: "Dauer",
    cartName: "corpoceleste-cart",
    cartType: "localStorage (First-Party)",
    cartPurpose: "Shirts und Mengen im Warenkorb speichern.",
    cartDuration: "Bis du den Warenkorb leerst oder die Daten dieser Website löschst.",
    orderName: "cc-last-order",
    orderType: "sessionStorage (First-Party)",
    orderPurpose: "Zusammenfassung nach dem Checkout anzeigen.",
    orderDuration: "Ende der Browser-Sitzung.",
    third: "Dritte",
    thirdBody:
      "Die öffentliche Website lädt keine Analyse- oder Werbeskripte. Wenn du mit PayPal zahlst, verlässt du diese Domain; es gelten dann Cookies und Hinweise von PayPal.",
    manage: "Verwaltung",
    manageBody:
      "Du kannst die Daten dieser Website in den Browser-Einstellungen löschen (Verlauf / Website-Daten). Wenn du den Corpoceleste-Warenkorb leerst, wird corpoceleste-cart entfernt.",
    privacyLink: "Vollständiger Datenschutzhinweis",
    contact: "Kontakt Verantwortlicher:",
  },
  terms: {
    title: "Verkaufsbedingungen",
    lede: "Wer verkauft, was du kaufst, wie bezahlt wird, wie du widerrufst. Fernabsatz an Verbraucher nach italienischem Verbrauchergesetzbuch (d.lgs. 206/2005), das EU-Verbraucherrecht umsetzt.",
    updated: "Stand: 1. Oktober 2026.",
    seller: "Verkäufer",
    vatLabel: "USt-IdNr.:",
    reaLabel: "Handelsregister:",
    vatMissing: "USt-IdNr.: wird zugeteilt. Schreib mir für die vollständigen Steuerdaten.",
    contactLabel: "Kontakt:",
    scope: "Geltungsbereich",
    scopeBody:
      "Diese Bedingungen gelten für Käufe auf dieser Website. Sie sind für Verbraucher geschrieben, also für Käufe außerhalb einer gewerblichen oder beruflichen Tätigkeit. Mit der Bestellung akzeptierst du die zum Zeitpunkt der Bestellung veröffentlichte Fassung.",
    products: "Was ich verkaufe",
    productsBody:
      "Von Hand gedruckte Siebdrucke in limitierter Auflage: Shirts, Papierdrucke, nummerierte Stücke. Weil von Hand gedruckt wird, gehören kleine Abweichungen bei Register, Farbe und Position zum Stück und sind keine Mängel. Fotos sind Anhaltspunkte: Farben können je nach Bildschirm leicht abweichen.",
    prices: "Preise",
    pricesBody: (italy: number, europe: number) =>
      `Preise verstehen sich in Euro und inklusive MwSt., sofern nicht anders angegeben. Der Versand wird getrennt berechnet und vor der Zahlung angezeigt: ${italy} € nach Italien, ${europe} € innerhalb Europas. Der Gesamtbetrag an der Kasse, Versand inbegriffen, ist der Betrag, den du zahlst.`,
    order: "Zustandekommen der Bestellung",
    orderBody:
      "Produktseiten sind eine Aufforderung zur Bestellung, kein bindendes Angebot. Der Vertrag kommt zustande, wenn du an der Kasse den Zahlungsbutton mit der Aufschrift «zahlungspflichtig bestellen» drückst und die Bestellbestätigung per E-Mail erhältst. Ist ein Stück nach der Zahlung nicht mehr verfügbar, melde ich mich und erstatte den vollen Betrag.",
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
      "Nach der Mitteilung hast du 14 Tage, um das Stück zurückzuschicken. Ich erstatte alles, was du gezahlt hast, inklusive Standardversand hin, innerhalb von 14 Tagen nach Erhalt der Rücksendung oder des Sendungsnachweises, über dasselbe Zahlungsmittel. Die Rücksendekosten trägst du. Für einen Wertverlust haftest du, wenn du das Stück über das hinaus benutzt hast, was zur Prüfung von Beschaffenheit und Eigenschaften nötig ist: probier es wie im Laden.",
    withdrawalExceptions:
      "Kein Widerrufsrecht besteht bei Stücken, die nach deinen Maßen gefertigt oder eindeutig auf deine Wünsche zugeschnitten sind (Art. 59 Verbrauchergesetzbuch). Personalisierte Stücke kennzeichne ich vor dem Kauf.",
    warranty: "Gesetzliche Gewährleistung",
    warrantyBody:
      "Für alles, was ich verkaufe, gilt die gesetzliche Gewährleistung von 2 Jahren ab Lieferung (Art. 128 ff. Verbrauchergesetzbuch). Ist ein Stück mangelhaft oder nicht wie beschrieben, hast du Anspruch auf kostenlose Nachbesserung oder Ersatz und, wenn das unmöglich ist oder nicht hilft, auf Minderung oder Vertragsauflösung mit Erstattung. Schreib mir mit Fotos und Bestellnummer: Rücksendekosten bei Mangel trage ich. Die Gewährleistung ist etwas anderes als der Widerruf und gilt weit über die 14 Tage hinaus.",
    complaints: "Beschwerden und Streitigkeiten",
    complaintsBody:
      "Bei Problemen schreib zuerst mir: ich antworte innerhalb weniger Tage, und in der Praxis erledigt sich das so. Kommen wir nicht zusammen, kannst du dich an eine beim italienischen Unternehmensministerium gelistete AS-Stelle für Verbraucherstreitigkeiten wenden. Die europäische OS-Plattform wurde im Juli 2025 abgeschaltet und steht nicht mehr zur Verfügung.",
    law: "Anwendbares Recht",
    lawBody:
      "Auf den Vertrag ist italienisches Recht anwendbar. Günstigere Schutzvorschriften des EU-Landes, in dem du als Verbraucher wohnst, bleiben unberührt. Für Streitigkeiten ist das Gericht deines Wohnsitzes oder Aufenthalts zuständig.",
    disclaimer:
      "Informationstext, keine Rechtsberatung. Wenn du bei deinen Rechten unsicher bist, schreib mir oder wende dich an eine Verbraucherzentrale.",
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
