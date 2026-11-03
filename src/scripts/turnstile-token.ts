/** Invisible Cloudflare Turnstile: form POST + JSON API tokens. */

declare global {
  interface Window {
    turnstile?: {
      ready: (cb: () => void) => void;
      render: (
        el: string | HTMLElement,
        opts: {
          sitekey: string;
          size?: string;
          appearance?: string;
          execution?: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      execute: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

function siteKey() {
  return String(document.documentElement.dataset.turnstile || "").trim();
}

function waitForTurnstile(): Promise<NonNullable<Window["turnstile"]>> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.turnstile) {
        window.turnstile.ready(() => resolve(window.turnstile!));
        return;
      }
      if (Date.now() - start > 12_000) {
        reject(new Error("Turnstile unavailable"));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/** Invisible widgets on every form that has [data-turnstile-slot] (newsletter, contatti, …). */
export function bindInvisibleTurnstileForms() {
  const key = siteKey();
  if (!key) return;

  void waitForTurnstile()
    .then((ts) => {
      document.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
        const slot = form.querySelector<HTMLElement>("[data-turnstile-slot]");
        if (!slot || slot.dataset.tsBound === "1") return;
        slot.dataset.tsBound = "1";

        let passing = false;
        const widgetId = ts.render(slot, {
          sitekey: key,
          size: "invisible",
          appearance: "execute",
          execution: "execute",
          callback: (token) => {
            let input = form.querySelector<HTMLInputElement>(
              'input[name="cf-turnstile-response"]',
            );
            if (!input) {
              input = document.createElement("input");
              input.type = "hidden";
              input.name = "cf-turnstile-response";
              form.append(input);
            }
            input.value = token;
            passing = true;
            HTMLFormElement.prototype.submit.call(form);
          },
          "error-callback": () => {
            passing = false;
            window.alert("Verifica di sicurezza non riuscita. Riprova.");
          },
        });

        form.addEventListener("submit", (e) => {
          if (passing) {
            passing = false;
            return;
          }
          e.preventDefault();
          try {
            ts.reset(widgetId);
            ts.execute(widgetId);
          } catch {
            window.alert("Verifica di sicurezza non disponibile. Riprova tra poco.");
          }
        });
      });
    })
    .catch(() => {
      /* site key set but script blocked — forms still submit; server fail-closed on Vercel */
    });
}

let apiWidgetId: string | null = null;
let apiChain: Promise<unknown> = Promise.resolve();
let apiPending: {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
} | null = null;

function ensureApiWidget(): Promise<string> {
  const key = siteKey();
  if (!key) return Promise.resolve("");

  return waitForTurnstile().then((ts) => {
    let el = document.getElementById("cc-turnstile-api");
    if (!el) {
      el = document.createElement("div");
      el.id = "cc-turnstile-api";
      el.setAttribute("aria-hidden", "true");
      el.style.cssText =
        "position:absolute;left:0;top:0;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);pointer-events:none;";
      document.body.append(el);
    }
    if (apiWidgetId == null) {
      apiWidgetId = ts.render(el, {
        sitekey: key,
        size: "invisible",
        appearance: "execute",
        execution: "execute",
        callback: (token) => {
          if (!apiPending) return;
          clearTimeout(apiPending.timer);
          const p = apiPending;
          apiPending = null;
          p.resolve(token);
        },
        "error-callback": () => {
          if (!apiPending) return;
          clearTimeout(apiPending.timer);
          const p = apiPending;
          apiPending = null;
          p.reject(new Error("Turnstile error"));
        },
        "expired-callback": () => {
          if (!apiPending) return;
          clearTimeout(apiPending.timer);
          const p = apiPending;
          apiPending = null;
          p.reject(new Error("Turnstile expired"));
        },
      });
    }
    return apiWidgetId;
  });
}

/** Resolve one unused token for JSON APIs (serialized). */
export function getTurnstileToken(): Promise<string> {
  if (!siteKey()) return Promise.resolve("");

  const next = apiChain.then(async () => {
    const id = await ensureApiWidget();
    if (!id || !window.turnstile) return "";

    return new Promise<string>((resolve, reject) => {
      apiPending = {
        resolve,
        reject,
        timer: setTimeout(() => {
          if (!apiPending) return;
          apiPending = null;
          reject(new Error("Turnstile timeout"));
        }, 15_000),
      };
      try {
        window.turnstile.reset(id);
        window.turnstile.execute(id);
      } catch (err) {
        clearTimeout(apiPending.timer);
        apiPending = null;
        reject(err instanceof Error ? err : new Error("Turnstile execute failed"));
      }
    });
  });

  apiChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
