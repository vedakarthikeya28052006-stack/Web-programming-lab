# 📚 Folio — Book Explorer

A beautiful book discovery app powered by the **Open Library API**. No API key required.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Opens at **http://localhost:5173**

## Features

- 🔍 **Real-time search** — Search any book, author, or subject via Open Library
- 💡 **Autocomplete** — Instant suggestions as you type
- 📊 **Stats panel** — Avg rating, languages, page count across results
- 🗂️ **Subject filters** — Filter by Fiction, Sci-Fi, History and more
- ⊞ **Grid / List view** — Toggle between card grid and compact list
- 📖 **Book details modal** — Full description, subjects, rating, link to Open Library
- 📌 **My Shelf** — Save favourites, persisted via localStorage
- 🔁 **Load more** — Paginate through all results
- ↩️ **Last search restored** — Remembers your last query on reload

## Project Structure

```
book-explorer/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js                  # App entry, state, orchestration
    ├── styles/
    │   └── main.css             # All styles
    ├── components/
    │   ├── header.js            # Logo, search bar, view toggle
    │   ├── dashboard.js         # Stats row, book grid/list, panels
    │   └── modal.js             # Book detail modal
    └── utils/
        └── openlib.js           # Open Library API calls + helpers
```

## Build for Production

```bash
npm run build
npm run preview
```

## API

Uses the free [Open Library API](https://openlibrary.org/developers/api) — no key required.

- Search: `https://openlibrary.org/search.json`
- Book details: `https://openlibrary.org/works/{id}.json`
- Covers: `https://covers.openlibrary.org/b/id/{id}-M.jpg`
