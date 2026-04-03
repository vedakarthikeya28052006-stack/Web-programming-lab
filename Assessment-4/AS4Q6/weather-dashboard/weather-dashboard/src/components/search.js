/**
 * search.js — City search bar component
 */

export function renderSearch(container, { onSearch }) {
  container.innerHTML = `
    <div class="search-container">
      <div class="search-bar">
        <input
          type="text"
          id="city-input"
          placeholder="Search a city — London, Tokyo, New York…"
          autocomplete="off"
          spellcheck="false"
        />
        <button id="search-btn">Search</button>
      </div>
      <div class="search-error" id="search-error"></div>
    </div>
  `;

  const input = document.getElementById('city-input');
  const btn = document.getElementById('search-btn');

  function submit() {
    const val = input.value.trim();
    if (val) {
      clearError();
      onSearch(val);
    }
  }

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') submit();
  });

  // Auto-focus
  input.focus();
}

export function showSearchError(message) {
  const el = document.getElementById('search-error');
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
  }
}

export function clearError() {
  const el = document.getElementById('search-error');
  if (el) el.classList.remove('visible');
}

export function setSearchLoading(loading) {
  const btn = document.getElementById('search-btn');
  const input = document.getElementById('city-input');
  if (btn) btn.textContent = loading ? '…' : 'Search';
  if (input) input.disabled = loading;
}
