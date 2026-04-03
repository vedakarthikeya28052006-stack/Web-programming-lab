// components/header.js — Logo, search bar, view toggle

import { autocomplete, debounce } from '../utils/openlib.js';

export function renderHeader(container, { onSearch, onViewChange, currentView }) {
  container.innerHTML = `
    <button class="logo" id="logo-btn">
      <span class="logo-icon">📚</span>
      <span>Folio</span>
    </button>

    <div class="search-wrapper">
      <input type="text" id="search-input" placeholder="Search books, authors, subjects…" autocomplete="off"/>
      <button class="search-btn" id="search-btn" title="Search">🔍</button>
      <div id="autocomplete-list" class="autocomplete-list hidden"></div>
    </div>

    <div class="view-toggle">
      <button class="view-btn ${currentView === 'grid' ? 'active' : ''}" id="btn-grid" title="Grid view">⊞</button>
      <button class="view-btn ${currentView === 'list' ? 'active' : ''}" id="btn-list" title="List view">☰</button>
    </div>
  `;

  const input    = container.querySelector('#search-input');
  const searchBtn = container.querySelector('#search-btn');
  const autoList  = container.querySelector('#autocomplete-list');
  const logoBtn   = container.querySelector('#logo-btn');
  const btnGrid   = container.querySelector('#btn-grid');
  const btnList   = container.querySelector('#btn-list');

  function doSearch() {
    const q = input.value.trim();
    if (!q) return;
    autoList.classList.add('hidden');
    onSearch(q);
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') autoList.classList.add('hidden');
  });
  searchBtn.addEventListener('click', doSearch);

  logoBtn.addEventListener('click', () => {
    input.value = '';
    autoList.classList.add('hidden');
    onSearch(null); // null = go home
  });

  // Autocomplete
  const suggest = debounce(async (q) => {
    if (q.length < 2) { autoList.classList.add('hidden'); return; }
    try {
      const results = await autocomplete(q);
      renderAutocomplete(autoList, results, (book) => {
        input.value = book.title;
        autoList.classList.add('hidden');
        onSearch(book.title);
      });
    } catch { autoList.classList.add('hidden'); }
  }, 300);

  input.addEventListener('input', e => suggest(e.target.value.trim()));

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) autoList.classList.add('hidden');
  });

  // View toggle
  btnGrid.addEventListener('click', () => {
    btnGrid.classList.add('active');
    btnList.classList.remove('active');
    onViewChange('grid');
  });
  btnList.addEventListener('click', () => {
    btnList.classList.add('active');
    btnGrid.classList.remove('active');
    onViewChange('list');
  });
}

function renderAutocomplete(container, books, onSelect) {
  container.innerHTML = '';
  if (!books.length) { container.classList.add('hidden'); return; }
  books.forEach(b => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    const author = b.authors[0] || '';
    item.innerHTML = `
      <span class="autocomplete-title">${b.title}</span>
      <span class="autocomplete-author">${author}</span>
    `;
    item.addEventListener('click', () => onSelect(b));
    container.appendChild(item);
  });
  container.classList.remove('hidden');
}
