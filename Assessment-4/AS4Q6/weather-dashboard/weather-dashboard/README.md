# 🌤 Atmosphere — Weather Dashboard

A beautiful weather dashboard. No API key required — uses the free Open-Meteo API.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (auto-opens at http://localhost:3000)
npm run dev
```

## Features
- City search with geocoding
- Current conditions (temp, feels like, weather code)
- 6-day forecast with highs/lows & rain chance
- Hourly temperature bar chart (24 hrs)
- Sunrise/sunset arc animation
- Atmospheric details: humidity, wind, UV, pressure, visibility
- °C / °F toggle (saved to localStorage)
- Auto-restores last searched city on reload

## Project Structure

```
weather-dashboard/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js                  # App entry, state, orchestration
    ├── styles/main.css          # All styles
    ├── components/
    │   ├── header.js            # Logo, clock, unit toggle
    │   ├── search.js            # City search bar
    │   └── dashboard.js         # All weather cards
    └── utils/weather.js         # API calls + data helpers
```

## Build for Production

```bash
npm run build
npm run preview
```
