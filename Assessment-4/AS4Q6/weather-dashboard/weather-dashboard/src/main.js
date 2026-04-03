/**
 * main.js — Application entry point
 *
 * Architecture: Vanilla JS, no framework.
 * State is held in `appState`. Re-renders happen on state changes.
 *
 * Data flow:
 *  User types city → geocodeCity() → fetchWeather() → renderDashboard()
 */

import { renderHeader } from './components/header.js';
import { renderSearch, showSearchError, setSearchLoading } from './components/search.js';
import { renderDashboard, renderEmptyState } from './components/dashboard.js';
import { geocodeCity, fetchWeather } from './utils/weather.js';

// ── Application State ──────────────────────────
const appState = {
  unit: localStorage.getItem('weather_unit') || 'celsius',
  location: null,
  weather: null,
  loading: false,
};

// ── DOM Regions ────────────────────────────────
const headerEl = document.createElement('div');
const searchEl = document.createElement('div');
const mainEl = document.createElement('div');

mainEl.style.flex = '1';

document.getElementById('app').append(headerEl, searchEl, mainEl);

// ── Render Header ──────────────────────────────
let cleanupHeader = null;

function mountHeader() {
  if (cleanupHeader) cleanupHeader();
  cleanupHeader = renderHeader(headerEl, {
    unit: appState.unit,
    onUnitChange: async (newUnit) => {
      appState.unit = newUnit;
      localStorage.setItem('weather_unit', newUnit);
      mountHeader(); // re-render header to update active button

      if (appState.location) {
        // Re-fetch with new unit
        await loadWeather(appState.location.name);
      }
    }
  });
}

// ── Render Search ──────────────────────────────
function mountSearch() {
  renderSearch(searchEl, { onSearch: loadWeather });
}

// ── Core: load weather for a city ─────────────
async function loadWeather(cityQuery) {
  appState.loading = true;
  setSearchLoading(true);

  try {
    // 1. Geocode
    const location = await geocodeCity(cityQuery);
    appState.location = location;

    // 2. Fetch weather
    const weather = await fetchWeather(
      location.lat,
      location.lon,
      location.timezone,
      appState.unit
    );
    appState.weather = weather;

    // 3. Render dashboard
    renderDashboard(mainEl, {
      location,
      weather,
      unit: appState.unit
    });

    // Save last city
    localStorage.setItem('weather_last_city', cityQuery);

  } catch (err) {
    console.error(err);
    showSearchError(err.message || 'Something went wrong. Please try again.');
  } finally {
    appState.loading = false;
    setSearchLoading(false);
  }
}

// ── Boot ───────────────────────────────────────
function boot() {
  mountHeader();
  mountSearch();
  renderEmptyState(mainEl);

  // Restore last searched city
  const lastCity = localStorage.getItem('weather_last_city');
  if (lastCity) {
    loadWeather(lastCity);
  }
}

boot();
