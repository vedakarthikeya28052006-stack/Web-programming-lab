/**
 * header.js — Renders the sticky header with logo, clock, and unit toggle
 */

export function renderHeader(container, { unit, onUnitChange }) {
  container.innerHTML = `
    <div class="header">
      <div class="header__logo">
        <span>◉</span> Atmosphere
      </div>
      <div class="header__right">
        <div class="header__time" id="clock"></div>
        <div class="unit-toggle">
          <button id="btn-c" class="${unit === 'celsius' ? 'active' : ''}">°C</button>
          <button id="btn-f" class="${unit === 'fahrenheit' ? 'active' : ''}">°F</button>
        </div>
      </div>
    </div>
  `;

  // Live clock
  function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) {
      clock.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    }
  }
  updateClock();
  const interval = setInterval(updateClock, 1000);

  // Unit toggle
  document.getElementById('btn-c')?.addEventListener('click', () => onUnitChange('celsius'));
  document.getElementById('btn-f')?.addEventListener('click', () => onUnitChange('fahrenheit'));

  return () => clearInterval(interval); // cleanup
}
