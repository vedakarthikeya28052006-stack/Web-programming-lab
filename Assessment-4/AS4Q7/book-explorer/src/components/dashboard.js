// components/dashboard.js — All book result cards and panels

import { coverUrl, starsHtml } from '../utils/openlib.js';

const FILTER_SUBJECTS = ['All', 'Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Biography', 'History', 'Science', 'Philosophy', 'Romance', 'Horror', 'Poetry'];

export function renderDashboard(container, { results, query, view, favorites, onBookClick, onSubjectFilter, onLoadMore, activeFilter }) {
  const { books, total, page } = results;

  const hasMore = books.length < total && page * 20 < total;

  container.innerHTML = `
    <!-- Results Header -->
    <div class="results-header">
      <h2 class="results-title">Results for <em>${escHtml(query)}</em></h2>
      <span class="results-count">${total.toLocaleString()} books found via Open Library</span>
    </div>

    <!-- Stats Row -->
    <div class="stats-row" id="stats-row"></div>

    <!-- Filter pills -->
    <div class="filter-bar" id="filter-bar"></div>

    <!-- Book results -->
    <div id="books-container"></div>

    <!-- Load more -->
    <div class="load-more-wrap" id="load-more-wrap" style="display:${hasMore ? 'flex' : 'none'}">
      <button class="load-more-btn" id="load-more-btn">Load more books</button>
    </div>

    <!-- Subjects panel -->
    <div class="panel" id="subjects-panel" style="display:none"></div>

    <!-- Saved shelf panel -->
    <div class="panel" id="shelf-panel"></div>
  `;

  renderStats(container.querySelector('#stats-row'), books, total);
  renderFilterBar(container.querySelector('#filter-bar'), activeFilter, onSubjectFilter);
  renderBooks(container.querySelector('#books-container'), books, view, onBookClick);

  // Subjects panel (from first book with subjects)
  const withSubjects = books.find(b => b.subjects && b.subjects.length > 4);
  if (withSubjects) {
    renderSubjectsPanel(container.querySelector('#subjects-panel'), withSubjects.subjects, onSubjectFilter);
    container.querySelector('#subjects-panel').style.display = '';
  }

  renderShelf(container.querySelector('#shelf-panel'), favorites, onBookClick);

  // Load more
  const loadBtn = container.querySelector('#load-more-btn');
  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      loadBtn.disabled = true;
      loadBtn.textContent = 'Loading…';
      onLoadMore();
    });
  }
}

