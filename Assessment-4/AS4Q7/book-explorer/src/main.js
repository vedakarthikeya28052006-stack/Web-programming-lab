// main.js — App entry, state, orchestration

import { renderHeader } from './components/header.js';
import { renderDashboard, renderBooks, renderShelf } from './components/dashboard.js';
import { openBookModal } from './components/modal.js';
import { searchBooks } from './utils/openlib.js';

// ── STATE ──────────────────────────────────────────────────────────────────
const state = {
  query:        '',
  results:      { books: [], total: 0, page: 1 },
  view:         loadPref('folio-view', 'grid'),
  activeFilter: 'All',
  favorites:    loadPref('folio-favs', []),
  loading:      false,
};

// ── DOM REFS ───────────────────────────────────────────────────────────────
const $header    = document.getElementById('header');
const $welcome   = document.getElementById('welcome');
const $loading   = document.getElementById('loading');
const $error     = document.getElementById('error-msg');
const $dashboard = document.getElementById('dashboard');

// ── INIT ───────────────────────────────────────────────────────────────────
renderHeader($header, {
  onSearch:     handleSearch,
  onViewChange: handleViewChange,
  currentView:  state.view,
});

// Welcome suggestion buttons
document.querySelectorAll('.suggestion-btn').forEach(btn => {
  btn.addEventListener('click', () => handleSearch(btn.dataset.query));
});

showScreen('welcome');

// Restore last query
const lastQuery = loadPref('folio-last-query', null);
if (lastQuery) handleSearch(lastQuery);

// ── HANDLERS ──────────────────────────────────────────────────────────────
async function handleSearch(query) {
  if (!query) { showScreen('welcome'); return; }

  state.query        = query;
  state.activeFilter = 'All';
  state.results      = { books: [], total: 0, page: 1 };

  savePref('folio-last-query', query);
  showScreen('loading');

  try {
    const data = await searchBooks(query, 1, 20);
    state.results = { books: data.books, total: data.total, page: 1 };
    showScreen('dashboard');
    paint();
  } catch (err) {
    showError('Could not reach Open Library. Check your connection and try again.');
  }
}

async function handleLoadMore() {
  const nextPage = state.results.page + 1;
  try {
    const data = await searchBooks(state.query, nextPage, 20);
    state.results.books = [...state.results.books, ...data.books];
    state.results.page  = nextPage;
    paint();
  } catch {
    showError('Failed to load more results.');
  }
}

function handleViewChange(view) {
  state.view = view;
  savePref('folio-view', view);
  paint();
}

function handleSubjectFilter(subject) {
  state.activeFilter = subject;
  paint();
}

function handleBookClick(book) {
  openBookModal(book, {
    isFav:        isFav(book),
    onToggleFav:  toggleFav,
  });
}

// ── FAVORITES ─────────────────────────────────────────────────────────────
function isFav(book) {
  return state.favorites.some(f => f.key === book.key);
}

function toggleFav(book) {
  if (isFav(book)) {
    state.favorites = state.favorites.filter(f => f.key !== book.key);
  } else {
    state.favorites = [book, ...state.favorites];
  }
  savePref('folio-favs', state.favorites);
  // Re-render shelf in dashboard if visible
  const shelfPanel = document.getElementById('shelf-panel');
  if (shelfPanel) renderShelf(shelfPanel, state.favorites, handleBookClick);
  return isFav(book);
}

// ── RENDER ─────────────────────────────────────────────────────────────────
function paint() {
  const filtered = filterBooks(state.results.books, state.activeFilter);

  renderDashboard($dashboard, {
    results:       { books: filtered, total: state.results.total, page: state.results.page },
    query:         state.query,
    view:          state.view,
    favorites:     state.favorites,
    activeFilter:  state.activeFilter,
    onBookClick:   handleBookClick,
    onSubjectFilter: handleSubjectFilter,
    onLoadMore:    handleLoadMore,
  });
}

function filterBooks(books, filter) {
  if (filter === 'All') return books;
  const f = filter.toLowerCase();
  return books.filter(b =>
    b.subjects.some(s => s.toLowerCase().includes(f))
  );
}

// ── SCREENS ───────────────────────────────────────────────────────────────
function showScreen(screen) {
  $welcome.classList.add('hidden');
  $loading.classList.add('hidden');
  $error.classList.add('hidden');
  $dashboard.classList.add('hidden');

  if (screen === 'welcome')   $welcome.classList.remove('hidden');
  if (screen === 'loading')   $loading.classList.remove('hidden');
  if (screen === 'dashboard') $dashboard.classList.remove('hidden');
}

function showError(msg) {
  $error.textContent = `⚠️ ${msg}`;
  $error.classList.remove('hidden');
  $loading.classList.add('hidden');
  $dashboard.classList.add('hidden');
}

// ── STORAGE ───────────────────────────────────────────────────────────────
function loadPref(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

function savePref(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
