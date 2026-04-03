require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Get current weather + 5-day forecast by city name
app.get('/api/weather', async (req, res) => {
  const { city, lat, lon } = req.query;

  if (!API_KEY || API_KEY === 'your_api_key_here') {
    return res.json(getMockWeatherData(city || 'Demo City'));
  }

  try {
    let weatherUrl, forecastUrl;

    if (lat && lon) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    } else {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    }

    const [weatherRes, forecastRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl)
    ]);

    if (!weatherRes.ok) {
      const err = await weatherRes.json();
      return res.status(weatherRes.status).json({ error: err.message || 'City not found' });
    }

    const weather = await weatherRes.json();
    const forecast = await forecastRes.json();

    res.json(formatWeatherData(weather, forecast));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Search cities autocomplete
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  if (!API_KEY || API_KEY === 'your_api_key_here') {
    return res.json([
      { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
      { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
      { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
    ].filter(c => c.name.toLowerCase().startsWith(q.toLowerCase())));
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data.map(c => ({ name: c.name, country: c.country, state: c.state, lat: c.lat, lon: c.lon })));
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

function formatWeatherData(weather, forecast) {
  // Get daily forecasts (one per day, at noon)
  const daily = {};
  forecast.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toISOString().split('T')[0];
    const hour = date.getHours();
    if (!daily[day] || Math.abs(hour - 12) < Math.abs(new Date(daily[day].dt * 1000).getHours() - 12)) {
      daily[day] = item;
    }
  });

  const days = Object.values(daily).slice(0, 5);

  return {
    city: weather.name,
    country: weather.sys.country,
    temp: Math.round(weather.main.temp),
    feels_like: Math.round(weather.main.feels_like),
    temp_min: Math.round(weather.main.temp_min),
    temp_max: Math.round(weather.main.temp_max),
    humidity: weather.main.humidity,
    pressure: weather.main.pressure,
    wind_speed: Math.round(weather.wind.speed * 3.6), // m/s to km/h
    wind_deg: weather.wind.deg,
    visibility: weather.visibility ? Math.round(weather.visibility / 1000) : null,
    description: weather.weather[0].description,
    icon: weather.weather[0].icon,
    condition: weather.weather[0].main,
    sunrise: weather.sys.sunrise,
    sunset: weather.sys.sunset,
    timezone: weather.timezone,
    clouds: weather.clouds.all,
    forecast: days.map(d => ({
      date: d.dt,
      temp_min: Math.round(d.main.temp_min),
      temp_max: Math.round(d.main.temp_max),
      description: d.weather[0].description,
      icon: d.weather[0].icon,
      condition: d.weather[0].main,
      humidity: d.main.humidity,
      wind_speed: Math.round(d.wind.speed * 3.6),
    })),
    hourly: forecast.list.slice(0, 8).map(h => ({
      time: h.dt,
      temp: Math.round(h.main.temp),
      icon: h.weather[0].icon,
      condition: h.weather[0].main,
      rain: h.rain ? h.rain['3h'] || 0 : 0,
    }))
  };
}

function getMockWeatherData(city) {
  const now = Math.floor(Date.now() / 1000);
  return {
    city: city || 'San Francisco',
    country: 'US',
    temp: 18,
    feels_like: 16,
    temp_min: 14,
    temp_max: 22,
    humidity: 72,
    pressure: 1013,
    wind_speed: 15,
    wind_deg: 220,
    visibility: 10,
    description: 'partly cloudy',
    icon: '02d',
    condition: 'Clouds',
    sunrise: now - 3600 * 4,
    sunset: now + 3600 * 5,
    timezone: -28800,
    clouds: 40,
    forecast: [
      { date: now + 86400 * 1, temp_min: 13, temp_max: 21, description: 'sunny', icon: '01d', condition: 'Clear', humidity: 65, wind_speed: 12 },
      { date: now + 86400 * 2, temp_min: 11, temp_max: 19, description: 'light rain', icon: '10d', condition: 'Rain', humidity: 80, wind_speed: 18 },
      { date: now + 86400 * 3, temp_min: 10, temp_max: 17, description: 'rainy', icon: '09d', condition: 'Rain', humidity: 85, wind_speed: 22 },
      { date: now + 86400 * 4, temp_min: 12, temp_max: 20, description: 'cloudy', icon: '03d', condition: 'Clouds', humidity: 70, wind_speed: 14 },
      { date: now + 86400 * 5, temp_min: 14, temp_max: 23, description: 'clear sky', icon: '01d', condition: 'Clear', humidity: 60, wind_speed: 10 },
    ],
    hourly: Array.from({ length: 8 }, (_, i) => ({
      time: now + 3600 * (i + 1),
      temp: 18 + Math.floor(Math.sin(i * 0.5) * 4),
      icon: i < 4 ? '02d' : '01n',
      condition: 'Clouds',
      rain: i === 2 ? 0.5 : 0,
    }))
  };
}

app.listen(PORT, () => {
  console.log(`\n🌤  Weather Dashboard running at http://localhost:${PORT}`);
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    console.log('⚠️  No API key found — running in DEMO mode with mock data.');
    console.log('   Get a free key at https://openweathermap.org/api');
    console.log('   Then add it to your .env file as OPENWEATHER_API_KEY\n');
  }
});
