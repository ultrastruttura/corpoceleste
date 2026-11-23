/** Filter size-guide charts by ?model=<fitModelId> (product page link). */
(function () {
  var raw = new URLSearchParams(location.search).get("model");
  if (!raw) return;
  var id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch (_) {
    /* keep raw */
  }
  id = String(id || "").replace(/\.md$/i, "").trim();
  if (!id) return;

  var sections = document.querySelectorAll("[data-fit-model]");
  if (!sections.length) return;

  var match = null;
  sections.forEach(function (el) {
    var mid = el.getAttribute("data-fit-model") || "";
    if (mid === id) {
      match = el;
      el.removeAttribute("hidden");
    } else {
      el.setAttribute("hidden", "");
    }
  });

  if (!match) return;

  document.documentElement.setAttribute("data-fit-filter", id);
  var heading = match.querySelector("h2");
  var h1 = document.querySelector(".page-hero h1");
  if (h1 && heading && heading.textContent) {
    var base = (h1.getAttribute("data-title-base") || h1.textContent || "").trim();
    h1.setAttribute("data-title-base", base);
    h1.textContent = base + " — " + heading.textContent.trim();
  }
})();
