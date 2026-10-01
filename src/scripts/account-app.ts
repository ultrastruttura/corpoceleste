import {
  apiFetch,
  apiRoot,
  clearSession,
  el,
  getSession,
  money,
  setMsg,
} from "./account-api";

type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "artist";
  artist_slug: string | null;
};

type DealSummary = {
  deal: {
    id: string;
    user_id: string;
    product_id: string;
    product_title: string;
    unit_price: number;
    planned_qty: number;
    artist_share_pct: number;
    vat_rate_pct: number;
    active: boolean;
    notes: string;
    costs: Array<{ id: string; label: string; amount: number; per_unit: boolean }>;
  };
  sales: Array<{
    id: string;
    qty: number;
    unit_price: number;
    size: string;
    source: string;
    sold_at: string;
  }>;
  soldQty: number;
  gross: number;
  vat: number;
  costsTotal: number;
  profit: number;
  artistDue: number;
  studioShare: number;
};

type Dashboard = {
  deals: DealSummary[];
  settlements: Array<{ id: string; period: string; amount: number; note: string; paid_at: string }>;
  artistDueTotal: number;
  paidTotal: number;
  outstanding: number;
};

type AdminRoute =
  | { name: "artists" }
  | { name: "artist"; id: string }
  | { name: "settings" };

