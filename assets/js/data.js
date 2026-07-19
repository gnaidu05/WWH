/* Sample marketplace data for Kalam — demo content rendered client-side.
   In production this would come from an API. */

const COVER_GRADS = [
  "linear-gradient(160deg,#D65F43,#b64a31)",  /* terracotta */
  "linear-gradient(160deg,#0F7A78,#0a5a58)",  /* peacock teal */
  "linear-gradient(160deg,#7C4A86,#5e3566)",  /* plum */
  "linear-gradient(160deg,#3F5AA6,#2d4488)",  /* indigo */
  "linear-gradient(160deg,#C56B78,#a5505d)",  /* clay rose */
  "linear-gradient(160deg,#E3A22C,#bd831c)",  /* amber */
];

// Real books come live from Supabase (see live.js). No demo/sample books.
const BOOKS = [];

// Real authors come live from Supabase profiles (see live.js). No samples.
const AUTHORS = [];

// Real events come live from Supabase (see live.js). No samples.
const EVENTS = [];

// No sample partner quotations. (A partner backend can populate these later.)
const QUOTES = [];

const initials = (name) => name.replace(/[^A-Za-zऀ-෿ ]/g, "").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "★";
const stars = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);

// Friendly marketplace name from a buy URL's hostname.
const storeName = (url) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const known = { amazon: "Amazon", flipkart: "Flipkart", notionpress: "Notion Press",
      pothi: "Pothi", bookleaf: "BookLeaf", kobo: "Kobo", goodreads: "Goodreads",
      googleusercontent: "Google", play: "Google Play", barnesandnoble: "Barnes & Noble" };
    for (const k in known) if (h.includes(k)) return known[k];
    const base = h.split(".")[0];
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : "store";
  } catch (e) { return "store"; }
};

// Turn an Amazon product URL into its customer-reviews page, keeping the same
// marketplace domain (amazon.in / amazon.com …). Returns null if the URL isn't
// a parseable Amazon product link. We only ever LINK to Amazon's reviews — we
// never fetch, scrape or copy the review content (no API allows it, and doing
// so would breach Amazon's terms).
const amazonReviewsUrl = (url) => {
  try {
    const u = new URL(url);
    if (!/(^|\.)amazon\./i.test(u.hostname)) return null;
    const m = u.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|product-reviews)\/([A-Z0-9]{10})/i)
      || u.pathname.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
    if (!m) return null;
    return `${u.protocol}//${u.hostname}/product-reviews/${m[1]}`;
  } catch (e) { return null; }
};
