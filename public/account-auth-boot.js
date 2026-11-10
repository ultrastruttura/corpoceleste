/** Sync scrub of magic-link tokens before deferred modules / analytics. */
(function () {
  try {
    var token = "";
    var params = new URLSearchParams(location.search);
    token = params.get("t") || "";
    if (!token && location.hash) {
      var hash = location.hash.replace(/^#/, "");
      token = new URLSearchParams(hash).get("t") || "";
    }
    if (!token) return;
    sessionStorage.setItem("cc-magic-pending", token);
    var url = new URL(location.href);
    url.searchParams.delete("t");
    url.hash = "";
    history.replaceState(null, "", url.pathname + url.search);
  } catch (e) {
    /* ignore */
  }
})();
