import React, { useState } from 'react'
import { formatPopulation } from '../utils/api'

export default function CountryCard({ country, onClick }) {
  const [hovered, setHovered] = useState(false)

  const name = country.name?.common ?? '—'
  const flag = country.flags?.svg ?? country.flags?.png ?? ''
  const capital = country.capital?.[0] ?? '—'
  const population = formatPopulation(country.population)
  const region = country.region ?? '—'

  const card = {
    background: hovered ? 'var(--surface2)' : 'var(--surface)',
    border: '1px solid ' + (hovered ? 'rgba(200,169,110,0.3)' : 'var(--border)'),
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    transform: hovered ? 'translateY(-4px)' : 'none',
    boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
    animation: 'fadeInUp 0.4s ease both',
  }

  const flagStyle = {
    width: '100%', height: '160px',
    objectFit: 'cover',
    display: 'block',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
  }

  const body = { padding: '18px 20px' }

  const countryName = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    color: 'var(--text)',
    marginBottom: '10px',
    lineHeight: 1.2,
  }

  const row = {
    display: 'flex', justifyContent: 'space-between',
    marginBottom: '6px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
  }

  const label = { color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }
  const value = { color: 'var(--accent)', fontWeight: 700 }

  const tag = {
    display: 'inline-block',
    marginTop: '12px',
    padding: '3px 10px',
    background: 'rgba(126,184,154,0.1)',
    border: '1px solid rgba(126,184,154,0.2)',
    borderRadius: '20px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    color: 'var(--accent2)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  }

  return (
    <div
      style={card}
      onClick={() => onClick(country.cca3)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {flag && <img src={flag} alt={`Flag of ${name}`} style={flagStyle} loading="lazy" />}
      <div style={body}>
        <div style={countryName}>{name}</div>
        <div style={row}>
          <span style={label}>Capital</span>
          <span style={value}>{capital}</span>
        </div>
        <div style={row}>
          <span style={label}>Population</span>
          <span style={value}>{population}</span>
        </div>
        <span style={tag}>{region}</span>
      </div>
    </div>
  )
}
