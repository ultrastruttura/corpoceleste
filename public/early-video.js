(function () {
  var v = document.querySelector("[data-src-mobile]");
  if (v && window.matchMedia("(max-width: 899px)").matches) {
    v.src = v.getAttribute("data-src-mobile");
  }
})();
