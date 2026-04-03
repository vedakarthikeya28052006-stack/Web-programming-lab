const BASE = 'https://restcountries.com/v3.1'

export async function fetchAllCountries() {
  const res = await fetch(`${BASE}/all?fields=name,flags,region,subregion,population,capital,cca3,cca2`)
  if (!res.ok) throw new Error('Failed to fetch countries')
  return res.json()
}

export async function fetchCountryByCode(code) {
  const res = await fetch(`${BASE}/alpha/${code}`)
  if (!res.ok) throw new Error('Country not found')
  const data = await res.json()
  return data[0]
}

export async function fetchCountriesByCodes(codes) {
  if (!codes || codes.length === 0) return []
  const res = await fetch(`${BASE}/alpha?codes=${codes.join(',')}&fields=name,flags,cca3`)
  if (!res.ok) return []
  return res.json()
}

export async function searchCountries(query) {
  const res = await fetch(`${BASE}/name/${encodeURIComponent(query)}?fields=name,flags,region,subregion,population,capital,cca3,cca2`)
  if (!res.ok) throw new Error(`No results for "${query}"`)
  return res.json()
}

export function formatPopulation(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n?.toString() ?? '—'
}

export function formatArea(n) {
  if (!n) return '—'
  return n.toLocaleString() + ' km²'
}

export function getCurrencies(country) {
  if (!country.currencies) return '—'
  return Object.values(country.currencies).map(c => `${c.name} (${c.symbol ?? ''})`).join(', ')
}

export function getLanguages(country) {
  if (!country.languages) return '—'
  return Object.values(country.languages).join(', ')
}

export function getTimezones(country) {
  if (!country.timezones) return '—'
  return country.timezones.slice(0, 3).join(', ') + (country.timezones.length > 3 ? ' …' : '')
}

export const REGIONS = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania', 'Antarctic']