function renderStats(container, books, total) {
  const withRating = books.filter(b => b.rating);
  const avgRating = withRating.length
    ? (withRating.reduce((s, b) => s + b.rating, 0) / withRating.length).toFixed(1)
    : '—';
  const langs = new Set(books.flatMap(b => b.languages || [])).size;
  const withPages = books.filter(b => b.pages);
  const avgPages = withPages.length
    ? Math.round(withPages.reduce((s, b) => s + b.pages, 0) / withPages.length)
    : '—';

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">📖</div>
      <div class="stat-label">Results</div>
      <div class="stat-value">${total >= 1000 ? (total/1000).toFixed(1)+'k' : total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⭐</div>
      <div class="stat-label">Avg Rating</div>
      <div class="stat-value">${avgRating}</div>
      ${avgRating !== '—' ? `<div class="stat-bar"><div class="stat-bar-fill" style="width:${(parseFloat(avgRating)/5)*100}%"></div></div>` : ''}
    </div>
    <div class="stat-card">
      <div class="stat-icon">🌐</div>
      <div class="stat-label">Languages</div>
      <div class="stat-value">${langs || '—'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📄</div>
      <div class="stat-label">Avg Pages</div>
      <div class="stat-value">${avgPages}</div>
    </div>
  `;
}

function renderFilterBar(container, activeFilter, onFilter) {
  container.innerHTML = FILTER_SUBJECTS.map(s => `
    <button class="filter-pill ${activeFilter === s ? 'active' : ''}" data-subject="${s}">${s}</button>
  `).join('');
  container.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => onFilter(btn.dataset.subject));
  });
}

export function renderBooks(container, books, view, onBookClick) {
  if (!books.length) {
    container.innerHTML = `<div class="error-msg">No books found for this filter. Try another.</div>`;
    return;
  }
  if (view === 'list') {
    renderListView(container, books, onBookClick);
  } else {
    renderGridView(container, books, onBookClick);
  }
}

function renderGridView(container, books, onClick) {
  const grid = document.createElement('div');
  grid.className = 'book-grid';
  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    const imgHtml = book.coverId
      ? `<img class="book-cover" src="${coverUrl(book.coverId, 'M')}" alt="${escHtml(book.title)}" loading="lazy" onerror="this.replaceWith(makePh())">`
      : `<div class="book-cover-placeholder"><span>📗</span><span class="ph-title">${escHtml(book.title)}</span></div>`;
    card.innerHTML = `
      ${imgHtml}
      <div class="book-info">
        <div class="book-title">${escHtml(book.title)}</div>
        <div class="book-author">${escHtml(book.authors[0] || 'Unknown')}</div>
        ${book.rating ? `<div class="book-rating">★ ${book.rating}</div>` : ''}
        <div class="book-year">${book.year || ''} ${book.pages ? '· ' + book.pages + ' pages' : ''}</div>
      </div>
    `;
    card.addEventListener('click', () => onClick(book));
    grid.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(grid);
}

function renderListView(container, books, onClick) {
  const list = document.createElement('div');
  list.className = 'book-list';
  books.forEach(book => {
    const item = document.createElement('div');
    item.className = 'book-list-item';
    const thumbHtml = book.coverId
      ? `<img class="book-list-thumb" src="${coverUrl(book.coverId, 'S')}" alt="" loading="lazy">`
      : `<div class="book-list-thumb-ph">📗</div>`;
    item.innerHTML = `
      ${thumbHtml}
      <div class="book-list-body">
        <div class="book-list-title">${escHtml(book.title)}</div>
        <div class="book-list-author">${escHtml(book.authors[0] || 'Unknown author')}</div>
        <div class="book-list-meta">
          ${book.year ? `<span>📅 ${book.year}</span>` : ''}
          ${book.pages ? `<span>📄 ${book.pages}p</span>` : ''}
          ${book.rating ? `<span>⭐ ${book.rating}</span>` : ''}
          ${book.editions > 1 ? `<span>📚 ${book.editions} editions</span>` : ''}
        </div>
      </div>
      <span class="book-list-arrow">›</span>
    `;
    item.addEventListener('click', () => onClick(book));
    list.appendChild(item);
  });
  container.innerHTML = '';
  container.appendChild(list);
}

function renderSubjectsPanel(container, subjects, onFilter) {
  container.innerHTML = `
    <h3 class="panel-title">Related Subjects</h3>
    <div class="subjects-scroll">
      ${subjects.map(s => `<button class="subject-chip" data-subject="${escHtml(s)}">${escHtml(s)}</button>`).join('')}
    </div>
  `;
  container.querySelectorAll('.subject-chip').forEach(btn => {
    btn.addEventListener('click', () => onFilter(btn.dataset.subject));
  });
}

export function renderShelf(container, favorites, onBookClick) {
  container.innerHTML = `<h3 class="panel-title">📌 Your Shelf</h3>`;
  if (!favorites.length) {
    container.innerHTML += `<p class="shelf-empty">No saved books yet. Click a book and hit Save.</p>`;
    return;
  }
  const scroll = document.createElement('div');
  scroll.className = 'shelf-scroll';
  favorites.forEach(book => {
    const item = document.createElement('div');
    item.className = 'shelf-item';
    const imgHtml = book.coverId
      ? `<img class="shelf-cover" src="${coverUrl(book.coverId, 'S')}" alt="" loading="lazy">`
      : `<div class="shelf-cover-ph">📗</div>`;
    item.innerHTML = `${imgHtml}<div class="shelf-title">${escHtml(book.title)}</div>`;
    item.addEventListener('click', () => onBookClick(book));
    scroll.appendChild(item);
  });
  container.appendChild(scroll);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
