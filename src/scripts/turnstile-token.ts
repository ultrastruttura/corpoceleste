/** Fresh Cloudflare Turnstile token for JSON APIs (single-use). */

declare global {
  interface Window {
    turnstile?: {
      ready: (cb: () => void) => void;
      render: (
        el: string | HTMLElement,
        opts: {
          sitekey: string;
          size?: string;
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

let widgetId: string | null = null;
let chain: Promise<unknown> = Promise.resolve();
let pending: {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
} | null = null;

function siteKeyMissing() {
  return !siteKey();
}

function ensureWidget(): Promise<string> {
  const key = siteKey();
  if (!key) return Promise.resolve("");

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryRender = () => {
      if (!window.turnstile) {
        if (Date.now() - start > 12_000) {
          reject(new Error("Turnstile unavailable"));
          return;
        }
        requestAnimationFrame(tryRender);
        return;
      }
      window.turnstile.ready(() => {
        try {
          let el = document.getElementById("cc-turnstile-api");
          if (!el) {
            el = document.createElement("div");
            el.id = "cc-turnstile-api";
            el.setAttribute("aria-hidden", "true");
            el.style.cssText =
              "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);";
            document.body.append(el);
          }
          if (widgetId == null) {
            widgetId = window.turnstile!.render(el, {
              sitekey: key,
              size: "invisible",
              callback: (token) => {
                if (!pending) return;
                clearTimeout(pending.timer);
                const p = pending;
                pending = null;
                p.resolve(token);
              },
              "error-callback": () => {
                if (!pending) return;
                clearTimeout(pending.timer);
                const p = pending;
                pending = null;
                p.reject(new Error("Turnstile error"));
              },
              "expired-callback": () => {
                if (!pending) return;
                clearTimeout(pending.timer);
                const p = pending;
                pending = null;
                p.reject(new Error("Turnstile expired"));
              },
            });
          }
          resolve(widgetId);
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Turnstile render failed"));
        }
      });
    };
    tryRender();
  });
}

/** Resolve one unused token (serialized; resets/executes the invisible widget). */
export function getTurnstileToken(): Promise<string> {
  if (siteKeyMissing()) return Promise.resolve("");

  const next = chain.then(async () => {
    const id = await ensureWidget();
    if (!id || !window.turnstile) return "";

    return new Promise<string>((resolve, reject) => {
      pending = {
        resolve,
        reject,
        timer: setTimeout(() => {
          if (!pending) return;
          pending = null;
          reject(new Error("Turnstile timeout"));
        }, 15_000),
      };
      try {
        window.turnstile!.reset(id);
        window.turnstile!.execute(id);
      } catch (err) {
        clearTimeout(pending.timer);
        pending = null;
        reject(err instanceof Error ? err : new Error("Turnstile execute failed"));
      }
    });
  });

  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
