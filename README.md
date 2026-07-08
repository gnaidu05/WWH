# Kalam — कलम

**The marketplace for Indian authors, publishers, distributors, reviewers and readers.**

India's book world is thriving but scattered across a dozen disconnected tools:
one platform to publish, another to sell, spreadsheets of reviewers, WhatsApp
groups for events, cold emails to distributors. **Kalam** brings it together in
a single, welcoming home.

- **Authors** create a page, list their books in any language, and host
  engagement activities — launches, readings, AMAs, workshops, book clubs.
- **Publishers, distributors and reviewers** share their quotations openly and
  get discovered by authors who need exactly what they offer.
- **Readers** discover, buy and celebrate Indian writing — filtered by language,
  genre and region — and join live events with the authors they love.

The name *Kalam* (कलम) means "the pen" — the simplest, most powerful tool a
storyteller has.

---

## Why it exists

There was no single platform where authors could *list books + run events + get
discovered* while publishers, distributors and reviewers *share quotations and
connect* in one marketplace. Existing services each solve one slice:

| Need | Existing (fragmented) | Kalam |
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
