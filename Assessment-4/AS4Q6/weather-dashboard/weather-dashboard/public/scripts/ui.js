// ui.js — DOM rendering for the Weather Dashboard

const UI = (() => {

  function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('error-msg').classList.add('hidden');
    document.getElementById('welcome').classList.add('hidden');
  }

  function showError(message) {
    const el = document.getElementById('error-msg');
    el.textContent = `⚠️ ${message}`;
    el.classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('welcome').classList.add('hidden');
  }

  function showMain() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error-msg').classList.add('hidden');
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
  }

  function showWelcome() {
    document.getElementById('welcome').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error-msg').classList.add('hidden');
  }

  function showDemoBanner() {
    document.getElementById('demo-banner').classList.remove('hidden');
  }

  function renderWeather(data, unit) {
    renderHero(data, unit);
    renderStats(data, unit);
    renderHourly(data, unit);
    renderForecast(data, unit);
    showMain();
  }

  function renderHero(data, unit) {
    const emoji = Utils.getWeatherEmoji(data.condition, data.icon);

    document.getElementById('city-name').textContent = data.city;
    document.getElementById('city-country').textContent = data.country;
    document.getElementById('current-temp').textContent = `${Utils.formatTempVal(data.temp, unit)}°`;
    document.getElementById('feels-like').textContent = `Feels like ${Utils.formatTemp(data.feels_like, unit)}`;
    document.getElementById('condition-label').textContent = data.description;
    document.getElementById('weather-icon-large').textContent = emoji;
    document.getElementById('temp-range').innerHTML =
      `↑ ${Utils.formatTemp(data.temp_max, unit)} &nbsp; ↓ ${Utils.formatTemp(data.temp_min, unit)}`;
    document.getElementById('local-time').textContent = Utils.formatLocalDateTime(data.timezone);

    // Hero card background tint based on condition
    const hero = document.getElementById('hero-card');
    hero.style.setProperty('--hero-tint', conditionTint(data.condition));
  }

  function conditionTint(condition) {
    const tints = {
      Clear: 'rgba(255,200,50,0.04)',
      Clouds: 'rgba(150,170,200,0.04)',
      Rain: 'rgba(100,160,255,0.05)',
      Drizzle: 'rgba(100,160,255,0.04)',
      Thunderstorm: 'rgba(120,80,200,0.06)',
      Snow: 'rgba(200,230,255,0.05)',
    };
    return tints[condition] || 'rgba(232,163,74,0.04)';
  }

  function renderStats(data, unit) {
    // Humidity
    document.getElementById('stat-humidity').textContent = `${data.humidity}%`;
    document.getElementById('bar-humidity').style.width = `${data.humidity}%`;

    // Wind
    document.getElementById('stat-wind').textContent = `${data.wind_speed} km/h`;
    document.getElementById('wind-dir').textContent = `Direction: ${Utils.windDirection(data.wind_deg)}`;

    // Visibility
    document.getElementById('stat-visibility').textContent =
      data.visibility != null ? `${data.visibility} km` : 'N/A';

    // Pressure
    document.getElementById('stat-pressure').textContent = `${data.pressure} hPa`;

    // Clouds
    document.getElementById('stat-clouds').textContent = `${data.clouds}%`;
    document.getElementById('bar-clouds').style.width = `${data.clouds}%`;

    // Sun
    const tz = data.timezone;
    const srText = Utils.formatTime(data.sunrise, tz);
    const ssText = Utils.formatTime(data.sunset, tz);
    document.getElementById('sun-times').innerHTML =
      `<span>🌅 ${srText}</span><span>🌇 ${ssText}</span>`;

    // Sun arc dot
    const prog = Utils.sunProgress(data.sunrise, data.sunset);
    const pos = Utils.sunArcPosition(prog);
    const dot = document.getElementById('sun-dot');
    dot.setAttribute('cx', pos.x);
    dot.setAttribute('cy', pos.y);
  }

  function renderHourly(data, unit) {
    const container = document.getElementById('hourly-scroll');
    container.innerHTML = '';
    const tz = data.timezone;

    data.hourly.forEach((h, i) => {
      const emoji = Utils.getWeatherEmoji(h.condition, h.icon);
      const label = i === 0 ? 'Now' : Utils.formatHourLabel(h.time, tz);
      const div = document.createElement('div');
      div.className = 'hourly-item' + (i === 0 ? ' now' : '');
      div.innerHTML = `
        <span class="hourly-time">${label}</span>
        <span class="hourly-icon">${emoji}</span>
        <span class="hourly-temp">${Utils.formatTempVal(h.temp, unit)}°</span>
        ${h.rain > 0 ? `<span class="hourly-rain">💧${h.rain}mm</span>` : ''}
      `;
      container.appendChild(div);
    });
  }

  function renderForecast(data, unit) {
    const container = document.getElementById('forecast-list');
    container.innerHTML = '';

    data.forecast.forEach(day => {
      const emoji = Utils.getWeatherEmoji(day.condition, day.icon);
      const dayName = Utils.formatDayName(day.date);
      const div = document.createElement('div');
      div.className = 'forecast-item';
      div.innerHTML = `
        <span class="forecast-day">${dayName}</span>
        <span class="forecast-icon">${emoji}</span>
        <span class="forecast-desc">${day.description}</span>
        <div class="forecast-temps">
          <span class="forecast-hi">${Utils.formatTempVal(day.temp_max, unit)}°</span>
          <span class="forecast-lo">${Utils.formatTempVal(day.temp_min, unit)}°</span>
        </div>
      `;
      container.appendChild(div);
    });
  }

  function renderAutocomplete(cities, onSelect) {
    const list = document.getElementById('autocomplete-list');
    list.innerHTML = '';
    if (!cities.length) {
      list.classList.add('hidden');
      return;
    }
    cities.forEach(city => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      const label = city.state ? `${city.name}, ${city.state}` : city.name;
      item.innerHTML = `<span class="autocomplete-city">${label}</span><span class="autocomplete-country">${city.country}</span>`;
      item.addEventListener('click', () => {
        onSelect(city);
        list.classList.add('hidden');
      });
      list.appendChild(item);
    });
    list.classList.remove('hidden');
  }

  function hideAutocomplete() {
    document.getElementById('autocomplete-list').classList.add('hidden');
  }

  return {
    showLoading, showError, showMain, showWelcome, showDemoBanner,
    renderWeather, renderAutocomplete, hideAutocomplete,
  };
})();
