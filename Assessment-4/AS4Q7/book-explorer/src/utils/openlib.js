// utils/openlib.js — Open Library API helpers

const BASE    = 'https://openlibrary.org';
const COVERS  = 'https://covers.openlibrary.org/b';

export function coverUrl(id, size = 'M') {
  if (!id) return null;
  return `${COVERS}/id/${id}-${size}.jpg`;
}

export function authorCoverUrl(olid, size = 'M') {
  if (!olid) return null;
  return `${COVERS}/olid/${olid}-${size}.jpg`;
}

/** Search books */
export async function searchBooks(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const url = `${BASE}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median,subject,ratings_average,ratings_count,edition_count,language`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return {
    total: data.numFound,
    books: data.docs.map(normalizeBook),
  };
}

/** Search autocomplete suggestions */
export async function autocomplete(query) {
  const url = `${BASE}/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs.map(normalizeBook);
}

/** Fetch full book details by Open Library key e.g. /works/OL12345W */
export async function fetchBookDetails(key) {
  const url = `${BASE}${key}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load book details');
  return res.json();
}

/** Fetch author details */
export async function fetchAuthor(authorKey) {
  const url = `${BASE}${authorKey}.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function normalizeBook(doc) {
  return {
    key:         doc.key,
    title:       doc.title || 'Unknown Title',
    authors:     doc.author_name || [],
    year:        doc.first_publish_year || null,
    coverId:     doc.cover_i || null,
    pages:       doc.number_of_pages_median || null,
    subjects:    (doc.subject || []).slice(0, 12),
    rating:      doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : null,
    ratingCount: doc.ratings_count || 0,
    editions:    doc.edition_count || 1,
    languages:   doc.language || [],
  };
}

export function starsHtml(rating) {
  if (!rating) return '';
  const full  = Math.round(rating);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="modal-star ${i <= full ? 'on' : ''}">★</span>`;
  }
  return html;
}

export function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
