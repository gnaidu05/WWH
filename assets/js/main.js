/* Kalam — shared UI behaviour: theme toggle, mobile nav, and card rendering */

(function () {
  // ---- Theme ----
  const root = document.documentElement;
  const saved = localStorage.getItem("kalam-theme");
  if (saved) root.setAttribute("data-theme", saved);

  window.toggleTheme = function () {
    const cur = root.getAttribute("data-theme");
    const isDark = cur ? cur === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("kalam-theme", next);
  };

  // ---- Mobile nav ----
  window.toggleNav = function () {
    document.getElementById("navLinks")?.classList.toggle("open");
  };

  // ---- Renderers (used on multiple pages) ----
  function bookCard(b) {
    const cover = b.coverUrl
      ? `background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.6)),url('${b.coverUrl}') center/cover no-repeat`
      : `background:${COVER_GRADS[b.cover]}`;
    const isbn = b.isbn ? `<div class="book__isbn">ISBN ${b.isbn}</div>` : "";
    const buy = b.buyUrl
      ? `<a class="btn btn--primary btn--sm btn--block" href="${b.buyUrl}" target="_blank" rel="noopener noreferrer" style="margin-top:10px">Buy ↗</a>`
      : "";
    return `<article class="book">
      <div class="book__cover" style="${cover}">
        <span class="lang-tag">${b.lang}</span>
        <div><h4>${b.title}</h4><span class="by">by ${b.author}</span></div>
      </div>
      <div class="book__meta">
        <div><div class="book__title">${b.title}</div><div class="book__author">${b.author}</div></div>
      </div>
      <span class="genre-chip">${b.genre}</span>
      ${isbn}
      <div class="book__foot">
        <span class="stars" aria-label="${b.rating} out of 5">${stars(b.rating)}</span>
        <span class="book__price">₹${b.price}</span>
      </div>
      ${buy}
    </article>`;
  }

  function authorCard(a) {
    const avatar = a.avatarUrl
      ? `<div class="avatar" style="background:url('${a.avatarUrl}') center/cover no-repeat"></div>`
      : `<div class="avatar" style="background:${COVER_GRADS[a.color]}">${initials(a.name)}</div>`;
    return `<article class="card card--hover author">
      ${avatar}
      <div class="author__name">${a.name}</div>
      <div class="author__role">${a.role} · ${a.city}</div>
      <div class="author__tags">
        ${a.genres.map(g => `<span class="tag">${g}</span>`).join("")}
      </div>
      <p class="muted" style="margin:12px 0 0;font-size:.86rem">${a.books} book${a.books > 1 ? "s" : ""} listed</p>
    </article>`;
  }

  function eventCard(e) {
    return `<article class="card card--hover">
      <div class="event">
        <div class="event__date"><div class="d">${e.day}</div><div class="m">${e.month}</div></div>
        <div>
          <span class="event__type">${e.type}</span>
          <h3>${e.title}</h3>
          <div class="event__meta"><span>✍ ${e.author}</span><span>📍 ${e.mode}</span><span>🕒 ${e.time}</span></div>
        </div>
      </div>
    </article>`;
  }

  function quoteCard(q) {
    return `<article class="card card--hover quote-card">
      <div class="quote-card__head">
        <div class="quote-card__logo" style="background:${COVER_GRADS[q.color]}">${initials(q.name)}</div>
        <div><strong>${q.name}</strong><br><span class="badge ${q.kind === 'Reviewer' ? 'teal' : ''}">${q.badge}</span></div>
      </div>
      <div><span class="quote-card__price">${q.price}</span> <span class="muted">/ ${q.unit}</span></div>
      <ul class="quote-card__list">${q.items.map(i => `<li>${i}</li>`).join("")}</ul>
      <a class="btn btn--ghost btn--sm btn--block" href="join.html">Request this quote</a>
    </article>`;
  }

  // Render any grid that declares a data source via [data-render]
  function renderAuto() {
    const sources = { books: [BOOKS, bookCard], authors: [AUTHORS, authorCard], events: [EVENTS, eventCard], quotes: [QUOTES, quoteCard] };
    document.querySelectorAll("[data-render]").forEach(el => {
      const src = sources[el.getAttribute("data-render")];
      if (!src) return;
      const limit = parseInt(el.getAttribute("data-limit") || "999", 10);
      const html = src[0].slice(0, limit).map(src[1]).join("");
      el.innerHTML = html || `<p class="muted" style="grid-column:1/-1">${el.getAttribute("data-empty") || "Nothing here yet."}</p>`;
    });
  }

  // Expose for page scripts
  window.KALAM = { bookCard, authorCard, eventCard, quoteCard, renderAuto };

  document.addEventListener("DOMContentLoaded", renderAuto);
})();
