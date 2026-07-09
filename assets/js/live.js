/* Pulls live rows from Supabase and merges them into the listing pages so a
 * real author's newly-added book/event shows up in the marketplace alongside
 * the demo samples. No-op in demo mode. Real entries appear first. */
(function () {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function reRender() {
    // Re-run the [data-render] auto grids (home page)
    if (window.KALAM && window.KALAM.renderAuto) window.KALAM.renderAuto();
    // Re-run listing-page filters if present
    if (window.__applyFilters) window.__applyFilters();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.AUTH || !window.AUTH.enabled) return;
    await window.AUTH.ready;
    try {
      const needBooks = document.querySelector('[data-render="books"], #bookGrid');
      const needAuthors = document.querySelector('[data-render="authors"], #authorGrid');
      const needEvents = document.querySelector('[data-render="events"], #eventGrid');

      if (needBooks && typeof BOOKS !== "undefined") {
        const [rows, stats] = await Promise.all([window.AUTH.listBooks(), window.AUTH.reviewStats()]);
        rows.reverse().forEach((r) => {
          const s = stats[r.id];
          BOOKS.unshift({
            id: r.id, title: r.title, author: r.author_name, genre: r.genre, lang: r.language,
            price: r.price, rating: s ? s.avg : 0, ratingCount: s ? s.count : 0, cover: r.cover_idx || 0,
            coverUrl: r.cover_url || null, isbn: r.isbn || null,
            buyUrls: (r.buy_urls && r.buy_urls.length) ? r.buy_urls : (r.buy_url ? [r.buy_url] : []),
          });
        });
      }
      if (needEvents && typeof EVENTS !== "undefined") {
        const rows = await window.AUTH.listEvents();
        rows.reverse().forEach((r) => {
          const d = new Date(r.event_date + "T00:00:00");
          EVENTS.unshift({
            day: String(d.getDate()).padStart(2, "0"), month: MONTHS[d.getMonth()] || "",
            type: r.type, title: r.title, author: r.host_name,
            mode: r.mode || "Online", time: r.event_time || "",
          });
        });
      }
      if (needAuthors && typeof AUTHORS !== "undefined") {
        const [profiles, books] = await Promise.all([
          window.AUTH.listProfiles(), window.AUTH.listBooks(),
        ]);
        const counts = {};
        books.forEach((b) => { counts[b.author_id] = (counts[b.author_id] || 0) + 1; });
        profiles.reverse().forEach((p, i) => AUTHORS.unshift({
          name: p.full_name, role: p.role + (p.org ? " · " + p.org : ""),
          city: p.city || "India", books: counts[p.id] || 0,
          genres: p.language ? [p.language] : [], color: i % 6,
          avatarUrl: p.avatar_url || null,
        }));
      }
      reRender();
    } catch (e) {
      /* leave demo data in place on any error */
    }
  });
})();
