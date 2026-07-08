/* Client-side filtering + search for the Books and Authors pages. */
(function () {
  function setupChips(container) {
    if (!container) return;
    container.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const group = chip.closest(".chips");
      group.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      window.__applyFilters && window.__applyFilters();
    });
  }

  // ---------- Books page ----------
  function initBooks() {
    const grid = document.getElementById("bookGrid");
    if (!grid) return;
    const search = document.getElementById("bookSearch");
    const genreChips = document.getElementById("genreChips");
    const langChips = document.getElementById("langChips");
    const count = document.getElementById("resultCount");

    function activeVal(el) { return el.querySelector(".chip.active")?.dataset.val || "All"; }

    window.__applyFilters = function () {
      const g = activeVal(genreChips), l = activeVal(langChips);
      const q = (search.value || "").trim().toLowerCase();
      const rows = BOOKS.filter(b =>
        (g === "All" || b.genre === g) &&
        (l === "All" || b.lang === l) &&
        (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      );
      grid.innerHTML = rows.length
        ? rows.map(KALAM.bookCard).join("")
        : `<p class="muted" style="grid-column:1/-1">No books here yet. <a href="join.html">List yours</a> to be among the first.</p>`;
      count.textContent = `${rows.length} book${rows.length === 1 ? "" : "s"}`;
    };
    setupChips(genreChips); setupChips(langChips);
    search.addEventListener("input", window.__applyFilters);
    window.__applyFilters();
  }

  // ---------- Authors page ----------
  function initAuthors() {
    const grid = document.getElementById("authorGrid");
    if (!grid) return;
    const search = document.getElementById("authorSearch");
    const genreChips = document.getElementById("authorGenreChips");
    const count = document.getElementById("authorCount");
    function activeVal(el) { return el.querySelector(".chip.active")?.dataset.val || "All"; }

    window.__applyFilters = function () {
      const g = activeVal(genreChips);
      const q = (search.value || "").trim().toLowerCase();
      const rows = AUTHORS.filter(a =>
        (g === "All" || a.genres.includes(g)) &&
        (!q || a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q))
      );
      grid.innerHTML = rows.length
        ? rows.map(KALAM.authorCard).join("")
        : `<p class="muted" style="grid-column:1/-1">No authors here yet. <a href="join.html">Join as an author</a> to be among the first.</p>`;
      count.textContent = `${rows.length} author${rows.length === 1 ? "" : "s"}`;
    };
    setupChips(genreChips);
    search.addEventListener("input", window.__applyFilters);
    window.__applyFilters();
  }

  // ---------- Events page ----------
  function initEvents() {
    const grid = document.getElementById("eventGrid");
    if (!grid) return;
    const typeChips = document.getElementById("eventTypeChips");
    const count = document.getElementById("eventCount");
    function activeVal(el) { return el.querySelector(".chip.active")?.dataset.val || "All"; }

    window.__applyFilters = function () {
      const t = activeVal(typeChips);
      const rows = EVENTS.filter(e => t === "All" || e.type === t);
      grid.innerHTML = rows.length
        ? rows.map(KALAM.eventCard).join("")
        : `<p class="muted" style="grid-column:1/-1">No events here yet. <a href="join.html">Host one</a> and bring readers together.</p>`;
      if (count) count.textContent = `${rows.length} event${rows.length === 1 ? "" : "s"}`;
    };
    setupChips(typeChips);
    window.__applyFilters();
  }

  // ---------- Partners page ----------
  function initPartners() {
    const grid = document.getElementById("partnerGrid");
    if (!grid) return;
    const kindChips = document.getElementById("partnerKindChips");
    const count = document.getElementById("partnerCount");
    function activeVal(el) { return el.querySelector(".chip.active")?.dataset.val || "All"; }

    window.__applyFilters = function () {
      const k = activeVal(kindChips);
      const rows = QUOTES.filter(q => k === "All" || q.kind === k);
      grid.innerHTML = rows.length
        ? rows.map(KALAM.quoteCard).join("")
        : `<p class="muted" style="grid-column:1/-1">No partner offers listed yet. <a href="join.html">List your services</a> to be among the first.</p>`;
      if (count) count.textContent = `${rows.length} partner${rows.length === 1 ? "" : "s"}`;
    };
    setupChips(kindChips);
    window.__applyFilters();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBooks(); initAuthors(); initEvents(); initPartners();
  });
})();
