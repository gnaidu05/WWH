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
    const browse = document.getElementById("browse");

    const activeVal = (el) => el.querySelector(".chip.active")?.dataset.val || "All";
    const valuesOf = (chips) => [...chips.querySelectorAll(".chip")].map(c => c.dataset.val).filter(v => v !== "All");

    // One horizontal carousel with a heading + optional "See all".
    function railRow(title, items, seeAllHref) {
      return `<section class="browse-row">
        <div class="rail-head"><h2>${title}</h2>${seeAllHref ? `<a class="btn btn--ghost btn--sm" href="${seeAllHref}">See all →</a>` : ""}</div>
        <div class="rail rail--book">${items.map(KALAM.bookCard).join("")}</div>
      </section>`;
    }

    // Bookstore browse view: several themed rows built from the catalogue.
    function renderBrowse() {
      const rows = [];
      rows.push(railRow("🆕 New arrivals", BOOKS.slice(0, 16), null));
      const rated = BOOKS.filter(b => (b.ratingCount || 0) > 0)
        .sort((a, b) => (b.rating - a.rating) || (b.ratingCount - a.ratingCount));
      if (rated.length >= 3) rows.push(railRow("⭐ Highly rated", rated.slice(0, 16), null));
      valuesOf(genreChips).forEach(g => {
        const items = BOOKS.filter(b => b.genre === g);
        if (items.length >= 2) rows.push(railRow("📖 " + g, items.slice(0, 16), "books.html?genre=" + encodeURIComponent(g)));
      });
      valuesOf(langChips).forEach(l => {
        const items = BOOKS.filter(b => b.lang === l);
        if (items.length >= 2) rows.push(railRow("🌏 In " + l, items.slice(0, 16), "books.html?lang=" + encodeURIComponent(l)));
      });
      browse.innerHTML = rows.join("") ||
        `<p class="muted">No books listed yet. <a href="join.html">List yours</a> to be among the first.</p>`;
    }

    window.__applyFilters = function () {
      const g = activeVal(genreChips), l = activeVal(langChips);
      const q = (search.value || "").trim().toLowerCase();
      const filtering = g !== "All" || l !== "All" || !!q;

      // No filter + a catalogue big enough to group → multi-row bookstore browse.
      if (browse && !filtering && BOOKS.length >= 6) {
        browse.classList.remove("hidden");
        grid.classList.add("hidden");
        count.classList.add("hidden");
        renderBrowse();
        return;
      }

      // Otherwise a flat results grid (also used for a small catalogue).
      if (browse) browse.classList.add("hidden");
      grid.classList.remove("hidden");
      count.classList.remove("hidden");
      const rows = BOOKS.filter(b =>
        (g === "All" || b.genre === g) &&
        (l === "All" || b.lang === l) &&
        (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      );
      grid.innerHTML = rows.length
        ? rows.map(KALAM.bookCard).join("")
        : `<p class="muted" style="grid-column:1/-1">No books match. <a href="books.html">Clear filters</a> or <a href="join.html">list yours</a>.</p>`;
      count.textContent = filtering
        ? `${rows.length} book${rows.length === 1 ? "" : "s"} found`
        : `${rows.length} book${rows.length === 1 ? "" : "s"}`;
    };

    setupChips(genreChips); setupChips(langChips);
    // Deep links from the header search (?q=) and the category bar (?genre= / ?lang=).
    const params = new URLSearchParams(location.search);
    const q0 = params.get("q");
    const g0 = params.get("genre");
    const l0 = params.get("lang");
    if (q0) search.value = q0;
    if (g0) genreChips.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.val === g0));
    if (l0) langChips.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.val === l0));
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
