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
        <span>Kitaab<br><span class="brand__sub">भारतीय लेखकों का बाज़ार</span></span>
      </a>
      <form class="hdr-search" action="books.html" method="get" role="search">
        <input name="q" type="search" placeholder="Search books, authors, languages…" aria-label="Search the marketplace">
        <button type="submit" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg></button>
      </form>
      <div class="nav__cta">
        <button class="icon-btn" onclick="toggleTheme()" aria-label="Toggle light/dark theme" title="Toggle theme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>
        <span id="authArea" style="display:contents">
          <a class="btn btn--ghost btn--sm" href="signin.html">Sign in</a>
          <a class="btn btn--primary btn--sm" href="join.html">Join free</a>
        </span>
        <button class="icon-btn nav__toggle" onclick="toggleNav()" aria-label="Open menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
      </div>
    </div>
    <nav class="catbar" id="navLinks" aria-label="Browse the marketplace">
      <div class="wrap">
        ${link("books.html", "books", "All Books")}
        ${link("authors.html", "authors", "Authors")}
        ${link("events.html", "events", "Events")}
        ${link("partners.html", "partners", "For Partners")}
        ${link("about.html", "about", "About")}
        <span class="catbar__sep"></span>
        <a href="books.html?genre=${encodeURIComponent("Literary Fiction")}">Fiction</a>
        <a href="books.html?genre=Poetry">Poetry</a>
        <a href="books.html?genre=Mystery">Mystery</a>
        <a href="books.html?genre=Children">Children</a>
        <a href="books.html?genre=Business">Business</a>
        <a href="books.html?genre=Non-fiction">Non-fiction</a>
      </div>
    </nav>
  </header>`;

  const footer = `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <a class="brand" href="index.html"><span class="brand__mark">क</span><span>Kitaab</span></a>
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
            <li><a href="contact.html">Contact</a></li>
            <li><a href="privacy.html">Privacy</a></li>
            <li><a href="terms.html">Terms</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© 2026 Kitaab · Made in India 🇮🇳 for Indian storytellers.</span>
        <span>हर भाषा · हर कहानी · एक बाज़ार</span>
      </div>
    </div>
  </footer>`;

  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
  if (h) h.outerHTML = header;
  if (f) f.outerHTML = footer;
})();
