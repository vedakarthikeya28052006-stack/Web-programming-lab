// utils.js — Helper functions for the Weather Dashboard

const Utils = (() => {

  const WEATHER_ICONS = {
    Clear: { day: '☀️', night: '🌙' },
    Clouds: { day: '⛅', night: '☁️' },
    Rain: { day: '🌧️', night: '🌧️' },
    Drizzle: { day: '🌦️', night: '🌦️' },
    Thunderstorm: { day: '⛈️', night: '⛈️' },
    Snow: { day: '❄️', night: '❄️' },
    Mist: { day: '🌫️', night: '🌫️' },
    Fog: { day: '🌫️', night: '🌫️' },
    Haze: { day: '🌫️', night: '🌫️' },
    Smoke: { day: '🌫️', night: '🌫️' },
    Dust: { day: '🌪️', night: '🌪️' },
    Sand: { day: '🌪️', night: '🌪️' },
    Ash: { day: '🌋', night: '🌋' },
    Squall: { day: '🌬️', night: '🌬️' },
    Tornado: { day: '🌪️', night: '🌪️' },
  };

  function getWeatherEmoji(condition, iconCode) {
    const isNight = iconCode && iconCode.endsWith('n');
    const icons = WEATHER_ICONS[condition] || { day: '🌡️', night: '🌡️' };
    return isNight ? icons.night : icons.day;
  }

  function celsiusToFahrenheit(c) {
    return Math.round(c * 9 / 5 + 32);
  }

  function formatTemp(celsius, unit) {
    const val = unit === 'F' ? celsiusToFahrenheit(celsius) : celsius;
    return `${val}°${unit}`;
  }

  function formatTempVal(celsius, unit) {
    return unit === 'F' ? celsiusToFahrenheit(celsius) : celsius;
  }

  function formatTime(unixSeconds, timezoneOffsetSeconds) {
    const utcMs = unixSeconds * 1000;
    const localMs = utcMs + timezoneOffsetSeconds * 1000;
    const d = new Date(localMs);
    // Manual UTC hours/minutes since we applied offset ourselves
    const h = d.getUTCHours();
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  function formatLocalDateTime(timezoneOffsetSeconds) {
    const now = Date.now();
    const localMs = now + timezoneOffsetSeconds * 1000;
    const d = new Date(localMs);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h = d.getUTCHours();
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()} · ${h12}:${m} ${ampm}`;
  }

  function formatDayName(unixSeconds) {
    const d = new Date(unixSeconds * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }

  function formatHourLabel(unixSeconds, timezoneOffsetSeconds) {
    const localMs = unixSeconds * 1000 + timezoneOffsetSeconds * 1000;
    const d = new Date(localMs);
    const h = d.getUTCHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}${ampm}`;
  }

  function windDirection(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  // Position of sun along the arc (0=sunrise, 1=sunset)
  function sunProgress(sunriseUnix, sunsetUnix) {
    const now = Date.now() / 1000;
    if (now < sunriseUnix) return 0;
    if (now > sunsetUnix) return 1;
    return (now - sunriseUnix) / (sunsetUnix - sunriseUnix);
  }

  // Calculate point on the parabolic arc SVG path
  function sunArcPosition(progress) {
    // Arc from (10,100) to (190,100) parabola peak at (100, 10)
    const t = progress;
    const x = 10 + t * 180;
    const y = 100 - 4 * 90 * t * (1 - t); // quadratic bezier at t
    return { x, y };
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  return {
    getWeatherEmoji,
    celsiusToFahrenheit,
    formatTemp,
    formatTempVal,
    formatTime,
    formatLocalDateTime,
    formatDayName,
    formatHourLabel,
    windDirection,
    sunProgress,
    sunArcPosition,
    debounce,
  };
})();
