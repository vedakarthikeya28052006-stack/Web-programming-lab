import React from 'react'

const styles = {
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(14,15,12,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    padding: '0 40px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: '64px',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: '10px',
    letterSpacing: '-0.01em',
  },
  dot: { color: 'var(--accent)', fontSize: '1.8rem', lineHeight: 1 },
  sub: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--muted)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginTop: '2px',
  },
  badge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--accent)',
    border: '1px solid rgba(200,169,110,0.3)',
    borderRadius: '4px',
    padding: '4px 10px',
    letterSpacing: '0.08em',
  }
}

export default function Header({ count }) {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <span style={styles.dot}>◎</span>
        <div>
          Atlas
          <div style={styles.sub}>Country Explorer</div>
        </div>
      </div>
      {count > 0 && (
        <div style={styles.badge}>{count} countries</div>
      )}
    </header>
  )
}
