import React, { useEffect, useState, useMemo } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CountryCard from './components/CountryCard'
import CountryDetail from './components/CountryDetail'
import { fetchAllCountries, searchCountries } from './utils/api'

const Spinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '16px' }}>
    <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>LOADING ATLAS…</span>
  </div>
)

const ErrorMsg = ({ msg }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'var(--font-mono)', color: 'var(--red)', fontSize: '0.82rem' }}>
    ⚠ {msg}
  </div>
)

export default function App() {
  const [allCountries, setAllCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [region, setRegion] = useState('All')
  const [sort, setSort] = useState('name')
  const [selectedCode, setSelectedCode] = useState(null)

  useEffect(() => {
    fetchAllCountries()
      .then(data => { setAllCountries(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const displayed = useMemo(() => {
    let list = [...allCountries]

    if (region !== 'All') {
      list = list.filter(c => c.region === region)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(c =>
        c.name?.common?.toLowerCase().includes(q) ||
        c.capital?.[0]?.toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (sort === 'population') return (b.population ?? 0) - (a.population ?? 0)
      return (a.name?.common ?? '').localeCompare(b.name?.common ?? '')
    })

    return list
  }, [allCountries, region, searchQuery, sort])

  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '20px',
    padding: '0 40px 60px',
  }

  const empty = {
    textAlign: 'center', padding: '80px 20px',
    fontFamily: 'var(--font-display)', fontSize: '1.4rem',
    color: 'var(--muted)', fontStyle: 'italic',
  }

  return (
    <>
      <Header count={displayed.length} />
      <SearchBar
        onSearch={setSearchQuery}
        onRegion={setRegion}
        onSort={setSort}
        region={region}
        sort={sort}
      />
      {loading && <Spinner />}
      {error && <ErrorMsg msg={error} />}
      {!loading && !error && (
        displayed.length === 0
          ? <div style={empty}>No countries found…</div>
          : <div style={grid}>
              {displayed.map((c, i) => (
                <div key={c.cca3} style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}>
                  <CountryCard country={c} onClick={setSelectedCode} />
                </div>
              ))}
            </div>
      )}
      {selectedCode && (
        <CountryDetail
          code={selectedCode}
          onClose={() => setSelectedCode(null)}
          onNavigate={setSelectedCode}
        />
      )}
    </>
  )
}
