/** Product gallery — static file so CSP (no unsafe-inline) can load it. */
(function () {
  var root = document.querySelector("[data-gallery]");
  var main = document.querySelector("[data-product-main]");
  var indexEl = document.querySelector("[data-gallery-index]");
  var thumbs = Array.prototype.slice.call(
    document.querySelectorAll("[data-product-thumb]"),
  );
  if (!main || thumbs.length < 2) return;

  var i = 0;
  var total = thumbs.length;

  function show(next) {
    i = ((next % total) + total) % total;
    var btn = thumbs[i];
    var src = btn.getAttribute("data-src") || btn.getAttribute("data-jpg");
    if (!src) return;
    main.src = src;
    var alt = btn.getAttribute("data-alt");
    if (alt) main.alt = alt;
    thumbs.forEach(function (t, n) {
      var on = n === i;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (indexEl) indexEl.textContent = i + 1 + " / " + total;
  }

  thumbs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = parseInt(btn.getAttribute("data-index") || "0", 10);
      show(Number.isFinite(idx) ? idx : 0);
    });
  });

  var prev = document.querySelector("[data-gallery-prev]");
  var next = document.querySelector("[data-gallery-next]");
  if (prev)
    prev.addEventListener("click", function (e) {
      e.stopPropagation();
      show(i - 1);
    });
  if (next)
    next.addEventListener("click", function (e) {
      e.stopPropagation();
      show(i + 1);
    });

  var frame = document.querySelector("[data-gallery-frame]");
  var x0 = null;
  var y0 = 0;
  if (frame) {
    frame.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length > 1) {
          x0 = null;
          return;
        }
        x0 = e.changedTouches[0] ? e.changedTouches[0].clientX : null;
        y0 = e.changedTouches[0] ? e.changedTouches[0].clientY : 0;
      },
      { passive: true, capture: true },
    );
    frame.addEventListener(
      "touchend",
      function (e) {
        if (x0 == null) return;
        var dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : x0) - x0;
        var dy = (e.changedTouches[0] ? e.changedTouches[0].clientY : y0) - y0;
        x0 = null;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        show(i + (dx < 0 ? 1 : -1));
      },
      { passive: true, capture: true },
    );
  }

  if (root) {
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        show(i - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        show(i + 1);
      }
    });
    if (!root.hasAttribute("tabindex")) root.tabIndex = 0;
  }
})();
