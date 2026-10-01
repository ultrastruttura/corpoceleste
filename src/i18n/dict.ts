import type { Locale } from "./locales";

const it = {
  meta: {
    description:
      "Serigrafia d’artista a un colore, stampata a mano a Bergamo. Maglie, stampe ed edizioni — non print-on-demand. Spedizione in Italia e in Europa.",
  },
  home: {
    title: "Serigrafia d’artista",
    lede: "Un colore, stampato a mano a Bergamo. Maglie, stampe, edizioni.",
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
    skip: "Vai al contenuto",
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
    compositionLabel: "Come da etichetta cucita sul capo.",
    sizeChart: "Tabella taglie",
    sizeChest: "½ petto",
    sizeLength: "Lunghezza",
    sizeSleeve: "Manica",
    sizeUnit: "cm",
    sizeChartNote:
      "Misure del capo disteso, in centimetri. ½ petto = da cucitura a cucitura, non la circonferenza. Tolleranza di stampa circa ±1 cm. Confronta con una maglia che ti sta. Se l’etichetta cucita indica una composizione diversa da quella in pagina, vale l’etichetta.",
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
    methodPaypal: "PayPal / Apple Pay",
    paypalSoon: "PayPal non è ancora attivo. Per ora usa il bonifico.",
    applePayHint: "Apple Pay compare su Safari / dispositivi Apple quando PayPal lo abilita sul dominio.",
    applePay: "Apple Pay",
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
    paintings: "Pittura e progetti paralleli di Andrea Baldelli.",
    linksTitle: "Contatti e social",
    facebookNote: "pagina dedicata, utile se pubblichi eventi",
    pastTitle: "Vecchi progetti",
  },
  workshops: {
    title: "Corsi",
    introTitle: "Workshop di serigrafia",
    intro:
      "Corsi pratici in studio a Bergamo: un colore, telaio, carta o tessuto. Spiego impianti, inchiostri e il flusso di lavoro che uso per le edizioni Corpoceleste.\n\nPuoi entrare in lista d’attesa per una data in studio, oppure proporre un workshop nella tua sede (scuola, spazio, evento). Scrivi tu i dettagli quando sei pronto: intanto i form sotto raccolgono le richieste.",
    waitlist: "Lista d’attesa",
    waitlistBody:
      "Workshop in studio. Quando c’è un gruppo minimo fisso la data e avviso chi è in lista.",
    onSite: "Workshop presso di voi",
    onSiteBody:
      "Porto i telai nella vostra sede. Scrivete spazio, città e cosa vi serve.",
    spaceName: "Nome e spazio",
    city: "Città / sede",
    archive: "Archivio",
    since: "Workshop di stampa tenuti in passato.",
    upcoming: "Prossimi workshop",
    upcomingLead: "Date aperte all’iscrizione. Il link porta alla pagina di chi organizza.",
    upcomingEmpty: "Nessuna data pubblica in programma. Usa la lista d’attesa sopra, oppure proponi un workshop presso di voi.",
    organizedBy: "Organizzato da",
    signup: "Iscriviti",
    studioAlt: "Workshop di serigrafia, stampa dal vivo",
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
    empty: "Nessun post ancora.",
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
    lede: "Chi tratta i dati, perché, e a chi arrivano.",
    updated: "Ultimo aggiornamento: 1 ottobre 2026.",
    controller: "Titolare",
    controllerBody: (name: string, sede: string) =>
      `${name}, per il sito Corpoceleste. Sede: ${sede}.`,
    vat: (id: string) => `P. IVA ${id}.`,
    contact: "Contatto:",
    cookies: "Cookie e storage",
    cookiesP1:
      "Niente cookie di profilazione, analytics o pubblicità. Per questo non c’è un banner.",
    cookiesP3:
      "Il carrello sta solo sul tuo browser, non su un server nostro.",
    cookiesPaypal:
      "Se paghi con PayPal, il checkout carica lo script di PayPal su questa pagina: valgono cookie e informativa di PayPal",
    cookiesMore: "Dettaglio nella",
    cookiesMoreLink: "cookie policy",
    data: "Quali dati, perché",
    dataIntro: "Trattiamo solo ciò che ci scrivi tu:",
    dataOrder:
      "nome, email, telefono, indirizzo, ordine — per spedire e per i conti.",
    dataPaypal: "importo e indirizzo li gestisce PayPal, se paghi così.",
    dataForms: "nome, email, messaggio — per risponderti, poi li tolgo.",
    dataNewsletter: (email: string) =>
      `solo l’email, se spunti la casella. Revoca quando vuoi scrivendo a ${email}.`,
    noProfiling: "Niente profilazione.",
    recipients: "Chi riceve i dati",
    transfers: "Trasferimenti extra-UE",
    transfersBody:
      "Pagine su GitHub (USA). Magazzino, webhook PayPal, form e mail su Vercel e Resend (USA). Pagamenti su PayPal. Se l’API non è attiva, i form possono passare da FormSubmit (USA).",
    formsubmit:
      "fallback dei form se Vercel non è configurato. Società USA. Informativa:",
    paypalRecv: "se paghi con PayPal (sede europea, gruppo anche USA).",
    github: "hosting delle pagine pubbliche. Informativa su github.com.",
    vercel: "webhook PayPal, magazzino, form del sito, area artisti, mail di conferma. Dati d’ordine, non la carta.",
    resend: "invio delle mail (ordini, recesso, contatti, newsletter, corsi), mittente Corpoceleste.",
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
    lede: "Niente profilazione. Il carrello sta sul tuo browser. PayPal, se paghi così.",
    updated: "Ultimo aggiornamento: 1 ottobre 2026.",
    noBanner: "Niente banner",
    noBannerBody: "Niente cookie di profilazione o pubblicità: per questo non c’è un banner.",
    onSite: "Sul tuo browser",
    onSiteBody:
      "Il carrello e il riepilogo dopo il checkout restano sul tuo dispositivo, non su un server nostro.",
    third: "Terze parti",
    thirdBody:
      "Se paghi con PayPal, il checkout carica il suo script: valgono cookie e informativa di PayPal.",
    manage: "Come toglierli",
    manageBody: "Impostazioni del browser, dati del sito. Oppure svuota il carrello da qui.",
    privacyLink: "Informativa privacy completa",
    contact: "Contatto titolare:",
  },
  terms: {
    title: "Condizioni di vendita",
    lede: "Chi vende, cosa compri, come si paga, come si recede.",
    updated: "Ultimo aggiornamento: 1 ottobre 2026.",
    seller: "Venditore",
    vatLabel: "Partita IVA:",
    reaLabel: "REA:",
    vatMissing: "Partita IVA: la pubblico quando è attiva.",
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
      "Dopo la comunicazione hai 14 giorni per rispedire il pezzo. Rimborso tutto quello che hai pagato, spedizione standard di andata compresa, entro 14 giorni dal momento in cui ricevo il reso o la prova della spedizione, con lo stesso mezzo di pagamento che hai usato. Il costo della restituzione è a tuo carico. Rispondi della diminuzione di valore se hai usato il pezzo oltre quanto serve a verificarne natura e caratteristiche: provalo come faresti in negozio.",
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
    lede: "One colour, hand-printed in Bergamo. Shirts, prints, editions.",
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
    skip: "Skip to content",
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
    compositionLabel: "As on the sewn-in label.",
    sizeChart: "Size chart",
    sizeChest: "½ chest",
    sizeLength: "Length",
    sizeSleeve: "Sleeve",
    sizeUnit: "cm",
    sizeChartNote:
      "Garment laid flat, in centimetres. ½ chest is seam to seam, not circumference. Print tolerance about ±1 cm. Compare with a shirt that fits you. If the sewn-in label states a different fibre composition, the label prevails.",
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
    methodPaypal: "PayPal / Apple Pay",
    paypalSoon: "PayPal is not active yet. Use the bank transfer for now.",
    applePayHint: "Apple Pay shows on Safari / Apple devices once PayPal enables it for the domain.",
    applePay: "Apple Pay",
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
    paintings: "Painting and parallel projects by Andrea Baldelli.",
    linksTitle: "Contact and social",
    facebookNote: "dedicated page — useful if you post events",
    pastTitle: "Past projects",
  },
  workshops: {
    title: "Workshops",
    introTitle: "Screen-printing workshops",
    intro:
      "Hands-on workshops in the Bergamo studio: one colour, screen, paper or fabric. I cover setups, inks and the workflow I use for Corpoceleste editions.\n\nJoin the waiting list for a studio date, or propose a workshop at your venue (school, space, event). The forms below collect requests.",
    waitlist: "Waiting list",
    waitlistBody:
      "Studio workshop. When a minimum group is ready I set the date and write to the list.",
    onSite: "Workshop at your space",
    onSiteBody: "I bring the screens to your venue. Tell me the space, city and what you need.",
    spaceName: "Name and space",
    city: "City / venue",
    archive: "Archive",
    since: "Past screen-printing workshops.",
    upcoming: "Upcoming workshops",
    upcomingLead: "Open dates. The link goes to the organiser’s signup page.",
    upcomingEmpty: "No public dates right now. Use the waiting list above, or propose a workshop at your space.",
    organizedBy: "Organised by",
    signup: "Sign up",
    studioAlt: "Screen-printing workshop, live printing",
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
    empty: "No posts yet.",
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
    lede: "Who processes the data, why, and who receives it.",
    updated: "Last updated: 1 October 2026.",
    controller: "Controller",
    controllerBody: (name: string, sede: string) =>
      `${name}, for the Corpoceleste site. Address: ${sede}.`,
    vat: (id: string) => `VAT ${id}.`,
    contact: "Contact:",
    cookies: "Cookies and storage",
    cookiesP1:
      "No profiling, analytics or advertising cookies. That is why there is no banner.",
    cookiesP3:
      "The cart stays in your browser, not on a server of ours.",
    cookiesPaypal:
      "If you pay with PayPal, checkout loads PayPal’s script on this page; PayPal’s cookies and privacy notice then apply",
    cookiesMore: "Detail in the",
    cookiesMoreLink: "cookie policy",
    data: "What data, and why",
    dataIntro: "We only process what you send us:",
    dataOrder:
      "name, email, phone, address, order — to ship and for the accounts.",
    dataPaypal: "amount and address are handled by PayPal, if you pay that way.",
    dataForms: "name, email, message — to reply, then we delete them.",
    dataNewsletter: (email: string) =>
      `email only, if you tick the box. Withdraw whenever you want by writing to ${email}.`,
    noProfiling: "No profiling.",
    recipients: "Who receives the data",
    transfers: "Transfers outside the EU",
    transfersBody:
      "Pages on GitHub (USA). Stock, PayPal webhook, forms and mail on Vercel and Resend (USA). Payments on PayPal. If the API is off, forms may use FormSubmit (USA).",
    formsubmit:
      "form fallback if Vercel is not configured. US company. Notice:",
    paypalRecv: "if you pay with PayPal (European seat, group also in the USA).",
    github: "hosts the public pages. Notice on github.com.",
    vercel: "PayPal webhook, stock, site forms, artist area, confirmation mail. Order data, not the card.",
    resend: "sends mail (orders, withdrawal, contact, newsletter, workshops), from Corpoceleste.",
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
    lede: "No profiling. The cart stays in your browser. PayPal, if you pay that way.",
    updated: "Last updated: 1 October 2026.",
    noBanner: "No banner",
    noBannerBody: "No profiling, analytics or advertising cookies: that is why there is no banner.",
    onSite: "On your browser",
    onSiteBody:
      "The cart and the post-checkout summary stay on your device, not on a server of ours.",
    third: "Third parties",
    thirdBody:
      "If you pay with PayPal, checkout loads its script: PayPal’s cookies and notice apply.",
    manage: "How to remove them",
    manageBody: "Browser settings, site data. Or empty the cart from here.",
    privacyLink: "Full privacy notice",
    contact: "Controller contact:",
  },
  terms: {
    title: "Terms of sale",
    lede: "Who sells, what you buy, how you pay, how you withdraw.",
    updated: "Last updated: 1 October 2026.",
    seller: "Seller",
    vatLabel: "VAT number:",
    reaLabel: "Business register:",
    vatMissing: "VAT number: I’ll publish it when it is active.",
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
      "After notifying me you have 14 days to send the piece back. I refund everything you paid, including standard outbound shipping, within 14 days of receiving the return or proof that you sent it, using the same payment method you used. Return shipping is at your cost. You are liable for any diminished value if you handled the piece beyond what is needed to establish its nature and characteristics: try it as you would in a shop.",
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
    title: "Künstlersiebdruck",
    lede: "Eine Farbe, handgedruckt in Bergamo. Shirts, Drucke, Editionen.",
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
    skip: "Zum Inhalt",
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
    compositionLabel: "Wie auf dem eingenähten Etikett.",
    sizeChart: "Größentabelle",
    sizeChest: "½ Brust",
    sizeLength: "Länge",
    sizeSleeve: "Ärmel",
    sizeUnit: "cm",
    sizeChartNote:
      "Maß des flach liegenden Kleidungsstücks, in Zentimetern. ½ Brust ist Naht zu Naht, nicht der Umfang. Drucktoleranz etwa ±1 cm. Vergleich mit einem Shirt, das dir passt. Steht auf dem eingenähten Etikett eine andere Faserzusammensetzung, gilt das Etikett.",
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
    methodPaypal: "PayPal / Apple Pay",
    paypalSoon: "PayPal ist noch nicht aktiv. Bis dahin Überweisung.",
    applePayHint: "Apple Pay erscheint in Safari / auf Apple-Geräten, sobald PayPal es für die Domain freischaltet.",
    applePay: "Apple Pay",
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
    paintings: "Malerei und parallele Projekte von Andrea Baldelli.",
    linksTitle: "Kontakt und Social",
    facebookNote: "eigene Seite — sinnvoll für Events",
    pastTitle: "Frühere Projekte",
  },
  workshops: {
    title: "Kurse",
    introTitle: "Siebdruck-Workshops",
    intro:
      "Praxisworkshops im Atelier in Bergamo: eine Farbe, Sieb, Papier oder Stoff. Ich erkläre Anlagen, Farben und den Ablauf, den ich für Corpoceleste-Editionen nutze.\n\nAuf die Warteliste für einen Termin im Atelier, oder Workshop bei euch vorschlagen (Schule, Raum, Event). Die Formulare unten nehmen Anfragen auf.",
    waitlist: "Warteliste",
    waitlistBody:
      "Workshop im Atelier. Wenn eine Mindestgruppe da ist, lege ich den Termin fest und schreibe der Liste.",
    onSite: "Workshop bei euch",
    onSiteBody: "Ich bringe die Siebe zu euch. Schreibt Ort, Stadt und was ihr braucht.",
    spaceName: "Name und Ort",
    city: "Stadt / Ort",
    archive: "Archiv",
    since: "Frühere Siebdruck-Workshops.",
    upcoming: "Nächste Workshops",
    upcomingLead: "Offene Termine. Der Link führt zur Anmeldung des Veranstalters.",
    upcomingEmpty: "Keine öffentlichen Termine. Nutze die Warteliste oben, oder schlage einen Workshop bei euch vor.",
    organizedBy: "Organisiert von",
    signup: "Anmelden",
    studioAlt: "Siebdruck-Workshop, Live-Druck",
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
    empty: "Noch keine Beiträge.",
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
    lede: "Wer die Daten verarbeitet, wozu, und wer sie erhält.",
    updated: "Stand: 1. Oktober 2026.",
    controller: "Verantwortlicher",
    controllerBody: (name: string, sede: string) =>
      `${name}, für die Website Corpoceleste. Sitz: ${sede}.`,
    vat: (id: string) => `USt-IdNr. ${id}.`,
    contact: "Kontakt:",
    cookies: "Cookies und Speicher",
    cookiesP1:
      "Keine Profiling-, Analyse- oder Werbe-Cookies. Deshalb gibt es kein Banner.",
    cookiesP3:
      "Der Warenkorb bleibt in deinem Browser, nicht auf einem Server von uns.",
    cookiesPaypal:
      "Wenn du mit PayPal zahlst, lädt die Kasse das PayPal-Skript auf dieser Seite; es gelten Cookies und Hinweise von PayPal",
    cookiesMore: "Details in der",
    cookiesMoreLink: "Cookie-Richtlinie",
    data: "Welche Daten, wozu",
    dataIntro: "Wir verarbeiten nur, was du uns schreibst:",
    dataOrder:
      "Name, E-Mail, Telefon, Adresse, Bestellung — zum Versand und für die Buchhaltung.",
    dataPaypal: "Betrag und Adresse verarbeitet PayPal, wenn du so zahlst.",
    dataForms: "Name, E-Mail, Nachricht — zum Antworten, dann löschen wir sie.",
    dataNewsletter: (email: string) =>
      `nur die E-Mail, wenn du das Kästchen ankreuzt. Widerruf jederzeit an ${email}.`,
    noProfiling: "Kein Profiling.",
    recipients: "Wer die Daten erhält",
    transfers: "Übermittlungen außerhalb der EU",
    transfersBody:
      "Seiten auf GitHub (USA). Bestand, PayPal-Webhook, Formulare und Mails auf Vercel und Resend (USA). Zahlungen auf PayPal. Ist die API aus, können Formulare über FormSubmit (USA) laufen.",
    formsubmit:
      "Formular-Fallback, wenn Vercel nicht konfiguriert ist. US-Unternehmen. Hinweise:",
    paypalRecv: "wenn du mit PayPal zahlst (Sitz in Europa, Gruppe auch in den USA).",
    github: "hostet die öffentlichen Seiten. Hinweise auf github.com.",
    vercel: "PayPal-Webhook, Bestand, Formulare, Künstlerbereich, Bestätigungsmails. Bestelldaten, keine Karte.",
    resend: "versendet Mails (Bestellung, Widerruf, Kontakt, Newsletter, Kurse), Absender Corpoceleste.",
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
    lede: "Kein Profiling. Der Warenkorb bleibt in deinem Browser. PayPal, wenn du so zahlst.",
    updated: "Stand: 1. Oktober 2026.",
    noBanner: "Kein Banner",
    noBannerBody: "Keine Profiling-, Analyse- oder Werbe-Cookies: deshalb gibt es kein Banner.",
    onSite: "In deinem Browser",
    onSiteBody:
      "Warenkorb und Zusammenfassung nach dem Checkout bleiben auf deinem Gerät, nicht auf einem Server von uns.",
    third: "Dritte",
    thirdBody:
      "Wenn du mit PayPal zahlst, lädt die Kasse sein Skript: es gelten Cookies und Hinweise von PayPal.",
    manage: "Wie du sie entfernst",
    manageBody: "Browser-Einstellungen, Website-Daten. Oder den Warenkorb hier leeren.",
    privacyLink: "Vollständiger Datenschutzhinweis",
    contact: "Kontakt Verantwortlicher:",
  },
  terms: {
    title: "Verkaufsbedingungen",
    lede: "Wer verkauft, was du kaufst, wie bezahlt wird, wie du widerrufst.",
    updated: "Stand: 1. Oktober 2026.",
    seller: "Verkäufer",
    vatLabel: "USt-IdNr.:",
    reaLabel: "Handelsregister:",
    vatMissing: "USt-IdNr.: ich veröffentliche sie, sobald sie aktiv ist.",
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
      "Nach der Mitteilung hast du 14 Tage, um das Stück zurückzuschicken. Ich erstatte alles, was du gezahlt hast, inklusive Standardversand hin, innerhalb von 14 Tagen nach Erhalt der Rücksendung oder des Sendungsnachweises, über dasselbe Zahlungsmittel. Die Rücksendekosten trägst du. Für einen Wertverlust haftest du, wenn du das Stück über das hinaus benutzt hast, was zur Prüfung von Beschaffenheit und Eigenschaften nötig ist: probier es wie im Laden.",
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