const root = document.querySelector<HTMLElement>("[data-account-root]");
const app = document.querySelector<HTMLElement>("[data-account-app]");
if (!root || !app) {
  // not on account page
} else {
  const base = apiRoot(root);
  boot();

  async function boot() {
    if (!base) {
      app!.innerHTML = "";
      app!.append(el("p", "lede", "API non configurata."));
      return;
    }
    if (!getSession()) {
      renderLogin();
      return;
    }
    try {
      const data = (await apiFetch(base, "auth", {
        method: "POST",
        body: JSON.stringify({ action: "me" }),
      })) as { user: User | null };
      if (!data.user) {
        clearSession();
        renderLogin();
        return;
      }
      if (data.user.role === "admin") await renderAdmin(data.user);
      else await renderArtist(data.user);
    } catch {
      clearSession();
      renderLogin();
    }
  }

  function renderLogin() {
    root!.classList.remove("account-page--admin");
    const title = document.querySelector(".account-page > h1");
    if (title) title.textContent = "Area personale";
    app!.innerHTML = "";
    app!.append(
      el(
        "p",
        "lede",
        "Inserisci l’email con cui sei stato invitato. Riceverai un link monouso (scade in circa 30 minuti).",
      ),
    );
    const form = el("form", "account-form account-login");
    form.innerHTML = `
      <label class="account-login-field">
        <span>Email</span>
        <input type="email" name="email" required autocomplete="email" placeholder="nome@email.com" />
      </label>
      <button class="btn" type="submit">Invia</button>
      <p class="account-msg" data-msg hidden></p>
    `;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector<HTMLElement>("[data-msg]")!;
      const btn = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
      msg.hidden = false;
      msg.textContent = "Invio…";
      btn.disabled = true;
      const email = new FormData(form).get("email") as string;
      try {
        const data = (await apiFetch(base, "auth", {
          method: "POST",
          body: JSON.stringify({ action: "login", email }),
        })) as { message?: string; emailed?: boolean; devLink?: string };
        if (data.devLink) {
          setMsg(msg, data.message || "Mail non inviata (dev).", {
            href: data.devLink,
            label: "Apri link",
          });
        } else if (data.emailed === false) {
          setMsg(
            msg,
            data.message ||
              "Invio mail fallito. Su Vercel controlla RESEND_API_KEY e MAIL_FROM (dominio verificato su Resend).",
          );
        } else {
          setMsg(msg, data.message || "Controlla la posta: ti abbiamo inviato il link.");
        }
      } catch (err) {
        const text =
          err instanceof TypeError && /fetch/i.test(String(err.message))
            ? "Connessione all’API fallita (spesso deploy in corso o crash server). Riprova tra un minuto."
            : err instanceof Error
              ? err.message
              : "Errore";
        setMsg(msg, text);
      } finally {
        btn.disabled = false;
      }
    });
    app!.append(form);
  }

  function toolbar(user: User) {
    const bar = el("div", "account-toolbar");
    const who = el(
      "p",
      "account-who",
      `${user.name || user.email} · ${user.role === "admin" ? "admin" : "artista"}`,
    );
    const out = el("button", "account-linkish", "Esci") as HTMLButtonElement;
    out.type = "button";
    out.addEventListener("click", async () => {
      try {
        await apiFetch(base, "auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
      } catch {
        /* ignore */
      }
      clearSession();
      renderLogin();
    });
    bar.append(who, out);
    return bar;
  }

  function metrics(rows: Array<[string, string]>) {
    const dl = el("dl", "account-metrics");
    for (const [k, v] of rows) {
      const dt = el("dt", "", k);
      const dd = el("dd", "", v);
      dl.append(dt, dd);
    }
    return dl;
  }

  function dealBlock(s: DealSummary, showArtist = true) {
    const box = el("article", "account-deal");
    box.append(
      el("h3", "", s.deal.product_title || s.deal.product_id),
      el(
        "p",
        "account-meta",
        `${s.soldQty}/${s.deal.planned_qty} pezzi · ${s.deal.artist_share_pct}% artista · IVA ${s.deal.vat_rate_pct}% · ${money(s.deal.unit_price)}`,
      ),
    );
    const rows: Array<[string, string]> = [
      ["Ricavi lordi", money(s.gross)],
      ["IVA", money(s.vat)],
      ["Costi", money(s.costsTotal)],
      ["Utile", money(s.profit)],
    ];
    if (showArtist) {
      rows.push(["Quota artista", money(s.artistDue)]);
      rows.push(["Quota studio", money(s.studioShare)]);
    }
    box.append(metrics(rows));

    if (s.deal.costs.length) {
      const ul = el("ul", "account-list");
      for (const c of s.deal.costs) {
        ul.append(
          el(
            "li",
            "",
            `${c.label}: ${money(c.amount)}${c.per_unit ? " / pezzo" : " (fisso)"}`,
          ),
        );
      }
      box.append(el("h4", "", "Costi edizione"), ul);
    }

    if (s.sales.length) {
      const ul = el("ul", "account-list");
      for (const sale of s.sales.slice(0, 40)) {
        const day = sale.sold_at.slice(0, 10);
        ul.append(
          el(
            "li",
            "",
            `${day} · ${sale.qty}× ${sale.size || "—"} · ${money(sale.unit_price)} · ${sale.source}`,
          ),
        );
      }
      box.append(el("h4", "", "Ordini / vendite"), ul);
    }
    return box;
  }

  async function renderArtist(user: User) {
    root!.classList.remove("account-page--admin");
    app!.innerHTML = "";
    app!.append(toolbar(user), el("h2", "", "Il tuo prospetto"));
    const dash = (await apiFetch(base, "settle?dashboard=1")) as Dashboard;
    app!.append(
      metrics([
        ["Lordo da fatturare (totale)", money(dash.artistDueTotal)],
        ["Già saldato", money(dash.paidTotal)],
        ["Ancora dovuto", money(dash.outstanding)],
      ]),
    );
    if (!dash.deals.length) {
      app!.append(el("p", "lede", "Nessun deal collegato ancora."));
    }
    for (const d of dash.deals) app!.append(dealBlock(d));

    if (dash.settlements.length) {
      app!.append(el("h2", "", "Saldi"));
      const ul = el("ul", "account-list");
      for (const s of dash.settlements) {
        ul.append(
          el("li", "", `${s.period}: ${money(s.amount)} · ${s.note || "saldato"} · ${s.paid_at.slice(0, 10)}`),
        );
      }
      app!.append(ul);
    }
  }

  function parseAdminRoute(): AdminRoute {
    const raw = (location.hash || "").replace(/^#/, "").replace(/^\//, "");
    if (raw.startsWith("artista/")) {
      const id = decodeURIComponent(raw.slice("artista/".length));
      if (id) return { name: "artist", id };
    }
    if (raw === "impostazioni") return { name: "settings" };
    return { name: "artists" };
  }

  function setAdminRoute(route: AdminRoute) {
    const next =
      route.name === "artists"
        ? "#artisti"
        : route.name === "settings"
          ? "#impostazioni"
          : `#artista/${encodeURIComponent(route.id)}`;
    if (location.hash === next) return;
    location.hash = next;
  }

  let adminHashBound = false;

  async function renderAdmin(user: User) {
    root!.classList.add("account-page--admin");
    if (!adminHashBound) {
      adminHashBound = true;
      window.addEventListener("hashchange", () => {
        void renderAdmin(user);
      });
    }
    if (!location.hash || location.hash === "#") {
      history.replaceState(null, "", "#artisti");
    }
    const route = parseAdminRoute();

    const usersData = (await apiFetch(base, "users")) as { users: User[] };
    const dealsData = (await apiFetch(base, "deals")) as { deals: DealSummary[] };
    const meData = (await apiFetch(base, "auth", {
      method: "POST",
      body: JSON.stringify({ action: "me" }),
    })) as { mailConfigured?: boolean };
    const artists = usersData.users.filter((u) => u.role === "artist");

    app!.innerHTML = "";
    app!.append(toolbar(user));
    const title = document.querySelector(".account-page > h1");
    if (title) title.textContent = "Studio";

    if (meData.mailConfigured === false) {
      app!.append(
        el(
          "p",
          "account-banner account-banner--warn",
          "Mail non configurata su Vercel: manca RESEND_API_KEY oppure MAIL_FROM/SHOP_EMAIL. Finché non li imposti (Production) e fai Redeploy, login e inviti non partono da Resend.",
        ),
      );
    }

    const shell = el("div", "account-shell");
    const nav = el("nav", "account-subnav");
    nav.setAttribute("aria-label", "Sezioni admin");

    const mkTab = (label: string, active: boolean, onClick: () => void) => {
      const btn = el(
        "button",
        `account-subnav__tab${active ? " is-active" : ""}`,
        label,
      ) as HTMLButtonElement;
      btn.type = "button";
      btn.addEventListener("click", onClick);
      return btn;
    };

    nav.append(
      mkTab("Artisti", route.name === "artists" || route.name === "artist", () => {
        setAdminRoute({ name: "artists" });
      }),
      mkTab("Impostazioni", route.name === "settings", () => {
        setAdminRoute({ name: "settings" });
      }),
    );
    shell.append(nav);

    const main = el("div", "account-shell__main");
    if (route.name === "artists") await renderAdminArtists(main, user, artists, dealsData.deals);
    else if (route.name === "artist") {
      const artist = artists.find((a) => a.id === route.id);
      if (!artist) {
        history.replaceState(null, "", "#artisti");
        await renderAdminArtists(main, user, artists, dealsData.deals);
      } else {
        await renderAdminArtistDetail(main, user, artist, dealsData.deals);
      }
    } else {
      await renderAdminSettings(main, user, artists, dealsData.deals);
    }

    shell.append(main);
    app!.append(shell);
  }

  async function renderAdminArtists(
    mount: HTMLElement,
    user: User,
    artists: User[],
    deals: DealSummary[],
  ) {
    mount.append(
      el("h2", "account-section-title", "Artisti attivi"),
      el("p", "account-lede", "Apri un artista per ordini, saldi e conti."),
    );

    if (!artists.length) {
      mount.append(el("p", "lede", "Nessun artista ancora. Vai in Impostazioni per invitarne uno."));
      return;
    }

    const table = el("div", "account-table");
    const head = el("div", "account-table__head");
    head.innerHTML = `<span>Artista</span><span>Deal</span><span>Dovuto</span><span>Residuo</span>`;
    table.append(head);

    for (const a of artists) {
      const dash = (await apiFetch(
        base,
        `settle?dashboard=1&user_id=${encodeURIComponent(a.id)}`,
      )) as Dashboard;
      const dealCount = deals.filter((d) => d.deal.user_id === a.id).length;
      const row = el("button", "account-table__row") as HTMLButtonElement;
      row.type = "button";
      row.innerHTML = `
        <span class="account-table__primary">
          <strong>${escapeHtml(a.name || a.email)}</strong>
          <small>${escapeHtml(a.email)}${a.artist_slug ? ` · ${escapeHtml(a.artist_slug)}` : ""}</small>
        </span>
        <span>${dealCount}</span>
        <span>${money(dash.artistDueTotal)}</span>
        <span class="account-table__emphasis">${money(dash.outstanding)}</span>
      `;
      row.addEventListener("click", () => {
        setAdminRoute({ name: "artist", id: a.id });
      });
      table.append(row);
    }
    mount.append(table);
  }

  async function renderAdminArtistDetail(
    mount: HTMLElement,
    user: User,
    artist: User,
    allDeals: DealSummary[],
  ) {
    const back = el("button", "account-back", "← Artisti") as HTMLButtonElement;
    back.type = "button";
    back.addEventListener("click", () => {
      setAdminRoute({ name: "artists" });
    });
    mount.append(back);

    mount.append(
      el("h2", "account-section-title", artist.name || artist.email),
      el(
        "p",
        "account-lede",
        `${artist.email}${artist.artist_slug ? ` · slug ${artist.artist_slug}` : ""}`,
      ),
    );

    const dash = (await apiFetch(
      base,
      `settle?dashboard=1&user_id=${encodeURIComponent(artist.id)}`,
    )) as Dashboard;

    const summary = el("section", "account-card");
    summary.append(
      el("h3", "", "Riepilogo conti"),
      metrics([
        ["Lordo da fatturare", money(dash.artistDueTotal)],
        ["Già saldato", money(dash.paidTotal)],
        ["Residuo", money(dash.outstanding)],
      ]),
    );
    mount.append(summary);

    const deals = allDeals.filter((d) => d.deal.user_id === artist.id);
    const orders = el("section", "account-card");
    orders.append(el("h3", "", "Ordini e deal"));
    if (!deals.length) {
      orders.append(el("p", "account-lede", "Nessun deal. Creane uno in Impostazioni."));
    } else {
      for (const s of deals) {
        const wrap = el("div", "account-deal-wrap");
        wrap.append(dealBlock(s));

        const bank = el("form", "account-inline-form");
        bank.innerHTML = `
          <span>Conferma bonifico</span>
          <input name="qty" type="number" min="1" value="1" required />
          <input name="size" placeholder="taglia" />
          <button type="submit">Registra</button>
        `;
        bank.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(bank);
          await apiFetch(base, "sales", {
            method: "POST",
            body: JSON.stringify({
              deal_id: s.deal.id,
              qty: Number(fd.get("qty")),
              size: fd.get("size") || "",
              source: "bank",
            }),
          });
          await renderAdmin(user);
        });
        wrap.append(bank);
        orders.append(wrap);
      }
    }
    mount.append(orders);

    const conti = el("section", "account-card");
    conti.append(el("h3", "", "Saldi mensili"));
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const settle = el("form", "account-inline-form account-inline-form--stack");
    settle.innerHTML = `
      <span>Segna saldato</span>
      <input name="period" value="${period}" required pattern="\\d{4}-\\d{2}" title="YYYY-MM" />
      <input name="amount" type="number" step="0.01" value="${Math.max(0, dash.outstanding).toFixed(2)}" required />
      <button type="submit">Salva</button>
    `;
    settle.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(settle);
      await apiFetch(base, "settle", {
        method: "POST",
        body: JSON.stringify({
          user_id: artist.id,
          period: fd.get("period"),
          amount: Number(fd.get("amount")),
          note: "saldo mensile",
        }),
      });
      await renderAdmin(user);
    });
    conti.append(settle);

    if (dash.settlements.length) {
      const ul = el("ul", "account-list");
      for (const st of dash.settlements) {
        const li = el("li", "account-row");
        li.append(
          document.createTextNode(`${st.period}: ${money(st.amount)} · ${st.note || "saldato"}`),
        );
        const undo = el("button", "account-linkish", "Annulla") as HTMLButtonElement;
        undo.type = "button";
        undo.addEventListener("click", async () => {
          await apiFetch(base, `settle?id=${encodeURIComponent(st.id)}`, { method: "DELETE" });
          await renderAdmin(user);
        });
        li.append(undo);
        ul.append(li);
      }
      conti.append(ul);
    } else {
      conti.append(el("p", "account-lede", "Nessun saldo registrato."));
    }
    mount.append(conti);
  }

  async function renderAdminSettings(
    mount: HTMLElement,
    user: User,
    artists: User[],
    deals: DealSummary[],
  ) {
    mount.append(
      el("h2", "account-section-title", "Impostazioni"),
      el("p", "account-lede", "Inviti, anagrafica artisti e deal di edizione."),
    );

    const invite = el("form", "account-form account-card");
    invite.innerHTML = `
      <h3>Invita artista</h3>
      <label><span>Nome</span><input name="name" required /></label>
      <label><span>Email</span><input type="email" name="email" required /></label>
      <label>
        <span>Slug artista sul sito (opz.)</span>
        <input name="artist_slug" placeholder="es. ruco" />
      </label>
      <p class="account-hint">Stesso slug della cartella artista in Tina (opzionale, si può aggiungere dopo).</p>
      <button type="submit">Invia invito</button>
      <p class="account-msg" data-msg hidden></p>
    `;
    invite.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(invite);
      const msg = invite.querySelector<HTMLElement>("[data-msg]")!;
      msg.hidden = false;
      msg.textContent = "…";
      try {
        const data = (await apiFetch(base, "auth", {
          method: "POST",
          body: JSON.stringify({
            action: "invite",
            name: fd.get("name"),
            email: fd.get("email"),
            artist_slug: fd.get("artist_slug") || undefined,
          }),
        })) as { emailed?: boolean; message?: string; devLink?: string };
        if (data.devLink) {
          setMsg(msg, data.message || "Utente creato (dev).", {
            href: data.devLink,
            label: "Apri link",
          });
        } else if (data.emailed === false) {
          setMsg(
            msg,
            data.message ||
              "Utente creato, ma email non inviata. Controlla RESEND_API_KEY e MAIL_FROM su Vercel (Production) e fai Redeploy.",
          );
        } else {
          setMsg(msg, data.message || "Invito inviato.");
        }
        await renderAdmin(user);
      } catch (err) {
        setMsg(msg, err instanceof Error ? err.message : "Errore");
      }
    });
    mount.append(invite);

    const roster = el("section", "account-card");
    roster.append(el("h3", "", "Elenco artisti"));
    if (!artists.length) {
      roster.append(el("p", "account-lede", "Nessun artista."));
    } else {
      const ul = el("ul", "account-list");
      for (const a of artists) {
        const li = el("li", "account-row");
        li.append(
          document.createTextNode(
            `${a.name || a.email} <${a.email}>${a.artist_slug ? ` · ${a.artist_slug}` : ""}`,
          ),
        );
        const del = el("button", "account-linkish", "Rimuovi") as HTMLButtonElement;
        del.type = "button";
        del.addEventListener("click", async () => {
          if (!confirm(`Rimuovere ${a.email}?`)) return;
          await apiFetch(base, `users?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
          await renderAdmin(user);
        });
        li.append(del);
        ul.append(li);
      }
      roster.append(ul);
    }
    mount.append(roster);

    const artistOpts = artists
      .map((a) => `<option value="${a.id}">${escapeHtml(a.name || a.email)}</option>`)
      .join("");

    const dealForm = el("form", "account-form account-card");
    dealForm.innerHTML = `
      <h3>Deal edizione</h3>
      <p class="account-hint">Prezzo al cliente, costi per pezzo/fissi, percentuale artista.</p>
      <label><span>Artista</span><select name="user_id" required>${artistOpts}</select></label>
      <label><span>Product id (Tina)</span><input name="product_id" required placeholder="slug prodotto" /></label>
      <label><span>Titolo</span><input name="product_title" /></label>
      <label><span>Prezzo al cliente €</span><input name="unit_price" type="number" step="0.01" min="0" required /></label>
      <label><span>Pezzi previsti</span><input name="planned_qty" type="number" min="1" value="50" required /></label>
      <label><span>% artista</span><input name="artist_share_pct" type="number" min="0" max="100" value="40" required /></label>
      <label><span>IVA %</span><input name="vat_rate_pct" type="number" min="0" value="22" required /></label>
      <label><span>Note</span><input name="notes" /></label>
      <fieldset class="account-costs">
        <legend>Costi (label|importo|fisso o pezzo)</legend>
        <p class="account-hint">Es. <code>Maglie|8.5|pezzo</code> oppure <code>Affitto|120|fisso</code></p>
        <textarea name="costs" rows="4" placeholder="Maglie|8.5|pezzo&#10;Telaio|40|fisso"></textarea>
      </fieldset>
      <input type="hidden" name="id" value="" />
      <button type="submit">Salva deal</button>
      <p class="account-msg" data-msg hidden></p>
    `;
    dealForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(dealForm);
      const msg = dealForm.querySelector<HTMLElement>("[data-msg]")!;
      msg.hidden = false;
      const costsRaw = String(fd.get("costs") || "");
      const costs = costsRaw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, amount, kind] = line.split("|").map((x) => x.trim());
          return {
            label,
            amount: Number(amount),
            per_unit: /pezzo|unit/i.test(kind || ""),
          };
        })
        .filter((c) => c.label && Number.isFinite(c.amount));
      try {
        await apiFetch(base, "deals", {
          method: "POST",
          body: JSON.stringify({
            id: String(fd.get("id") || "") || undefined,
            user_id: fd.get("user_id"),
            product_id: fd.get("product_id"),
            product_title: fd.get("product_title") || fd.get("product_id"),
            unit_price: Number(fd.get("unit_price")),
            planned_qty: Number(fd.get("planned_qty")),
            artist_share_pct: Number(fd.get("artist_share_pct")),
            vat_rate_pct: Number(fd.get("vat_rate_pct")),
            notes: fd.get("notes") || "",
            costs,
          }),
        });
        msg.textContent = "Deal salvato.";
        await renderAdmin(user);
      } catch (err) {
        msg.textContent = err instanceof Error ? err.message : "Errore";
      }
    });
    mount.append(dealForm);

    if (deals.length) {
      const list = el("section", "account-card");
      list.append(el("h3", "", "Deal esistenti"));
      for (const s of deals) {
        const artist = artists.find((a) => a.id === s.deal.user_id);
        const wrap = el("div", "account-deal-wrap");
        wrap.append(
          el("p", "account-meta", `Artista: ${artist?.name || artist?.email || s.deal.user_id}`),
          dealBlock(s),
        );
        const actions = el("div", "account-actions");
        const editBtn = el("button", "", "Modifica") as HTMLButtonElement;
        editBtn.type = "button";
        editBtn.addEventListener("click", () => {
          (dealForm.elements.namedItem("id") as HTMLInputElement).value = s.deal.id;
          (dealForm.elements.namedItem("user_id") as HTMLSelectElement).value = s.deal.user_id;
          (dealForm.elements.namedItem("product_id") as HTMLInputElement).value = s.deal.product_id;
          (dealForm.elements.namedItem("product_title") as HTMLInputElement).value =
            s.deal.product_title;
          (dealForm.elements.namedItem("unit_price") as HTMLInputElement).value = String(
            s.deal.unit_price,
          );
          (dealForm.elements.namedItem("planned_qty") as HTMLInputElement).value = String(
            s.deal.planned_qty,
          );
          (dealForm.elements.namedItem("artist_share_pct") as HTMLInputElement).value = String(
            s.deal.artist_share_pct,
          );
          (dealForm.elements.namedItem("vat_rate_pct") as HTMLInputElement).value = String(
            s.deal.vat_rate_pct,
          );
          (dealForm.elements.namedItem("notes") as HTMLInputElement).value = s.deal.notes || "";
          (dealForm.elements.namedItem("costs") as HTMLTextAreaElement).value = s.deal.costs
            .map((c) => `${c.label}|${c.amount}|${c.per_unit ? "pezzo" : "fisso"}`)
            .join("\n");
          dealForm.scrollIntoView({ behavior: "smooth" });
        });
        const delDeal = el("button", "account-linkish", "Elimina") as HTMLButtonElement;
        delDeal.type = "button";
        delDeal.addEventListener("click", async () => {
          if (!confirm("Eliminare questo deal?")) return;
          await apiFetch(base, `deals?id=${encodeURIComponent(s.deal.id)}`, { method: "DELETE" });
          await renderAdmin(user);
        });
        actions.append(editBtn, delDeal);
        wrap.append(actions);
        list.append(wrap);
      }
      mount.append(list);
    }
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
