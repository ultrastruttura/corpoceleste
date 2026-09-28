import type { Locale } from "./locales";

const it = {
  meta: {
    description:
      "Maglie serigrafate a un colore, stampate a mano a Bergamo. Edizioni d’artista, cotone, spedizione in Italia e in Europa.",
  },
  home: {
    title: "Maglie serigrafate",
    lede: "Edizioni d’artista stampate a mano nello studio di Bergamo. Un colore, cotone, non print-on-demand.",
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
  },
  product: {
    size: "Taglia",
    add: "Aggiungi al carrello",
    sold: "Esaurita.",
    reprint: "Richiedi ristampa",
    printOne: "Serigrafia, un colore",
    shipLine: (itPrice: number, euPrice: number) =>
      `Spedizione Italia ${itPrice} €, Europa ${euPrice} €`,
    colors: {
      Nero: "Nero",
      Viola: "Viola",
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
    paypalNote: "Pagamento PayPal. Indirizzo di spedizione su PayPal.",
    shippingTitle: "Spedizioni",
    shippingBody:
      "Studio di una persona: stampo e imballo io. Spedisco due volte a settimana. Se ti serve per una data precisa, scrivi prima di ordinare.",
    readShipping: "Ho letto i tempi di spedizione.",
    readPrivacy: (privacy: string) => `Ho letto l’${privacy}.`,
    privacyLink: "informativa privacy",
    shipTo: "Spedizione",
    italy: (n: number) => `Italia — ${n} €`,
    europe: (n: number) => `Europa — ${n} €`,
    paypal: "Paga con PayPal",
    paypalBack: "Torna a Corpoceleste",
    bank: "Bonifico",
    name: "Nome e cognome",
    email: "Email",
    phone: "Telefono",
    address: "Indirizzo",
    city: "CAP e città",
    notes: "Note",
    sendOrder: "Invia ordine",
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
    studioAlt: "Studio",
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
    bank: "Ti scrivo per il bonifico.",
    paypal: "Il pagamento è su PayPal. Ti scrivo per la spedizione.",
  },
  notFound: {
    title: "Pagina non trovata",
    body: "Questa pagina non c’è.",
  },
  privacy: {
    title: "Privacy",
    lede:
      "Informativa sul trattamento dei dati e sull’uso di cookie e storage, art. 13 GDPR.",
    updated: "Ultimo aggiornamento: 14 agosto 2026.",
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
};

const en: typeof it = {
  meta: {
    description:
      "One-colour screen-printed shirts, hand-printed in Bergamo. Artist editions on cotton. Shipping in Italy and across Europe.",
  },
  home: {
    title: "Screen-printed shirts",
    lede: "Artist editions hand-printed in the Bergamo studio. One colour, cotton — not print-on-demand.",
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
  },
  product: {
    size: "Size",
    add: "Add to cart",
    sold: "Sold out.",
    reprint: "Request a reprint",
    printOne: "Screen print, one colour",
    shipLine: (itPrice: number, euPrice: number) =>
      `Shipping Italy ${itPrice} €, Europe ${euPrice} €`,
    colors: {
      Nero: "Black",
      Viola: "Purple",
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
    paypalNote: "PayPal checkout. Shipping address is collected on PayPal.",
    shippingTitle: "Shipping",
    shippingBody:
      "One-person studio: I print and pack the shirts myself. I ship twice a week. If you need them by a given date, write before you order.",
    readShipping: "I have read the shipping times.",
    readPrivacy: (privacy: string) => `I have read the ${privacy}.`,
    privacyLink: "privacy notice",
    shipTo: "Shipping",
    italy: (n: number) => `Italy — ${n} €`,
    europe: (n: number) => `Europe — ${n} €`,
    paypal: "Pay with PayPal",
    paypalBack: "Back to Corpoceleste",
    bank: "Bank transfer",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    city: "Postcode and city",
    notes: "Notes",
    sendOrder: "Place order",
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
    studioAlt: "Studio",
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
    bank: "I’ll write with the transfer details.",
    paypal: "Payment is with PayPal. I’ll write about shipping.",
  },
  notFound: {
    title: "Page not found",
    body: "This page isn’t here.",
  },
  privacy: {
    title: "Privacy",
    lede:
      "Information on the processing of personal data and on cookies and storage, Art. 13 GDPR.",
    updated: "Last updated: 14 August 2026.",
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
};

const de: typeof it = {
  meta: {
    description:
      "Einfarbig siebgedruckte Shirts, handgedruckt in Bergamo. Künstlereditionen auf Baumwolle. Versand in Italien und Europa.",
  },
  home: {
    title: "Siebgedruckte Shirts",
    lede: "Künstlereditionen, handgedruckt im Atelier in Bergamo. Eine Farbe, Baumwolle — kein Print-on-Demand.",
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
  },
  product: {
    size: "Größe",
    add: "In den Warenkorb",
    sold: "Ausverkauft.",
    reprint: "Nachdruck anfragen",
    printOne: "Siebdruck, eine Farbe",
    shipLine: (itPrice: number, euPrice: number) =>
      `Versand Italien ${itPrice} €, Europa ${euPrice} €`,
    colors: {
      Nero: "Schwarz",
      Viola: "Violett",
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
    paypalNote: "Zahlung über PayPal. Die Lieferadresse wird bei PayPal angegeben.",
    shippingTitle: "Versand",
    shippingBody:
      "Ein-Personen-Atelier: ich drucke und packe selbst. Ich schicke zweimal die Woche. Wenn du die Shirts zu einem bestimmten Datum brauchst, schreib vor der Bestellung.",
    readShipping: "Ich habe die Versandzeiten gelesen.",
    readPrivacy: (privacy: string) => `Ich habe die ${privacy} gelesen.`,
    privacyLink: "Datenschutzhinweise",
    shipTo: "Versand",
    italy: (n: number) => `Italien — ${n} €`,
    europe: (n: number) => `Europa — ${n} €`,
    paypal: "Mit PayPal bezahlen",
    paypalBack: "Zurück zu Corpoceleste",
    bank: "Überweisung",
    name: "Vor- und Nachname",
    email: "E-Mail",
    phone: "Telefon",
    address: "Adresse",
    city: "PLZ und Ort",
    notes: "Anmerkungen",
    sendOrder: "Bestellung senden",
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
    studioAlt: "Atelier",
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
    bank: "Ich schreibe wegen der Überweisung.",
    paypal: "Die Zahlung läuft über PayPal. Ich schreibe zum Versand.",
  },
  notFound: {
    title: "Seite nicht gefunden",
    body: "Diese Seite gibt es nicht.",
  },
  privacy: {
    title: "Datenschutz",
    lede:
      "Informationen zur Verarbeitung personenbezogener Daten und zu Cookies und Speicher, Art. 13 DSGVO.",
    updated: "Stand: 14. August 2026.",
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
};

export const ui = { it, en, de } satisfies Record<Locale, typeof it>;
export type Ui = typeof it;
