/* Injects the shared header and footer so interior pages stay lean.
   Usage: add <div id="site-header" data-active="books"></div> and
   <div id="site-footer"></div>, then load this script. */
(function () {
  const active = (document.getElementById("site-header") || {}).dataset?.active || "";
  const link = (href, key, label) =>
    `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;

  const header = `
  <header class="site-header">
    <div class="wrap nav">
      <a class="brand" href="index.html">
        <span class="brand__mark">क</span>
        <span>Kalam<br><span class="brand__sub">भारतीय लेखकों का बाज़ार</span></span>
      </a>
      <nav class="nav__links" id="navLinks" aria-label="Primary">
        ${link("books.html", "books", "Books")}
        ${link("authors.html", "authors", "Authors")}
        ${link("events.html", "events", "Events")}
        ${link("partners.html", "partners", "For Partners")}
        ${link("about.html", "about", "About")}
      </nav>
      <span class="nav__spacer"></span>
      <div class="nav__cta">
        <button class="icon-btn" onclick="toggleTheme()" aria-label="Toggle light/dark theme" title="Toggle theme">◑</button>
        <a class="btn btn--ghost btn--sm" href="join.html">Sign in</a>
        <a class="btn btn--primary btn--sm" href="join.html">Join free</a>
        <button class="icon-btn nav__toggle" onclick="toggleNav()" aria-label="Open menu">☰</button>
      </div>
    </div>
  </header>`;

  const footer = `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <a class="brand" href="index.html"><span class="brand__mark">क</span><span>Kalam</span></a>
          <p class="muted" style="margin-top:14px;max-width:34ch">A marketplace where Indian authors, publishers, distributors, reviewers and readers meet — in every language.</p>
        </div>
        <div>
          <h4>Marketplace</h4>
          <ul class="footer__links">
            <li><a href="books.html">Books</a></li>
            <li><a href="authors.html">Authors</a></li>
            <li><a href="events.html">Events</a></li>
            <li><a href="partners.html">Partners</a></li>
          </ul>
        </div>
        <div>
          <h4>Get started</h4>
          <ul class="footer__links">
            <li><a href="join.html">Join as author</a></li>
            <li><a href="join.html">Join as partner</a></li>
            <li><a href="join.html">Sign in</a></li>
            <li><a href="about.html">About us</a></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul class="footer__links">
            <li><a href="about.html#faq">Help &amp; FAQ</a></li>
            <li><a href="about.html">Contact</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© 2026 Kalam · Made in India 🇮🇳 for Indian storytellers.</span>
        <span>हर भाषा · हर कहानी · एक बाज़ार</span>
      </div>
    </div>
  </footer>`;

  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
  if (h) h.outerHTML = header;
  if (f) f.outerHTML = footer;
})();
