// components/modal.js — Book detail modal

import { coverUrl, fetchBookDetails, fetchAuthor, starsHtml } from '../utils/openlib.js';

export async function openBookModal(book, { isFav, onToggleFav }) {
  const backdrop = document.getElementById('modal-backdrop');
  const panel    = document.getElementById('modal');

  // Show loading state
  panel.innerHTML = `
    <button class="modal-close" id="modal-close-btn">✕</button>
    <div style="padding:60px;display:flex;justify-content:center;align-items:center;gap:12px;color:var(--muted)">
      <div class="spinner"></div> Loading details…
    </div>
  `;
  backdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Close handlers
  function close() {
    backdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }
  document.getElementById('modal-close-btn').addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

  const escClose = e => { if (e.key === 'Escape') { close(); window.removeEventListener('keydown', escClose); } };
  window.addEventListener('keydown', escClose);

  // Fetch full details
  let details = null;
  let authorName = book.authors[0] || 'Unknown Author';
  try {
    details = await fetchBookDetails(book.key);
    // Try to get author details
    if (details.authors && details.authors.length) {
      try {
        const authorData = await fetchAuthor(details.authors[0].author.key);
        if (authorData && authorData.name) authorName = authorData.name;
      } catch {}
    }
  } catch {}

  const description = extractDescription(details);
  const subjects = details?.subjects?.slice(0, 12) || book.subjects || [];
  const firstSubject = subjects[0] || book.subjects?.[0] || 'Book';
  const pages = details?.number_of_pages || book.pages;
  const olUrl = `https://openlibrary.org${book.key}`;

  const coverHtml = book.coverId
    ? `<img class="modal-cover" src="${coverUrl(book.coverId, 'L')}" alt="${esc(book.title)}" onerror="this.style.display='none'">`
    : `<div class="modal-cover-ph">📗</div>`;

  panel.innerHTML = `
    <button class="modal-close" id="modal-close-btn2">✕</button>

    <div class="modal-hero">
      <div class="modal-cover-wrap">${coverHtml}</div>
      <div class="modal-meta">
        <span class="modal-subject-badge">${esc(firstSubject)}</span>
        <h2 class="modal-title">${esc(book.title)}</h2>
        <p class="modal-author">by ${esc(authorName)}</p>
        ${book.rating ? `
          <div class="modal-stars">
            ${starsHtml(book.rating)}
            <span class="modal-rating-txt">${book.rating} · ${book.ratingCount.toLocaleString()} ratings</span>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="modal-body">
      <div class="modal-stats">
        <div class="modal-stat-box">
          <span class="mstat-label">Year</span>
          <span class="mstat-value">${book.year || '—'}</span>
        </div>
        <div class="modal-stat-box">
          <span class="mstat-label">Pages</span>
          <span class="mstat-value">${pages || '—'}</span>
        </div>
        <div class="modal-stat-box">
          <span class="mstat-label">Editions</span>
          <span class="mstat-value">${book.editions || 1}</span>
        </div>
      </div>

      ${description ? `
        <div class="modal-section">
          <span class="modal-section-label">About</span>
          <p class="modal-description">${esc(description)}</p>
        </div>
      ` : ''}

      ${subjects.length ? `
        <div class="modal-section">
          <span class="modal-section-label">Subjects</span>
          <div class="modal-subjects">
            ${subjects.map(s => `<span class="modal-subject-tag">${esc(s)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <button class="modal-fav-btn ${isFav ? 'active' : ''}" id="fav-toggle-btn">
        <span>${isFav ? '♥' : '♡'}</span>
        ${isFav ? 'Remove from Shelf' : 'Save to My Shelf'}
      </button>

      <a class="modal-ol-link" href="${olUrl}" target="_blank" rel="noopener">
        🔗 View on Open Library
      </a>
    </div>
  `;

  document.getElementById('modal-close-btn2').addEventListener('click', close);

  document.getElementById('fav-toggle-btn').addEventListener('click', () => {
    const isNowFav = onToggleFav(book);
    const btn = document.getElementById('fav-toggle-btn');
    btn.classList.toggle('active', isNowFav);
    btn.innerHTML = `<span>${isNowFav ? '♥' : '♡'}</span> ${isNowFav ? 'Remove from Shelf' : 'Save to My Shelf'}`;
  });
}

function extractDescription(details) {
  if (!details) return '';
  const d = details.description;
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 600) + (d.length > 600 ? '…' : '');
  if (d.value) return d.value.slice(0, 600) + (d.value.length > 600 ? '…' : '');
  return '';
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
