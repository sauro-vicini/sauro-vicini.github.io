// Reveal on scroll: IntersectionObserver, nessun listener di scroll.
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
  els.forEach(function (el) { io.observe(el); });
})();

// Copia indirizzo email, con stato di successo e di errore.
(function () {
  var btn = document.getElementById("copy-email");
  if (!btn) return;
  var status = document.getElementById("copy-status");
  var email = document.querySelector("[data-email]").getAttribute("data-email");
  btn.addEventListener("click", function () {
    var done = function () {
      btn.querySelector(".ph").className = "ph ph-check";
      status.textContent = "Indirizzo copiato: " + email;
    };
    var fail = function () { status.textContent = "Copia non riuscita. L'indirizzo è " + email; };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(done, fail);
    } else {
      fail();
    }
  });
})();
