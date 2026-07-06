import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/history', label: 'History' },
  { to: '/downloads', label: 'Downloads' },
  { to: '/setup', label: 'Setup' },
]

export default function Navbar() {
  const loc = useLocation()

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: 56,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
        ANIME<span style={{ fontWeight: 300, opacity: 0.5 }}>DL</span>
      </Link>
      <div style={{ display: 'flex', gap: 4 }}>
        {links.map(l => (
          <Link
            key={l.to}
            to={l.to}
            style={{
              padding: '6px 16px',
              fontSize: '0.85rem',
              fontWeight: 500,
              border: loc.pathname === l.to ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
              transition: 'border 0.15s',
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
