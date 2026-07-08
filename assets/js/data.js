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

const QUOTES = [
  { name: "Peacock Press", kind: "Publisher", color: 0, price: "₹35,000", unit: "full package", items: ["Editing + proofreading", "Cover & interior design", "ISBN & print-on-demand", "60% author royalty"], badge: "Publisher" },
  { name: "InkRoute Distribution", kind: "Distributor", color: 2, price: "12%", unit: "per sale", items: ["Amazon, Flipkart & 30k stores", "Global POD network", "Monthly payout dashboard", "No upfront fee"], badge: "Distributor" },
  { name: "Lakshmi Reviews", kind: "Reviewer", color: 1, price: "₹2,500", unit: "per title", items: ["Verified reader review", "Goodreads + blog feature", "5-day turnaround", "Social media mention"], badge: "Reviewer" },
  { name: "Sahitya House", kind: "Publisher", color: 3, price: "₹60,000", unit: "premium", items: ["Developmental editing", "Hardcover + eBook + audio", "PR & launch campaign", "Bookstore placement"], badge: "Publisher" },
  { name: "PustakDirect", kind: "Distributor", color: 4, price: "10%", unit: "per sale", items: ["Regional-language focus", "College & library supply", "Bulk order handling", "Weekly settlements"], badge: "Distributor" },
  { name: "The Margin Note", kind: "Reviewer", color: 5, price: "₹1,800", unit: "per title", items: ["In-depth critical review", "YouTube & Instagram reel", "Author interview option", "3-day turnaround"], badge: "Reviewer" },
];

const initials = (name) => name.replace(/[^A-Za-zऀ-෿ ]/g, "").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "★";
const stars = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
