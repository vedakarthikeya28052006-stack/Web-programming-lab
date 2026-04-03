import React, { useState } from 'react'
import { REGIONS } from '../utils/api'

const styles = {
  wrap: {
    padding: '28px 40px',
    display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
  },
  searchWrap: {
    flex: 1, minWidth: '220px',
    display: 'flex', alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    transition: 'border-color var(--transition)',
  },
  icon: { padding: '0 14px', color: 'var(--muted)', fontSize: '1rem', userSelect: 'none' },
  input: {
    flex: 1, padding: '12px 0',
    background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
  },
  select: {
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    outline: 'none',
  },
  sortBtn: (active) => ({
    padding: '12px 16px',
    background: active ? 'var(--accent)' : 'var(--surface)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 'var(--radius)',
    color: active ? '#0e0f0c' : 'var(--muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all var(--transition)',
  })
}

export default function SearchBar({ onSearch, onRegion, onSort, region, sort }) {
  const [val, setVal] = useState('')

  function handleKey(e) {
    if (e.key === 'Enter') onSearch(val.trim())
  }

  function handleChange(e) {
    setVal(e.target.value)
    if (e.target.value === '') onSearch('')
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.searchWrap}>
        <span style={styles.icon}>🔍</span>
        <input
          style={styles.input}
          placeholder="Search country…"
          value={val}
          onChange={handleChange}
          onKeyDown={handleKey}
        />
      </div>
      <select
        style={styles.select}
        value={region}
        onChange={e => onRegion(e.target.value)}
      >
        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <button style={styles.sortBtn(sort === 'name')} onClick={() => onSort('name')}>A–Z</button>
      <button style={styles.sortBtn(sort === 'population')} onClick={() => onSort('population')}>Population</button>
    </div>
  )
}
