// app.js — Main application controller for Nimbus Weather Dashboard

const App = (() => {
  let currentData = null;
  let unit = 'C'; // 'C' or 'F'
  let clockInterval = null;
  let isDemoMode = false;

  // ---- API calls ----

  async function fetchWeatherByCity(city) {
    UI.showLoading();
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (data.error) { UI.showError(data.error); return; }
      currentData = data;
      UI.renderWeather(data, unit);
      checkDemoMode(data);
      startClock();
    } catch (e) {
      UI.showError('Could not connect to the server. Make sure the server is running.');
    }
  }

  async function fetchWeatherByCoords(lat, lon) {
    UI.showLoading();
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.error) { UI.showError(data.error); return; }
      currentData = data;
      UI.renderWeather(data, unit);
      checkDemoMode(data);
      startClock();
    } catch (e) {
      UI.showError('Could not connect to the server. Make sure the server is running.');
    }
  }

  async function searchCities(q) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      return await res.json();
    } catch {
      return [];
    }
  }

  function checkDemoMode(data) {
    // If timezone is suspiciously round and city is in our mock list, show demo banner
    if (!isDemoMode && (data.city === 'Demo City' || !window.location.hostname.includes('production'))) {
      fetch('/api/weather?city=__demo_check__')
        .then(r => r.json())
        .then(d => {
          if (d.city === '__demo_check__' || d.city === 'Demo City' || data.temp === 18) {
            // Heuristic: if we got back our exact mock temp, we're in demo mode
          }
        }).catch(() => {});
    }
    // Check by fetching a sentinel
    fetch('/api/search?q=zzz_sentinel')
      .then(r => r.json())
      .then(cities => {
        if (Array.isArray(cities) && cities.length === 0 && !isDemoMode) {
          // Might be demo. Show banner if temp matches exactly
          if (data.temp === 18 && data.humidity === 72) {
            isDemoMode = true;
            UI.showDemoBanner();
          }
        }
      }).catch(() => {});
  }

  // ---- Clock ----

  function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(() => {
      if (currentData) {
        const el = document.getElementById('local-time');
        if (el) el.textContent = Utils.formatLocalDateTime(currentData.timezone);
      }
    }, 30000); // update every 30s
  }

  // ---- Geolocation ----

  function locateUser() {
    if (!navigator.geolocation) {
      UI.showError('Geolocation is not supported by your browser.');
      return;
    }
    UI.showLoading();
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      err => {
        UI.showError('Location access denied. Please search for a city manually.');
      }
    );
  }

  // ---- Unit toggle ----

  function setUnit(newUnit) {
    unit = newUnit;
    document.getElementById('btn-c').classList.toggle('active', unit === 'C');
    document.getElementById('btn-f').classList.toggle('active', unit === 'F');
    if (currentData) UI.renderWeather(currentData, unit);
  }

  // ---- Search / autocomplete ----

  const debouncedSearch = Utils.debounce(async (q) => {
    if (q.length < 2) { UI.hideAutocomplete(); return; }
    const cities = await searchCities(q);
    UI.renderAutocomplete(cities, (city) => {
      document.getElementById('search-input').value = city.name;
      fetchWeatherByCoords(city.lat, city.lon);
    });
  }, 300);

  // ---- Event listeners ----

  function init() {
    // Search input
    const input = document.getElementById('search-input');
    input.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        UI.hideAutocomplete();
        if (val) fetchWeatherByCity(val);
      }
      if (e.key === 'Escape') UI.hideAutocomplete();
    });

    // Locate buttons
    document.getElementById('locate-btn').addEventListener('click', locateUser);
    document.getElementById('welcome-locate').addEventListener('click', locateUser);

    // Unit toggle
    document.getElementById('btn-c').addEventListener('click', () => setUnit('C'));
    document.getElementById('btn-f').addEventListener('click', () => setUnit('F'));

    // Close autocomplete on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) UI.hideAutocomplete();
    });

    // Start at welcome screen
    UI.showWelcome();

    // If we're in a browser that supports geolocation, offer auto-detect
    // (don't auto-request location; just show welcome)
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
