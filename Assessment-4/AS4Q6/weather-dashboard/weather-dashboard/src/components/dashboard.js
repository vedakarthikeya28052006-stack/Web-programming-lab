/**
 * dashboard.js — Renders all weather cards into the grid
 */

import {
  interpretWeatherCode,
  formatTime,
  formatDay,
  degreesToCompass,
  uvRisk,
  formatVisibility
} from '../utils/weather.js';

const unitSymbol = (unit) => unit === 'fahrenheit' ? '°F' : '°C';
const windUnit = () => 'km/h';

export function renderEmptyState(container) {
  container.innerHTML = `
    <div class="dashboard">
      <div class="empty-state">
        <span class="empty-state__glyph">⛅</span>
        <h2 class="empty-state__title">No city selected</h2>
        <p class="empty-state__sub">Search for any city above to see current conditions, forecasts, and more.</p>
      </div>
    </div>
  `;
}

export function renderDashboard(container, { location, weather, unit }) {
  const cur = weather.current;
  const daily = weather.daily;
  const hourly = weather.hourly;

  const { icon: curIcon, label: curLabel } = interpretWeatherCode(cur.weather_code);
  const sym = unitSymbol(unit);

  const round = (n) => Math.round(n);

  // Build hourly slice (next 24 hours, every 2 hours = 12 bars)
  const now = new Date();
  const hourlyTemps = [];
  for (let i = 0; i < hourly.time.length && hourlyTemps.length < 12; i++) {
    const t = new Date(hourly.time[i]);
    if (t >= now) {
      hourlyTemps.push({
        time: t.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temp: round(hourly.temperature_2m[i]),
        prob: hourly.precipitation_probability[i] ?? 0
      });
    }
  }

  // Take every 2nd to reduce density
  const hourlySlice = hourlyTemps.filter((_, i) => i % 2 === 0).slice(0, 12);

  // Hourly bar heights (relative)
  const temps = hourlySlice.map(h => h.temp);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const range = maxT - minT || 1;
  const barHeight = (t) => Math.max(12, Math.round(((t - minT) / range) * 80 + 12));

  // 7-day forecast (skip today = index 0)
  const forecastDays = Array.from({ length: 6 }, (_, i) => i + 1).map(i => ({
    day: formatDay(daily.time[i]),
    icon: interpretWeatherCode(daily.weather_code[i]).icon,
    high: round(daily.temperature_2m_max[i]),
    low: round(daily.temperature_2m_min[i]),
    rain: daily.precipitation_probability_max[i] ?? 0
  }));

  // Sunrise / sunset
  const sunrise = formatTime(daily.sunrise[0]);
  const sunset = formatTime(daily.sunset[0]);

  // Sun progress arc
  const nowMs = Date.now();
  const sunriseMs = new Date(daily.sunrise[0]).getTime();
  const sunsetMs = new Date(daily.sunset[0]).getTime();
  const dayLength = sunsetMs - sunriseMs;
  let sunPct = Math.max(0, Math.min(1, (nowMs - sunriseMs) / dayLength));

  // UV
  const uv = cur.uv_index ?? daily.uv_index_max?.[0] ?? 0;
  const uvInfo = uvRisk(uv);

  // Wind
  const windDir = degreesToCompass(cur.wind_direction_10m);
  const windDeg = cur.wind_direction_10m;

  // Pressure
  const pressure = Math.round(cur.surface_pressure);

  // Visibility
  const vis = formatVisibility((cur.visibility ?? 10000));

  container.innerHTML = `
    <div class="dashboard">

      <!-- Hero: Current Weather -->
      <div class="card card--hero" style="animation-delay:0.05s">
        <div class="card__label">Current Conditions · ${location.name}</div>
        <div class="hero__location">${location.name}</div>
        <div class="hero__country">${location.country}</div>
        <div class="hero__bottom">
          <div class="hero__temp">
            ${round(cur.temperature_2m)}<sup>${sym}</sup>
          </div>
          <div class="hero__meta">
            <div class="hero__icon">${curIcon}</div>
            <div class="hero__condition">${curLabel}</div>
            <div class="hero__feels">Feels like ${round(cur.apparent_temperature)}${sym}</div>
          </div>
        </div>
      </div>

      <!-- Sun: Sunrise/Sunset -->
      <div class="card card--sun" style="animation-delay:0.10s">
        <div class="card__label">Sun · Day Arc</div>
        <div class="sun__arc-container">
          <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Track -->
            <path d="M 10 90 A 90 90 0 0 1 190 90"
              fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="3" stroke-linecap="round"/>
            <!-- Progress -->
            <path d="M 10 90 A 90 90 0 0 1 190 90"
              fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="3"
              stroke-linecap="round"
              stroke-dasharray="283"
              stroke-dashoffset="${Math.round(283 * (1 - sunPct))}"/>
            <!-- Sun dot -->
            ${(() => {
              const angle = Math.PI * (1 - sunPct);
              const cx = 100 + 90 * Math.cos(angle);
              const cy = 90 - 90 * Math.sin(angle);
              return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="8" fill="#fff" stroke="rgba(0,0,0,0.25)" stroke-width="2"/>`;
            })()}
          </svg>
        </div>
        <div class="sun__times">
          <div class="sun__time-item">
            <span class="sun__time-label">Sunrise</span>
            <span class="sun__time-value">☀ ${sunrise}</span>
          </div>
          <div class="sun__time-item">
            <span class="sun__time-label">Sunset</span>
            <span class="sun__time-value">🌇 ${sunset}</span>
          </div>
        </div>
      </div>

      <!-- Details Card -->
      <div class="card card--details" style="animation-delay:0.15s">
        <div class="card__label">Atmospheric Details</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-item__icon">💧</span>
            <span class="stat-item__value">${cur.relative_humidity_2m}%</span>
            <span class="stat-item__label">Humidity</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__icon">💨</span>
            <span class="stat-item__value">${round(cur.wind_speed_10m)}</span>
            <span class="stat-item__label">Wind ${windUnit()} ${windDir}</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__icon">🔆</span>
            <span class="stat-item__value">${uv.toFixed(1)}</span>
            <span class="stat-item__label">UV · ${uvInfo.label}</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__icon">🌡</span>
            <span class="stat-item__value">${pressure}</span>
            <span class="stat-item__label">Pressure hPa</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__icon">☁️</span>
            <span class="stat-item__value">${cur.cloud_cover}%</span>
            <span class="stat-item__label">Cloud Cover</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__icon">👁</span>
            <span class="stat-item__value" style="font-size:1rem">${vis}</span>
            <span class="stat-item__label">Visibility</span>
          </div>
        </div>
      </div>

      <!-- 6-Day Forecast -->
      <div class="card card--forecast" style="animation-delay:0.20s">
        <div class="card__label">6-Day Forecast</div>
        <div class="forecast-list">
          ${forecastDays.map(d => `
            <div class="forecast-item">
              <span class="forecast-item__day">${d.day}</span>
              <span class="forecast-item__icon">${d.icon}</span>
              <span class="forecast-item__high">${d.high}${sym}</span>
              <span class="forecast-item__low">${d.low}${sym}</span>
              ${d.rain > 0 ? `<span class="forecast-item__rain">💧 ${d.rain}%</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Hourly Temperature Chart -->
      <div class="card card--hourly" style="animation-delay:0.25s">
        <div class="card__label">Hourly Temperature (next 24 hrs)</div>
        <div class="hourly-chart">
          ${hourlySlice.map(h => `
            <div class="hourly-bar-wrap">
              <span class="hourly-bar-wrap__temp">${h.temp}${sym}</span>
              <div class="hourly-bar" style="height:${barHeight(h.temp)}px" title="${h.temp}${sym} at ${h.time}"></div>
              <span class="hourly-bar-wrap__time">${h.time}</span>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}
