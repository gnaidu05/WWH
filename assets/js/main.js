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
      ? `background:url('${b.coverUrl}') center/cover no-repeat`
      : `background:${COVER_GRADS[b.cover]}`;
    // A real cover already carries its own title art — no text overlay needed.
    const overlay = b.coverUrl ? "" : `<div><h4>${b.title}</h4><span class="by">by ${b.author}</span></div>`;
    // Grid cards stay compact: ISBN and buy links live on the detail page.
    // Pass {full:true} (dashboard) to keep them on the card.
    const isbn = (b.full && b.isbn) ? `<div class="book__isbn">ISBN ${b.isbn}</div>` : "";
    const urls = (b.buyUrls && b.buyUrls.length) ? b.buyUrls : (b.buyUrl ? [b.buyUrl] : []);
    const buy = (b.full && urls.length)
      ? `<div class="book__buy">` + urls.map(u =>
          `<a class="btn btn--primary btn--sm btn--block" href="${u}" target="_blank" rel="noopener noreferrer">Buy on ${storeName(u)} ↗</a>`
        ).join("") + `</div>`
      : "";
    const rc = b.ratingCount || 0;
    const ratingEl = rc > 0
      ? `<span class="stars" title="${Number(b.rating).toFixed(1)} / 5">${stars(Math.round(b.rating))} <span class="rating-count">(${rc})</span></span>`
      : `<span class="rating-none">No reviews yet</span>`;
    const href = b.id ? `book.html?id=${encodeURIComponent(b.id)}` : null;
    const coverEl = href
      ? `<a class="book__cover" style="${cover}" href="${href}"><span class="lang-tag">${b.lang}</span>${overlay}</a>`
      : `<div class="book__cover" style="${cover}"><span class="lang-tag">${b.lang}</span>${overlay}</div>`;
    const titleEl = href
      ? `<a class="book__title" href="${href}">${b.title}</a>`
      : `<div class="book__title">${b.title}</div>`;
    return `<article class="book">
      ${coverEl}
      <div class="book__meta">
        <div>${titleEl}<div class="book__author">${b.author}</div></div>
      </div>
      <span class="genre-chip">${b.genre}</span>
      ${isbn}
      <div class="book__foot">
        ${ratingEl}
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
      <div class="author__role">${a.role}</div>
      <div class="author__tags">
        ${a.genres.map(g => `<span class="tag">${g}</span>`).join("")}
      </div>
      <p class="muted" style="margin:12px 0 0;font-size:.86rem">${a.books} book${a.books > 1 ? "s" : ""} listed</p>
    </article>`;
  }

  function eventCard(e) {
    const banner = e.imageUrl ? `<div class="event__banner" style="background-image:url('${e.imageUrl}')"></div>` : "";
    const loc = e.format
      ? (e.format === "Online" ? "Online"
        : e.format === "Hybrid" ? ("Hybrid" + (e.venue ? " · " + e.venue : ""))
        : (e.venue || "In-person"))
      : (e.mode || "");
    const link = e.linkUrl
      ? `<a class="btn btn--teal btn--sm" href="${e.linkUrl}" target="_blank" rel="noopener noreferrer" style="margin-top:12px">Register / Join ↗</a>`
      : "";
    const r = e.rsvp || {};
    const counts = { coming: r.coming || 0, maybe: r.maybe || 0, interested: r.interested || 0 };
    const mine = r.mine || null;
    const rb = (s, label, emoji) => `<button class="rsvp-btn ${mine === s ? "active" : ""}" data-status="${s}" type="button">${emoji} ${label} <span class="c">${counts[s]}</span></button>`;
    const rsvpBar = e.id
      ? `<div class="rsvp" data-event="${e.id}">${rb("coming", "Coming", "✅")}${rb("maybe", "Maybe", "🤔")}${rb("interested", "Interested", "⭐")}</div>`
      : "";
    const href = e.id ? `event.html?id=${encodeURIComponent(e.id)}` : null;
    const titleEl = href ? `<h3><a href="${href}" style="color:inherit;text-decoration:none">${e.title}</a></h3>` : `<h3>${e.title}</h3>`;
    const desc = e.description ? `<p class="event__desc">${e.description}</p>` : "";
    const more = href ? `<a class="event__more" href="${href}">View details →</a>` : "";
    return `<article class="card card--hover">
      ${banner}
      <div class="event">
        <div class="event__date"><div class="d">${e.day}</div><div class="m">${e.month}</div></div>
        <div>
          <span class="event__type">${e.type}</span>
          ${titleEl}
          <div class="event__meta"><span>✍ ${e.author}</span><span>📍 ${loc}</span><span>🕒 ${e.time}</span></div>
          ${desc}
          ${link}
          ${rsvpBar}
          ${more}
        </div>
      </div>
    </article>`;
  }

  function quoteCard(q) {
    const title = q.title ? `<div class="quote-card__title">${q.title}</div>` : "";
    return `<article class="card card--hover quote-card">
      <div class="quote-card__head">
        <div class="quote-card__logo" style="background:${COVER_GRADS[q.color]}">${initials(q.name)}</div>
        <div><strong>${q.name}</strong><br><span class="badge ${q.kind === 'Reviewer' ? 'teal' : ''}">${q.badge}</span></div>
      </div>
      ${title}
      <div><span class="quote-card__price">${q.price || "—"}</span> ${q.unit ? `<span class="muted">/ ${q.unit}</span>` : ""}</div>
      <ul class="quote-card__list">${(q.items || []).map(i => `<li>${i}</li>`).join("")}</ul>
      <a class="btn btn--ghost btn--sm btn--block" href="contact.html">Request this quote</a>
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

  // RSVP buttons (delegated, works on any page with event cards)
  document.addEventListener("click", async (ev) => {
    const btn = ev.target.closest(".rsvp-btn");
    if (!btn) return;
    const bar = btn.closest(".rsvp");
    const eventId = bar && bar.getAttribute("data-event");
    if (!eventId || !window.AUTH || !window.AUTH.enabled) return;
    if (!window.AUTH.user()) { window.location.href = "signin.html"; return; }
    const status = btn.getAttribute("data-status");
    const wasActive = btn.classList.contains("active");
    const prev = bar.querySelector(".rsvp-btn.active");
    const adj = (b, d) => { const c = b.querySelector(".c"); if (c) c.textContent = Math.max(0, (parseInt(c.textContent, 10) || 0) + d); };
    if (prev) { prev.classList.remove("active"); adj(prev, -1); }
    if (wasActive) {
      await window.AUTH.unrsvp(eventId);
    } else {
      btn.classList.add("active"); adj(btn, 1);
      await window.AUTH.rsvp(eventId, status);
    }
  });

  document.addEventListener("DOMContentLoaded", renderAuto);
})();
