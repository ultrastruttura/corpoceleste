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
    app!.innerHTML = "";
    app!.append(
      el(
        "p",
        "lede",
        "Inserisci l’email con cui sei stato invitato. Riceverai un link di accesso.",
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
    const who = el("p", "account-who", `${user.name || user.email} · ${user.role === "admin" ? "admin" : "artista"}`);
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
        `${s.soldQty}/${s.deal.planned_qty} pezzi · ${s.deal.artist_share_pct}% artista · IVA ${s.deal.vat_rate_pct}%`,
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
      box.append(el("h4", "", "Vendite"), ul);
    }
    return box;
  }

  async function renderArtist(user: User) {
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

  async function renderAdmin(user: User) {
    app!.innerHTML = "";
    app!.append(toolbar(user), el("h2", "", "Gestione"));

    const usersData = (await apiFetch(base, "users")) as { users: User[] };
    const dealsData = (await apiFetch(base, "deals")) as { deals: DealSummary[] };
    const artists = usersData.users.filter((u) => u.role === "artist");

    // Invite
    const invite = el("form", "account-form account-panel");
    invite.innerHTML = `
      <h3>Invita artista</h3>
      <label><span>Nome</span><input name="name" required /></label>
      <label><span>Email</span><input type="email" name="email" required /></label>
      <label><span>Slug Tina (opz.)</span><input name="artist_slug" placeholder="es. nome-artista" /></label>
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
        } else {
          setMsg(msg, data.message || (data.emailed ? "Invito inviato." : "Utente creato."));
        }
        await renderAdmin(user);
      } catch (err) {
        setMsg(msg, err instanceof Error ? err.message : "Errore");
      }
    });
    app!.append(invite);

    // Users list
    if (artists.length) {
      const sec = el("section", "account-panel");
      sec.append(el("h3", "", "Artisti"));
      const ul = el("ul", "account-list");
      for (const a of artists) {
        const li = el("li", "account-row");
        li.append(document.createTextNode(`${a.name} <${a.email}>`));
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
      sec.append(ul);
      app!.append(sec);
    }

    // New / edit deal
    const dealForm = el("form", "account-form account-panel");
    const artistOpts = artists
      .map((a) => `<option value="${a.id}">${a.name || a.email}</option>`)
      .join("");
    dealForm.innerHTML = `
      <h3>Deal edizione</h3>
      <label><span>Artista</span><select name="user_id" required>${artistOpts}</select></label>
      <label><span>Product id (Tina)</span><input name="product_id" required placeholder="slug prodotto" /></label>
      <label><span>Titolo</span><input name="product_title" /></label>
      <label><span>Prezzo unitario €</span><input name="unit_price" type="number" step="0.01" min="0" required /></label>
      <label><span>Pezzi previsti</span><input name="planned_qty" type="number" min="1" value="50" required /></label>
      <label><span>% artista</span><input name="artist_share_pct" type="number" min="0" max="100" value="40" required /></label>
      <label><span>IVA %</span><input name="vat_rate_pct" type="number" min="0" value="22" required /></label>
      <label><span>Note</span><input name="notes" /></label>
      <fieldset class="account-costs">
        <legend>Costi (label|importo|fisso o pezzo)</legend>
        <p class="account-hint">Una riga per costo, es. <code>Maglie|8.5|pezzo</code> oppure <code>Affitto|120|fisso</code></p>
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
    app!.append(dealForm);

    // Deals list + actions
    for (const s of dealsData.deals) {
      const wrap = el("section", "account-panel");
      wrap.append(dealBlock(s));
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

      const bank = el("form", "account-inline-form");
      bank.innerHTML = `
        <span>Conferma bonifico</span>
        <input name="qty" type="number" min="1" value="1" required style="width:4rem" />
        <input name="size" placeholder="taglia" style="width:5rem" />
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

      const delDeal = el("button", "account-linkish", "Elimina deal") as HTMLButtonElement;
      delDeal.type = "button";
      delDeal.addEventListener("click", async () => {
        if (!confirm("Eliminare questo deal?")) return;
        await apiFetch(base, `deals?id=${encodeURIComponent(s.deal.id)}`, { method: "DELETE" });
        await renderAdmin(user);
      });

      actions.append(editBtn, bank, delDeal);
      wrap.append(actions);
      app!.append(wrap);
    }

    // Settlements overview per artist
    if (artists.length) {
      const sec = el("section", "account-panel");
      sec.append(el("h3", "", "Saldi per artista"));
      for (const a of artists) {
        const dash = (await apiFetch(
          base,
          `settle?dashboard=1&user_id=${encodeURIComponent(a.id)}`,
        )) as Dashboard;
        const block = el("div", "account-settle-block");
        block.append(
          el("h4", "", a.name || a.email),
          metrics([
            ["Dovuto", money(dash.artistDueTotal)],
            ["Saldato", money(dash.paidTotal)],
            ["Residuo", money(dash.outstanding)],
          ]),
        );
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const settle = el("form", "account-inline-form");
        settle.innerHTML = `
          <span>Salda mese</span>
          <input name="period" value="${period}" required pattern="\\d{4}-\\d{2}" style="width:6rem" />
          <input name="amount" type="number" step="0.01" value="${Math.max(0, dash.outstanding).toFixed(2)}" required style="width:6rem" />
          <button type="submit">Segna saldato</button>
        `;
        settle.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(settle);
          await apiFetch(base, "settle", {
            method: "POST",
            body: JSON.stringify({
              user_id: a.id,
              period: fd.get("period"),
              amount: Number(fd.get("amount")),
              note: "saldo mensile",
            }),
          });
          await renderAdmin(user);
        });
        block.append(settle);
        if (dash.settlements.length) {
          const ul = el("ul", "account-list");
          for (const st of dash.settlements) {
            const li = el("li", "account-row");
            li.append(
              document.createTextNode(
                `${st.period}: ${money(st.amount)} · ${st.note || ""}`,
              ),
            );
            const undo = el("button", "account-linkish", "Annulla") as HTMLButtonElement;
            undo.type = "button";
            undo.addEventListener("click", async () => {
              await apiFetch(base, `settle?id=${encodeURIComponent(st.id)}`, {
                method: "DELETE",
              });
              await renderAdmin(user);
            });
            li.append(undo);
            ul.append(li);
          }
          block.append(ul);
        }
        sec.append(block);
      }
      app!.append(sec);
    }
  }
}
