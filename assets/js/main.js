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

  // ---- Escaping helpers (user content goes through these before innerHTML) ----
  // esc(): HTML-escape text and double-quoted attribute values.
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // safeUrl(): only allow benign schemes in href/src so a stored value like
  // "javascript:…" can't execute. Relative paths, anchors and mail/tel are fine.
  const safeUrl = (u) => {
    const s = String(u == null ? "" : u).trim();
    return /^(https?:|mailto:|tel:|\/|\.|#|[^:]*$)/i.test(s) && !/^\s*javascript:/i.test(s) ? s : "#";
  };

  // ---- Renderers (used on multiple pages) ----
  function bookCard(b) {
    const cover = b.coverUrl
      ? `background:url('${esc(b.coverUrl)}') center/cover no-repeat`
      : `background:${COVER_GRADS[b.cover]}`;
    // A real cover already carries its own title art — no text overlay needed.
    const overlay = b.coverUrl ? "" : `<div><h4>${esc(b.title)}</h4><span class="by">by ${esc(b.author)}</span></div>`;
    // Grid cards stay compact: ISBN and buy links live on the detail page.
    // Pass {full:true} (dashboard) to keep them on the card.
    const isbn = (b.full && b.isbn) ? `<div class="book__isbn">ISBN ${esc(b.isbn)}</div>` : "";
    const urls = (b.buyUrls && b.buyUrls.length) ? b.buyUrls : (b.buyUrl ? [b.buyUrl] : []);
    const buy = (b.full && urls.length)
      ? `<div class="book__buy">` + urls.map(u =>
          `<a class="btn btn--primary btn--sm btn--block" href="${esc(safeUrl(u))}" target="_blank" rel="noopener noreferrer">Buy on ${esc(storeName(u))} ↗</a>`
        ).join("") + `</div>`
      : "";
    const rc = b.ratingCount || 0;
    const ratingEl = rc > 0
      ? `<span class="stars" title="${Number(b.rating).toFixed(1)} / 5">${stars(Math.round(b.rating))} <span class="rating-count">(${rc})</span></span>`
      : `<span class="rating-none">No reviews yet</span>`;
    const href = b.id ? `book.html?id=${encodeURIComponent(b.id)}` : null;
    const coverEl = href
      ? `<a class="book__cover" style="${cover}" href="${href}"><span class="lang-tag">${esc(b.lang)}</span>${overlay}</a>`
      : `<div class="book__cover" style="${cover}"><span class="lang-tag">${esc(b.lang)}</span>${overlay}</div>`;
    const titleEl = href
      ? `<a class="book__title" href="${href}">${esc(b.title)}</a>`
      : `<div class="book__title">${esc(b.title)}</div>`;
    const authorEl = b.authorId
      ? `<a class="book__author" href="author.html?id=${encodeURIComponent(b.authorId)}">by ${esc(b.author)}</a>`
      : `<div class="book__author">by ${esc(b.author)}</div>`;
    return `<article class="book">
      ${coverEl}
      <div class="book__meta">
        <div>${titleEl}${authorEl}</div>
      </div>
      <span class="genre-chip">${esc(b.genre)}</span>
      ${isbn}
      <div class="book__foot">
        ${ratingEl}
        <span class="book__price">₹${esc(b.price)}</span>
      </div>
      ${buy}
    </article>`;
  }

  function authorCard(a) {
    const avatar = a.avatarUrl
      ? `<div class="avatar" style="background:url('${esc(a.avatarUrl)}') center/cover no-repeat"></div>`
      : `<div class="avatar" style="background:${COVER_GRADS[a.color]}">${esc(initials(a.name))}</div>`;
    const href = a.id ? `author.html?id=${encodeURIComponent(a.id)}` : null;
    const avatarEl = href ? `<a href="${href}">${avatar}</a>` : avatar;
    const nameEl = href
      ? `<a class="author__name" href="${href}" style="color:inherit;text-decoration:none">${esc(a.name)}</a>`
      : `<div class="author__name">${esc(a.name)}</div>`;
    return `<article class="card card--hover author">
      ${avatarEl}
      ${nameEl}
      <div class="author__role">${esc(a.role)}</div>
      <div class="author__tags">
        ${(a.genres || []).map(g => `<span class="tag">${esc(g)}</span>`).join("")}
      </div>
      <p class="muted" style="margin:12px 0 0;font-size:.86rem">${a.books} book${a.books > 1 ? "s" : ""} listed</p>
    </article>`;
  }

  function eventCard(e) {
    const banner = e.imageUrl ? `<div class="event__banner" style="background-image:url('${esc(e.imageUrl)}')"></div>` : "";
    const loc = e.format
      ? (e.format === "Online" ? "Online"
        : e.format === "Hybrid" ? ("Hybrid" + (e.venue ? " · " + e.venue : ""))
        : (e.venue || "In-person"))
      : (e.mode || "");
    const link = e.linkUrl
      ? `<a class="btn btn--teal btn--sm" href="${esc(safeUrl(e.linkUrl))}" target="_blank" rel="noopener noreferrer" style="margin-top:12px">Register / Join ↗</a>`
      : "";
    const r = e.rsvp || {};
    const counts = { coming: r.coming || 0, maybe: r.maybe || 0, interested: r.interested || 0 };
    const mine = r.mine || null;
    const rb = (s, label, emoji) => `<button class="rsvp-btn ${mine === s ? "active" : ""}" data-status="${s}" type="button">${emoji} ${label} <span class="c">${counts[s]}</span></button>`;
    const rsvpBar = e.id
      ? `<div class="rsvp" data-event="${esc(e.id)}">${rb("coming", "Coming", "✅")}${rb("maybe", "Maybe", "🤔")}${rb("interested", "Interested", "⭐")}</div>`
      : "";
    const href = e.id ? `event.html?id=${encodeURIComponent(e.id)}` : null;
    const titleEl = href ? `<h3><a href="${href}" style="color:inherit;text-decoration:none">${esc(e.title)}</a></h3>` : `<h3>${esc(e.title)}</h3>`;
    const desc = e.description ? `<p class="event__desc">${esc(e.description)}</p>` : "";
    const more = href ? `<a class="event__more" href="${href}">View details →</a>` : "";
    return `<article class="card card--hover">
      ${banner}
      <div class="event">
        <div class="event__date"><div class="d">${esc(e.day)}</div><div class="m">${esc(e.month)}</div></div>
        <div>
          <span class="event__type">${esc(e.type)}</span>
          ${titleEl}
          <div class="event__meta"><span>✍ ${e.hostId ? `<a href="author.html?id=${encodeURIComponent(e.hostId)}" style="color:inherit">${esc(e.author)}</a>` : esc(e.author)}</span><span>📍 ${esc(loc)}</span><span>🕒 ${esc(e.time)}</span></div>
          ${desc}
          ${link}
          ${rsvpBar}
          ${more}
        </div>
      </div>
    </article>`;
  }

  function quoteCard(q) {
    const title = q.title ? `<div class="quote-card__title">${esc(q.title)}</div>` : "";
    return `<article class="card card--hover quote-card">
      <div class="quote-card__head">
        <div class="quote-card__logo" style="background:${COVER_GRADS[q.color]}">${esc(initials(q.name))}</div>
        <div><strong>${esc(q.name)}</strong><br><span class="badge ${q.kind === 'Reviewer' ? 'teal' : ''}">${esc(q.badge)}</span></div>
      </div>
      ${title}
      <div><span class="quote-card__price">${esc(q.price || "—")}</span> ${q.unit ? `<span class="muted">/ ${esc(q.unit)}</span>` : ""}</div>
      <ul class="quote-card__list">${(q.items || []).map(i => `<li>${esc(i)}</li>`).join("")}</ul>
      <a class="btn btn--ghost btn--sm btn--block" href="${q.id
        ? `request.html?quote=${encodeURIComponent(q.id)}`
        : `contact.html?subject=partner&partner=${encodeURIComponent(q.name)}${q.title ? `&pkg=${encodeURIComponent(q.title)}` : ""}`}">Request this quote</a>
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
