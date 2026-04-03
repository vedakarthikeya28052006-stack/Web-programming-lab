/**
 * weather.js — API layer using Open-Meteo (free, no key required)
 * Geocoding via Open-Meteo's geocoding API
 */

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Geocode a city name → { lat, lon, name, country, timezone }
 */
export async function geocodeCity(query) {
  const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${query}" not found`);
  }
  const r = data.results[0];
  return {
    lat: r.latitude,
    lon: r.longitude,
    name: r.name,
    country: r.country,
    timezone: r.timezone
  };
}

/**
 * Fetch full weather data for a location
 */
export async function fetchWeather(lat, lon, timezone, unit = 'celsius') {
  const tempUnit = unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
  const windUnit = 'kmh';

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone,
    temperature_unit: tempUnit,
    wind_speed_unit: windUnit,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'uv_index',
      'cloud_cover',
      'surface_pressure',
      'visibility'
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'weather_code'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'precipitation_probability_max',
      'uv_index_max'
    ].join(','),
    forecast_days: 7
  });

  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error('Weather request failed');
  return res.json();
}

/**
 * WMO Weather Codes → human-readable label + emoji
 */
export function interpretWeatherCode(code) {
  const codes = {
    0:  { label: 'Clear Sky',        icon: '☀️' },
    1:  { label: 'Mostly Clear',     icon: '🌤️' },
    2:  { label: 'Partly Cloudy',    icon: '⛅' },
    3:  { label: 'Overcast',         icon: '☁️' },
    45: { label: 'Foggy',            icon: '🌫️' },
    48: { label: 'Icy Fog',          icon: '🌫️' },
    51: { label: 'Light Drizzle',    icon: '🌦️' },
    53: { label: 'Drizzle',          icon: '🌦️' },
    55: { label: 'Heavy Drizzle',    icon: '🌧️' },
    61: { label: 'Light Rain',       icon: '🌧️' },
    63: { label: 'Rain',             icon: '🌧️' },
    65: { label: 'Heavy Rain',       icon: '🌧️' },
    71: { label: 'Light Snow',       icon: '🌨️' },
    73: { label: 'Snow',             icon: '❄️' },
    75: { label: 'Heavy Snow',       icon: '❄️' },
    80: { label: 'Rain Showers',     icon: '🌦️' },
    81: { label: 'Showers',          icon: '🌦️' },
    82: { label: 'Heavy Showers',    icon: '⛈️' },
    85: { label: 'Snow Showers',     icon: '🌨️' },
    95: { label: 'Thunderstorm',     icon: '⛈️' },
    96: { label: 'Thunderstorm',     icon: '⛈️' },
    99: { label: 'Thunderstorm',     icon: '⛈️' },
  };
  return codes[code] ?? { label: 'Unknown', icon: '🌡️' };
}

/**
 * Format time from ISO string (e.g. "2024-01-15T06:30" → "6:30 AM")
 */
export function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Format day name from ISO date string
 */
export function formatDay(isoDateString, short = true) {
  const d = new Date(isoDateString + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' });
}

/**
 * Wind direction degrees → compass label
 */
export function degreesToCompass(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * UV Index → risk label + color
 */
export function uvRisk(index) {
  if (index <= 2) return { label: 'Low', color: '#57d94f' };
  if (index <= 5) return { label: 'Moderate', color: '#f9c74f' };
  if (index <= 7) return { label: 'High', color: '#f77f00' };
  if (index <= 10) return { label: 'Very High', color: '#d00000' };
  return { label: 'Extreme', color: '#7b2d8b' };
}

/**
 * Convert hPa → inHg (for display)
 */
export function hpaToInHg(hpa) {
  return (hpa * 0.02953).toFixed(2);
}

/**
 * Visibility in metres → readable string
 */
export function formatVisibility(metres) {
  if (metres >= 10000) return '10+ km';
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${metres} m`;
}
