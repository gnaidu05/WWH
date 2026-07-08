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

const BOOKS = [
  { title: "The Marigold Verses", author: "Ananya Rao", genre: "Poetry", lang: "English", price: 299, rating: 5, cover: 2 },
  { title: "Monsoon Letters", author: "Kabir Sen", genre: "Literary Fiction", lang: "English", price: 399, rating: 4, cover: 0 },
  { title: "किस्से रेत के", author: "Meera Joshi", genre: "Short Stories", lang: "Hindi", price: 249, rating: 5, cover: 1 },
  { title: "The Startup Sutra", author: "Vikram Nair", genre: "Business", lang: "English", price: 499, rating: 4, cover: 3 },
  { title: "Chai & Circuits", author: "Riya Mehta", genre: "Memoir", lang: "English", price: 349, rating: 5, cover: 2 },
  { title: "நிழல் நதி", author: "Arjun Balan", genre: "Literary Fiction", lang: "Tamil", price: 320, rating: 4, cover: 4 },
  { title: "The Deccan Detective", author: "Farah Khan", genre: "Mystery", lang: "English", price: 375, rating: 5, cover: 1 },
  { title: "প্রথম আলো ফিরে", author: "Sourav Dutta", genre: "Historical", lang: "Bengali", price: 450, rating: 4, cover: 5 },
  { title: "Yoga of Code", author: "Nikhil Rao", genre: "Non-fiction", lang: "English", price: 425, rating: 4, cover: 0 },
  { title: "Spice Route Tales", author: "Leela Pillai", genre: "Children", lang: "English", price: 199, rating: 5, cover: 2 },
  { title: "ಬೆಳಕಿನ ಹಾದಿ", author: "Ganesh Rao", genre: "Poetry", lang: "Kannada", price: 260, rating: 4, cover: 3 },
  { title: "The Last Ferry to Fort Kochi", author: "Ananya Rao", genre: "Mystery", lang: "English", price: 389, rating: 5, cover: 4 },
];

const AUTHORS = [
  { name: "Ananya Rao", role: "Novelist & Poet", city: "Bengaluru", books: 6, genres: ["Poetry", "Mystery"], color: 2 },
  { name: "Kabir Sen", role: "Literary Fiction", city: "Kolkata", books: 3, genres: ["Fiction"], color: 0 },
  { name: "Meera Joshi", role: "Hindi Storyteller", city: "Jaipur", books: 4, genres: ["Short Stories", "Hindi"], color: 1 },
  { name: "Vikram Nair", role: "Business Author", city: "Mumbai", books: 2, genres: ["Business"], color: 3 },
  { name: "Farah Khan", role: "Crime Writer", city: "Hyderabad", books: 5, genres: ["Mystery"], color: 4 },
  { name: "Leela Pillai", role: "Children's Author", city: "Kochi", books: 8, genres: ["Children"], color: 5 },
  { name: "Arjun Balan", role: "Tamil Novelist", city: "Chennai", books: 3, genres: ["Fiction", "Tamil"], color: 0 },
  { name: "Riya Mehta", role: "Memoirist", city: "Pune", books: 1, genres: ["Memoir"], color: 2 },
];

const EVENTS = [
  { day: "18", month: "Jul", type: "Book Launch", title: "The Marigold Verses — Launch & Reading", author: "Ananya Rao", mode: "Bengaluru · In-person", time: "6:30 PM" },
  { day: "22", month: "Jul", type: "AMA", title: "Ask Me Anything: Writing Crime Fiction", author: "Farah Khan", mode: "Online · Zoom", time: "8:00 PM" },
  { day: "27", month: "Jul", type: "Workshop", title: "Poetry in Your Mother Tongue", author: "Meera Joshi", mode: "Online", time: "5:00 PM" },
  { day: "02", month: "Aug", type: "Reading", title: "Monsoon Letters — Chapter Reading", author: "Kabir Sen", mode: "Kolkata · In-person", time: "7:00 PM" },
  { day: "09", month: "Aug", type: "Panel", title: "The Future of Indian Publishing", author: "5 speakers", mode: "Delhi · Hybrid", time: "4:00 PM" },
  { day: "15", month: "Aug", type: "Book Club", title: "Independence Day Reads — Live Discussion", author: "Community", mode: "Online", time: "11:00 AM" },
];

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
