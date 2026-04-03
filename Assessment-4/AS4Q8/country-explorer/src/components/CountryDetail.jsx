import React, { useEffect, useState } from 'react'
import { fetchCountryByCode, fetchCountriesByCodes, formatPopulation, formatArea, getCurrencies, getLanguages, getTimezones } from '../utils/api'

export default function CountryDetail({ code, onClose, onNavigate }) {
  const [country, setCountry] = useState(null)
  const [borders, setBorders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true); setError(null); setCountry(null); setBorders([])
    fetchCountryByCode(code)
      .then(async (c) => {
        setCountry(c)
        if (c.borders?.length) {
          const b = await fetchCountriesByCodes(c.borders)
          setBorders(b)
        }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [code])

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
    animation: 'fadeIn 0.2s ease',
  }

  const modal = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    width: '100%', maxWidth: '780px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
    animation: 'fadeInUp 0.3s ease',
  }

  const closeBtnStyle = {
    position: 'sticky', top: 0,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    zIndex: 10,
  }

  const closeBtn = {
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--muted)', cursor: 'pointer',
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '6px 14px', borderRadius: 'var(--radius)',
    transition: 'all var(--transition)',
  }

  const sectionLabel = {
    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: 'var(--muted)', marginBottom: '8px',
  }

  const value = { fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.5 }

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }

  const borderBtn = (b) => ({
    padding: '8px 14px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--accent)',
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'all var(--transition)',
  })

  if (loading) return (
    <div style={overlay} onClick={onClose}>
      <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Loading…</div>
    </div>
  )

  if (error) return (
    <div style={overlay} onClick={onClose}>
      <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{error}</div>
    </div>
  )

  if (!country) return null

  const name = country.name?.common
  const official = country.name?.official
  const flag = country.flags?.svg ?? country.flags?.png
  const population = formatPopulation(country.population)
  const area = formatArea(country.area)
  const capital = country.capital?.join(', ') ?? '—'
  const region = [country.region, country.subregion].filter(Boolean).join(' · ')
  const currencies = getCurrencies(country)
  const languages = getLanguages(country)
  const timezones = getTimezones(country)
  const tld = country.tld?.join(', ') ?? '—'
  const callingCode = country.idd?.root
    ? country.idd.root + (country.idd.suffixes?.[0] ?? '')
    : '—'
  const drivingSide = country.car?.side ?? '—'
  const independent = country.independent ? 'Yes' : 'No'
  const unMember = country.unMember ? 'Yes' : 'No'

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div style={closeBtnStyle}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)' }}>
            {flag && <img src={flag} alt="" style={{ height: '18px', marginRight: '10px', verticalAlign: 'middle', borderRadius: '2px' }} />}
            {name}
          </span>
          <button style={closeBtn} onClick={onClose}>✕ Close</button>
        </div>

        <div style={{ padding: '28px 28px 32px' }}>
          {/* Flag */}
          {flag && (
            <img
              src={flag}
              alt={`Flag of ${name}`}
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: '28px', border: '1px solid var(--border)' }}
            />
          )}

          {/* Official name */}
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabel}>Official Name</div>
            <div style={{ ...value, fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontStyle: 'italic' }}>{official}</div>
          </div>

          {/* Grid stats */}
          <div style={grid2}>
            {[
              ['Region', region],
              ['Capital', capital],
              ['Population', population],
              ['Area', area],
              ['Currencies', currencies],
              ['Languages', languages],
              ['Timezones', timezones],
              ['Top-level domain', tld],
              ['Calling code', callingCode],
              ['Driving side', drivingSide],
              ['UN Member', unMember],
              ['Independent', independent],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={sectionLabel}>{label}</div>
                <div style={value}>{val}</div>
              </div>
            ))}
          </div>

          {/* Border countries */}
          {borders.length > 0 && (
            <div>
              <div style={{ ...sectionLabel, marginBottom: '12px' }}>Border Countries ({borders.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {borders.map(b => (
                  <button key={b.cca3} style={borderBtn(b)} onClick={() => onNavigate(b.cca3)}>
                    {b.flags?.svg && <img src={b.flags.svg} alt="" style={{ height: '14px', borderRadius: '2px' }} />}
                    {b.name?.common}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
