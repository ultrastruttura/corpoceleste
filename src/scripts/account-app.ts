import {
  apiFetch,
  apiRoot,
  clearSession,
  el,
  getSession,
  money,
  setMsg,
  setSession,
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
    external_id?: string | null;
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

type PeriodFilter = { month?: string; from?: string; to?: string };

function euroLocal(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Month key YYYY-MM from settlement (supports legacy period=YYYY-MM). */
function settlementMonth(s: { period: string; paid_at: string }) {
  if (/^\d{4}-\d{2}-\d{2}/.test(s.period)) return s.period.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(s.period)) return s.period;
  return s.paid_at.slice(0, 7);
}

function settlementDay(s: { period: string; paid_at: string }) {
  if (/^\d{4}-\d{2}-\d{2}/.test(s.period)) return s.period.slice(0, 10);
  return s.paid_at.slice(0, 10);
}

function formatMonthLabel(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number);
  if (!y || !m) return yyyyMm;
  return new Date(y, m - 1, 1).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

function formatDayLabel(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  if (!y || !m || !d) return isoDay;
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function inRange(isoDay: string, filter: PeriodFilter) {
  const day = isoDay.slice(0, 10);
  if (filter.month) return day.startsWith(filter.month);
  if (filter.from && day < filter.from) return false;
  if (filter.to && day > filter.to) return false;
  return true;
}

function shareFromSales(deal: DealSummary["deal"], sales: DealSummary["sales"]) {
  const planned = Math.max(1, Math.floor(deal.planned_qty));
  const soldQty = sales.reduce((s, x) => s + x.qty, 0);
  const gross = euroLocal(sales.reduce((s, x) => s + x.qty * x.unit_price, 0));
  const vatFactor = deal.vat_rate_pct / (100 + deal.vat_rate_pct);
  const vat = euroLocal(gross * vatFactor);
  let variable = 0;
  let fixedTotal = 0;
  for (const c of deal.costs) {
    if (c.per_unit) variable += c.amount * soldQty;
    else fixedTotal += c.amount;
  }
  variable = euroLocal(variable);
  fixedTotal = euroLocal(fixedTotal);
  const fixedAllocated = euroLocal((fixedTotal / planned) * soldQty);
  const costsTotal = euroLocal(variable + fixedAllocated);
  const profit = euroLocal(gross - vat - costsTotal);
  const artistDue = euroLocal((profit * deal.artist_share_pct) / 100);
  const studioShare = euroLocal(profit - artistDue);
  return { soldQty, gross, vat, costsTotal, profit, artistDue, studioShare };
}

function filterDashboard(dash: Dashboard, filter: PeriodFilter): Dashboard {
  if (!filter.month && !filter.from && !filter.to) return dash;
  const deals = dash.deals.map((d) => {
    const sales = d.sales.filter((s) => inRange(s.sold_at, filter));
    return { ...d, sales, ...shareFromSales(d.deal, sales) };
  });
  const settlements = dash.settlements.filter((s) => {
    if (filter.month) return settlementMonth(s) === filter.month;
    return inRange(settlementDay(s), filter);
  });
  const artistDueTotal = euroLocal(deals.reduce((s, x) => s + x.artistDue, 0));
  const paidTotal = euroLocal(settlements.reduce((s, x) => s + x.amount, 0));
  return {
    deals,
    settlements,
    artistDueTotal,
    paidTotal,
    outstanding: euroLocal(artistDueTotal - paidTotal),
  };
}

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
        "Inserisci l’email con cui sei stato invitato. In produzione ricevi un link monouso; in locale (vercel dev) entri subito.",
      ),
    );
    const form = el("form", "account-form account-login");
    form.innerHTML = `
      <label class="account-login-field">
        <span>Email</span>
        <input type="email" name="email" required autocomplete="email" placeholder="nome@email.com" />
      </label>
      <button class="btn" type="submit">Entra</button>
      <p class="account-msg" data-msg hidden></p>
    `;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector<HTMLElement>("[data-msg]")!;
      const btn = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
      msg.hidden = false;
      msg.textContent = "Accesso…";
      btn.disabled = true;
      const email = new FormData(form).get("email") as string;
      try {
        const data = (await apiFetch(base, "auth", {
          method: "POST",
          body: JSON.stringify({ action: "login", email }),
        })) as {
          message?: string;
          emailed?: boolean;
          instant?: boolean;
          session?: string;
          user?: User;
          devLink?: string;
        };
        if (data.instant && data.session && data.user) {
          setSession(data.session);
          if (data.user.role === "admin") await renderAdmin(data.user);
          else await renderArtist(data.user);
          return;
        }
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
    const box = el("div", "account-metrics");
    for (const [k, v] of rows) {
      const row = el("div", "account-metric");
      row.append(el("span", "account-metric__label", k), el("span", "account-metric__value", v));
      box.append(row);
    }
    return box;
  }

  function settlementsByMonth(
    list: Dashboard["settlements"],
    opts?: { onUndo?: (id: string) => void },
  ) {
    const host = el("div", "account-settlements");
    const groups = new Map<string, Dashboard["settlements"]>();
    for (const s of list) {
      const key = settlementMonth(s);
      const arr = groups.get(key) || [];
      arr.push(s);
      groups.set(key, arr);
    }
    const months = [...groups.keys()].sort((a, b) => b.localeCompare(a));
    for (const month of months) {
      const items = (groups.get(month) || []).slice().sort((a, b) =>
        settlementDay(b).localeCompare(settlementDay(a)),
      );
      const monthTotal = euroLocal(items.reduce((sum, x) => sum + x.amount, 0));
      const head = el("div", "account-settlements__month");
      head.append(
        el("h4", "", formatMonthLabel(month)),
        el("span", "account-settlements__total", money(monthTotal)),
      );
      host.append(head);
      const ul = el("ul", "account-list");
      for (const s of items) {
        const li = el("li", "account-row");
        li.append(
          document.createTextNode(
            `${formatDayLabel(settlementDay(s))} · ${money(s.amount)}${s.note ? ` · ${s.note}` : ""}`,
          ),
        );
        if (opts?.onUndo) {
          const undo = el("button", "account-linkish", "Annulla") as HTMLButtonElement;
          undo.type = "button";
          undo.addEventListener("click", () => opts.onUndo!(s.id));
          li.append(undo);
        }
        ul.append(li);
      }
      host.append(ul);
    }
    return host;
  }

  function periodFilterBar(initial: PeriodFilter, onChange: (next: PeriodFilter) => void) {
    const bar = el("div", "account-period-filter");
    bar.innerHTML = `
      <label>Mese
        <input type="month" name="month" value="${initial.month || ""}" />
      </label>
      <label>Da
        <input type="date" name="from" value="${initial.from || ""}" />
      </label>
      <label>A
        <input type="date" name="to" value="${initial.to || ""}" />
      </label>
      <button type="button" class="btn" data-apply>Applica</button>
      <button type="button" class="account-linkish" data-clear>Tutto</button>
      <button type="button" class="account-linkish" data-today>Mese corrente</button>
    `;
    const month = () => bar.querySelector<HTMLInputElement>('[name="month"]')!;
    const from = () => bar.querySelector<HTMLInputElement>('[name="from"]')!;
    const to = () => bar.querySelector<HTMLInputElement>('[name="to"]')!;
    month().addEventListener("change", () => {
      if (month().value) {
        from().value = "";
        to().value = "";
      }
    });
    const clearMonthIfRange = () => {
      if (from().value || to().value) month().value = "";
    };
    from().addEventListener("change", clearMonthIfRange);
    to().addEventListener("change", clearMonthIfRange);
    bar.querySelector("[data-apply]")!.addEventListener("click", () => {
      onChange({
        month: month().value || undefined,
        from: from().value || undefined,
        to: to().value || undefined,
      });
    });
    bar.querySelector("[data-clear]")!.addEventListener("click", () => {
      month().value = "";
      from().value = "";
      to().value = "";
      onChange({});
    });
    bar.querySelector("[data-today]")!.addEventListener("click", () => {
      const m = currentMonth();
      month().value = m;
      from().value = "";
      to().value = "";
      onChange({ month: m });
    });
    return bar;
  }

  function orderRef(sale: DealSummary["sales"][number]) {
    if (sale.external_id) {
      const head = sale.external_id.split(":")[0];
      return head.length > 14 ? `${head.slice(0, 12)}…` : head;
    }
    return sale.id.replace(/^sale_/, "").slice(0, 10);
  }

  function sourceLabel(source: string) {
    if (source === "paypal") return "PayPal";
    if (source === "bank") return "Bonifico";
    if (source === "manual") return "Manuale";
    return source;
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
    void showArtist;

    const orders = el("div", "account-sales");
    orders.append(el("h4", "", "Ordini"));
    if (!s.sales.length) {
      orders.append(
        el(
          "p",
          "account-lede",
          "Nessun ordine ancora. PayPal entra da solo; i bonifici si registrano con «Registra» qui sotto.",
        ),
      );
    } else {
      const table = el("div", "account-table account-sales-table");
      const head = el("div", "account-table__head");
      for (const label of ["Data", "N°", "Qtà", "Taglia", "Totale", "Fonte"]) {
        head.append(el("span", "", label));
      }
      table.append(head);
      for (const sale of s.sales.slice(0, 80)) {
        const row = el("div", "account-table__row");
        const total = euroLocal(sale.qty * sale.unit_price);
        const ref = el("span", "account-table__num", orderRef(sale));
        ref.title = sale.external_id || sale.id;
        row.append(
          el("span", "", sale.sold_at.slice(0, 10)),
          ref,
          el("span", "account-table__num", String(sale.qty)),
          el("span", "", sale.size || "—"),
          el("span", "account-table__num", money(total)),
          el("span", "", sourceLabel(sale.source)),
        );
        table.append(row);
      }
      orders.append(table);
    }
    box.append(orders);

    if (s.sales.length) {
      const rows: Array<[string, string]> = [
        ["Ricavi lordi", money(s.gross)],
        ["IVA", money(s.vat)],
        ["Costi", money(s.costsTotal)],
        ["Utile", money(s.profit)],
        ["Quota artista", money(s.artistDue)],
        ["Quota studio", money(s.studioShare)],
      ];
      box.append(metrics(rows));
    }

    if (s.deal.costs.length) {
      const perUnit = s.deal.costs
        .filter((c) => c.per_unit)
        .reduce((sum, c) => sum + c.amount, 0);
      if (perUnit > 0) {
        box.append(el("p", "account-meta", `Costo per pezzo: ${money(perUnit)}`));
      }
    }
    return box;
  }

  async function renderArtist(user: User) {
    root!.classList.remove("account-page--admin");
    app!.innerHTML = "";
    app!.append(toolbar(user), el("h2", "", "Il tuo prospetto"));
    const dashFull = (await apiFetch(base, "settle?dashboard=1")) as Dashboard;
    let filter: PeriodFilter = {};
    const summaryHost = el("div", "");
    const dealsHost = el("div", "");
    const paint = () => {
      const dash = filterDashboard(dashFull, filter);
      summaryHost.replaceChildren(
        metrics([
          ["Lordo da fatturare", money(dash.artistDueTotal)],
          ["Già saldato", money(dash.paidTotal)],
          ["Ancora dovuto", money(dash.outstanding)],
        ]),
      );
      dealsHost.replaceChildren();
      if (!dash.deals.length) {
        dealsHost.append(el("p", "lede", "Nessun deal collegato ancora."));
      } else {
        for (const d of dash.deals) dealsHost.append(dealBlock(d, false));
      }
      if (dash.settlements.length) {
        dealsHost.append(el("h2", "", "Saldi"));
        dealsHost.append(settlementsByMonth(dash.settlements));
      }
    };
    app!.append(
      periodFilterBar(filter, (next) => {
        filter = next;
        paint();
      }),
      summaryHost,
      dealsHost,
    );
    paint();
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
        <span class="account-table__num">${dealCount}</span>
        <span class="account-table__num">${money(dash.artistDueTotal)}</span>
        <span class="account-table__num account-table__emphasis">${money(dash.outstanding)}</span>
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

    const dashFull = (await apiFetch(
      base,
      `settle?dashboard=1&user_id=${encodeURIComponent(artist.id)}`,
    )) as Dashboard;

    let filter: PeriodFilter = {};
    const summary = el("section", "account-card");
    summary.append(el("h3", "", "Riepilogo conti"));
    const summaryBody = el("div", "");
    summary.append(
      periodFilterBar(filter, (next) => {
        filter = next;
        paintSummary();
      }),
      summaryBody,
    );
    mount.append(summary);

    const paintSummary = () => {
      const dash = filterDashboard(dashFull, filter);
      summaryBody.replaceChildren(
        metrics([
          ["Lordo da fatturare", money(dash.artistDueTotal)],
          ["Già saldato", money(dash.paidTotal)],
          ["Residuo", money(dash.outstanding)],
        ]),
      );
    };
    paintSummary();

    const deals = allDeals.filter((d) => d.deal.user_id === artist.id);
    const orders = el("section", "account-card");
    orders.append(el("h3", "", "Ordini e deal"));
    if (!deals.length) {
      orders.append(el("p", "account-lede", "Nessun deal ancora. Creane uno sotto in Deal."));
    } else {
      for (const s of deals) {
        const wrap = el("div", "account-deal-wrap");
        wrap.append(dealBlock(s, false));

        const bank = el("form", "account-action-form");
        bank.innerHTML = `
          <p class="account-action-form__title">Conferma bonifico</p>
          <div class="account-action-form__row">
            <label class="account-action-form__field account-action-form__field--qty">
              <span>Pezzi</span>
              <input name="qty" type="number" min="1" value="1" required />
            </label>
            <label class="account-action-form__field account-action-form__field--size">
              <span>Taglia</span>
              <input name="size" placeholder="S / M / L / XL" list="cc-sizes" />
            </label>
            <div class="account-action-form__submit">
              <span class="account-action-form__ghost" aria-hidden="true">Salva</span>
              <button class="account-action-form__btn" type="submit">Registra</button>
            </div>
          </div>
          <p class="account-action-form__hint">Vendita pagata con bonifico (non PayPal). Taglia opzionale per lo storico (S–XL).</p>
        `;
        bank.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(bank);
          await apiFetch(base, "sales", {
            method: "POST",
            body: JSON.stringify({
              deal_id: s.deal.id,
              qty: Number(fd.get("qty")),
              size: String(fd.get("size") || "").trim(),
              source: "bank",
              external_id: `bank-${Date.now()}`,
            }),
          });
          await renderAdmin(user);
        });
        wrap.append(bank);

        const actions = el("div", "account-actions");
        const editBtn = el("button", "account-linkish", "Modifica deal") as HTMLButtonElement;
        editBtn.type = "button";
        editBtn.addEventListener("click", () => {
          fillDealForm(dealForm, s);
          dealForm.scrollIntoView({ behavior: "smooth" });
        });
        const delDeal = el("button", "account-linkish", "Elimina deal") as HTMLButtonElement;
        delDeal.type = "button";
        delDeal.addEventListener("click", async () => {
          if (!confirm("Eliminare questo deal?")) return;
          await apiFetch(base, `deals?id=${encodeURIComponent(s.deal.id)}`, { method: "DELETE" });
          await renderAdmin(user);
        });
        actions.append(editBtn, delDeal);
        wrap.append(actions);
        orders.append(wrap);
      }
      if (!document.getElementById("cc-sizes")) {
        const dl = document.createElement("datalist");
        dl.id = "cc-sizes";
        for (const size of ["S", "M", "L", "XL"]) {
          const opt = document.createElement("option");
          opt.value = size;
          dl.append(opt);
        }
        document.body.append(dl);
      }
    }
    mount.append(orders);

    const dealSection = el("section", "account-card");
    dealSection.append(el("h3", "", "Deal"));
    dealSection.append(el("p", "account-lede", "Prezzo al cliente, costo per pezzo, percentuale artista."));
    const dealForm = buildDealForm(artist.id);
    dealForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(dealForm);
      const msg = dealForm.querySelector<HTMLElement>("[data-msg]")!;
      msg.hidden = false;
      const costPerUnit = Number(fd.get("cost_per_unit") || 0);
      const costs =
        Number.isFinite(costPerUnit) && costPerUnit > 0
          ? [{ label: "Costo per pezzo", amount: costPerUnit, per_unit: true }]
          : [];
      try {
        await apiFetch(base, "deals", {
          method: "POST",
          body: JSON.stringify({
            id: String(fd.get("id") || "") || undefined,
            user_id: artist.id,
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
    dealSection.append(dealForm);
    mount.append(dealSection);

    const conti = el("section", "account-card");
    conti.append(el("h3", "", "Saldi mensili"));
    const settle = el("form", "account-action-form");
    settle.innerHTML = `
      <div class="account-action-form__row">
        <label class="account-action-form__field account-action-form__field--month">
          <span>Data saldo</span>
          <input name="period" type="date" value="${todayISO()}" required />
        </label>
        <label class="account-action-form__field account-action-form__field--amount">
          <span>Importo €</span>
          <input name="amount" type="number" step="0.01" value="${Math.max(0, dashFull.outstanding).toFixed(2)}" required />
        </label>
        <div class="account-action-form__submit">
          <span class="account-action-form__ghost" aria-hidden="true">Salva</span>
          <button class="account-action-form__btn" type="submit">Salva</button>
        </div>
      </div>
      <button type="button" class="account-action-form__today" data-today-month>Oggi</button>
    `;
    settle.querySelector("[data-today-month]")!.addEventListener("click", () => {
      settle.querySelector<HTMLInputElement>('[name="period"]')!.value = todayISO();
    });
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

    if (dashFull.settlements.length) {
      conti.append(
        settlementsByMonth(dashFull.settlements, {
          onUndo: async (id) => {
            await apiFetch(base, `settle?id=${encodeURIComponent(id)}`, { method: "DELETE" });
            await renderAdmin(user);
          },
        }),
      );
    } else {
      conti.append(el("p", "account-lede", "Nessun saldo registrato."));
    }
    mount.append(conti);
  }

  function buildDealForm(_artistId: string) {
    const dealForm = el("form", "account-stack-form") as HTMLFormElement;
    dealForm.innerHTML = `
      <label class="account-stack-form__field">
        <span>Product id (Tina)</span>
        <input name="product_id" required placeholder="slug prodotto" />
      </label>
      <label class="account-stack-form__field">
        <span>Titolo</span>
        <input name="product_title" />
      </label>
      <div class="account-stack-form__row">
        <label class="account-stack-form__field">
          <span>Prezzo al cliente €</span>
          <input name="unit_price" type="number" step="0.01" min="0" required />
        </label>
        <label class="account-stack-form__field">
          <span>Pezzi previsti</span>
          <input name="planned_qty" type="number" min="1" value="50" required />
        </label>
      </div>
      <div class="account-stack-form__row">
        <label class="account-stack-form__field">
          <span>% artista</span>
          <input name="artist_share_pct" type="number" min="0" max="100" value="40" required />
        </label>
        <label class="account-stack-form__field">
          <span>IVA %</span>
          <input name="vat_rate_pct" type="number" min="0" value="22" required />
        </label>
      </div>
      <label class="account-stack-form__field">
        <span>Note</span>
        <input name="notes" />
      </label>
      <label class="account-stack-form__field">
        <span>Costo per pezzo €</span>
        <input name="cost_per_unit" type="number" step="0.01" min="0" value="0" />
      </label>
      <input type="hidden" name="id" value="" />
      <button class="account-action-form__btn" type="submit">Salva deal</button>
      <p class="account-msg" data-msg hidden></p>
    `;
    return dealForm;
  }

  function fillDealForm(dealForm: HTMLFormElement, s: DealSummary) {
    (dealForm.elements.namedItem("id") as HTMLInputElement).value = s.deal.id;
    (dealForm.elements.namedItem("product_id") as HTMLInputElement).value = s.deal.product_id;
    (dealForm.elements.namedItem("product_title") as HTMLInputElement).value = s.deal.product_title;
    (dealForm.elements.namedItem("unit_price") as HTMLInputElement).value = String(s.deal.unit_price);
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
    const perUnit = s.deal.costs
      .filter((c) => c.per_unit)
      .reduce((sum, c) => sum + c.amount, 0);
    (dealForm.elements.namedItem("cost_per_unit") as HTMLInputElement).value = String(perUnit || 0);
  }

  async function renderAdminSettings(
    mount: HTMLElement,
    user: User,
    artists: User[],
    _deals: DealSummary[],
  ) {
    mount.append(
      el("h2", "account-section-title", "Impostazioni"),
      el("p", "account-lede", "Inviti e anagrafica artisti. I deal si gestiscono dalla scheda artista."),
    );

    const inviteCard = el("section", "account-card");
    inviteCard.append(el("h3", "", "Invita artista"));
    const invite = el("form", "account-stack-form");
    invite.innerHTML = `
      <div class="account-stack-form__row">
        <label class="account-stack-form__field">
          <span>Nome</span>
          <input name="name" required />
        </label>
        <label class="account-stack-form__field">
          <span>Email</span>
          <input type="email" name="email" required />
        </label>
      </div>
      <label class="account-stack-form__field">
        <span>Slug artista sul sito (opz.)</span>
        <input name="artist_slug" placeholder="es. ruco" />
      </label>
      <p class="account-lede">Stesso slug della cartella artista in Tina (opzionale).</p>
      <button class="account-action-form__btn" type="submit">Invia invito</button>
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
    inviteCard.append(invite);
    mount.append(inviteCard);

    const roster = el("section", "account-card");
    roster.append(el("h3", "", "Elenco artisti"));
    if (!artists.length) {
      roster.append(el("p", "account-lede", "Nessun artista."));
    } else {
      const table = el("div", "account-table account-table--roster");
      const head = el("div", "account-table__head");
      head.append(el("span", "", "Artista"), el("span", "", ""));
      table.append(head);
      for (const a of artists) {
        const row = el("div", "account-table__row account-table__row--roster");
        const open = el("button", "account-table__open") as HTMLButtonElement;
        open.type = "button";
        const primary = el("span", "account-table__primary");
        primary.append(el("strong", "", a.name || a.email), el("small", "", a.email));
        open.append(primary);
        open.addEventListener("click", () => {
          setAdminRoute({ name: "artist", id: a.id });
        });
        const del = el("button", "account-linkish", "Rimuovi") as HTMLButtonElement;
        del.type = "button";
        del.addEventListener("click", async () => {
          if (!confirm(`Rimuovere ${a.email}?`)) return;
          await apiFetch(base, `users?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
          await renderAdmin(user);
        });
        row.append(open, del);
        table.append(row);
      }
      roster.append(table);
    }
    mount.append(roster);
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
