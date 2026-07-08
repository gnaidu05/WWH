# Kitaab — किताब

**The marketplace for Indian authors, publishers, distributors, reviewers and readers.**

India's book world is thriving but scattered across a dozen disconnected tools:
one platform to publish, another to sell, spreadsheets of reviewers, WhatsApp
groups for events, cold emails to distributors. **Kitaab** brings it together in
a single, welcoming home.

- **Authors** create a page, list their books in any language, and host
  engagement activities — launches, readings, AMAs, workshops, book clubs.
- **Publishers, distributors and reviewers** share their quotations openly and
  get discovered by authors who need exactly what they offer.
- **Readers** discover, buy and celebrate Indian writing — filtered by language,
  genre and region — and join live events with the authors they love.

The name *Kitaab* (किताब) means "the book" — the vessel that carries a story
from one mind to another, across languages and generations.

---

## Why it exists

There was no single platform where authors could *list books + run events + get
discovered* while publishers, distributors and reviewers *share quotations and
connect* in one marketplace. Existing services each solve one slice:

| Need | Existing (fragmented) | Kitaab |
| --- | --- | --- |
| Publish & sell | Notion Press, BookLeaf, Pothi, KDP | ✅ built-in listings |
| Community & events | Booknerds (meetups only) | ✅ host & announce activities |
| Reviews | scattered bloggers | ✅ reviewer quotations |
| Distribution | separate service providers | ✅ distributor quotations |
| **All of the above, together** | — | ✅ **one marketplace** |

## Design

A warm, India-inspired, modern literary aesthetic that's attractive to everyone
and easy to navigate:

- **Palette** — saffron/marigold gold, deep peacock teal, warm cream paper, and
  a maroon accent. Full light/dark theme support.
- **Type** — elegant serif headings paired with a clean sans body.
- **Navigation** — a sticky top nav with clear sections and role-based calls to
  action, responsive down to mobile.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Landing — hero, the four audiences, featured books/authors/events, how it works |
| `books.html` | Book marketplace with genre & language filters and live search |
| `authors.html` | Author directory with search and genre filters |
| `events.html` | Engagement activities with type filters |
| `partners.html` | Publisher / distributor / reviewer quotations marketplace |
| `join.html` | Role-based sign-up (Author, Publisher, Distributor, Reviewer, Reader) |
| `about.html` | Mission, principles and FAQ |

## Real accounts (Supabase backend)

Kitaab supports **real signup / login and a live database** via
[Supabase](https://supabase.com) — called directly from the browser, so it
works on GitHub Pages with no server of your own. Until it's configured the
site runs in **demo mode** (sample data; Join/Sign-in explain the backend
isn't connected). To turn on real accounts:

1. **Create a free Supabase project** at [supabase.com](https://supabase.com).
2. **Create the tables.** In the project: *SQL Editor → New query* → paste all
   of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the
   `profiles`, `books` and `events` tables, the signup trigger, and Row Level
   Security policies.
3. **Add your keys.** In *Project Settings → API*, copy the **Project URL** and
   the **anon / public** key into [`assets/js/supabase-config.js`](assets/js/supabase-config.js):
   ```js
   window.KALAM_SUPABASE = {
     url: "https://YOUR-PROJECT.supabase.co",
     anonKey: "eyJhbGci...your-anon-key..."
   };
   ```
   The anon key is a **public** client key — safe to commit. Your data is
   protected by Row Level Security, not by hiding the key.

That's it. Signup now creates a real account, the header shows a logged-in
state, and the **author dashboard** (`dashboard.html`) lets authors list books
and announce events that appear live across the marketplace.

**Tip:** by default Supabase emails a confirmation link before first login. To
let people sign in instantly during testing, turn off *Authentication →
Sign In / Providers → Email → "Confirm email"* in the Supabase dashboard.

### What's wired up

| Page | Backed by |
| --- | --- |
| `join.html` | `supabase.auth.signUp` + profile auto-created by a DB trigger |
| `signin.html` | `supabase.auth.signInWithPassword` |
| `dashboard.html` | add/list your own books & events (RLS: owner-only writes) |
| `books` / `authors` / `events` | live rows merged in front of the demo samples |

## Run locally

It's a static site — no build step.

```bash
# any static server works
python3 -m http.server 8000
# then open http://localhost:8000
```

Deployment is handled by the GitHub Pages workflow in `.github/workflows/pages.yml`.

## Structure

```
index.html, books.html, authors.html, events.html, partners.html, join.html, about.html
assets/
  css/styles.css        # design system (colours, components, light/dark)
  js/data.js            # sample marketplace data (books, authors, events, quotes)
  js/main.js            # theme toggle, mobile nav, card renderers
  js/components.js      # shared header/footer injection
  js/filters.js         # search + filter logic for listing pages
```

Sample data is rendered client-side to demonstrate the marketplace; in
production it would come from an API.
