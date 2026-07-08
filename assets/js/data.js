/* Sample marketplace data for Kalam — demo content rendered client-side.
   In production this would come from an API. */

const COVER_GRADS = [
  "linear-gradient(160deg,#1F5E5B,#16413F)",
  "linear-gradient(160deg,#9E3B2E,#6f261c)",
  "linear-gradient(160deg,#C9741A,#A25911)",
  "linear-gradient(160deg,#2E2A5E,#1b1840)",
  "linear-gradient(160deg,#4A6B2A,#31491b)",
  "linear-gradient(160deg,#8A5A9E,#5f3d6e)",
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
