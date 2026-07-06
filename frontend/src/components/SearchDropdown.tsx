import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrending, type SearchResult } from '../api'
import { getSearchHistory, addSearchQuery, clearSearchHistory } from '../history'

interface Props {
  onSearch: (query: string) => void
}

export default function SearchDropdown({ onSearch }: Props) {
  const nav = useNavigate()
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState('')
  const [trending, setTrending] = useState<SearchResult[]>([])
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focused && !loaded) {
      getTrending().then(t => setTrending(t.slice(0, 6))).catch(() => {}).finally(() => setLoaded(true))
    }
  }, [focused, loaded])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const history = getSearchHistory()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    addSearchQuery(q)
    setFocused(false)
    onSearch(q)
    nav(`/search?q=${encodeURIComponent(q)}`)
  }

  const handleSuggestion = (suggestion: string) => {
    addSearchQuery(suggestion)
    setFocused(false)
    onSearch(suggestion)
    nav(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  const handleAnimeClick = (id: string) => {
    setFocused(false)
    nav(`/anime/${id}`)
  }

  const open = focused && (query.length === 0)

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          transition: 'border-color 0.15s',
        }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search any anime..."
            style={{
              flex: 1,
              padding: '14px 0',
              fontSize: '1.1rem',
              fontWeight: 400,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#fff',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '14px 24px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: query.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
              cursor: query.trim() ? 'pointer' : 'default',
            }}
          >
            SEARCH
          </button>
        </div>
      </form>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: 'none',
          background: '#0a0a0a',
          zIndex: 100,
          marginTop: -1,
        }}>
          {/* Search history */}
          {history.length > 0 && (
            <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{
                padding: '0 16px',
                marginBottom: 8,
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.15)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>Recent Searches</span>
                <span
                  onClick={e => { e.stopPropagation(); clearSearchHistory() }}
                  style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.1)' }}
                >
                  CLEAR
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 16px' }}>
                {history.slice(0, 8).map(q => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending recommendations */}
          <div style={{ padding: '12px 0' }}>
            <div style={{
              padding: '0 16px',
              marginBottom: 8,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.15)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Trending
            </div>
            <div>
              {trending.map(anime => (
                <div
                  key={anime.id}
                  onClick={() => handleAnimeClick(anime.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 28,
                    height: 38,
                    flexShrink: 0,
                    background: '#111',
                    overflow: 'hidden',
                  }}>
                    {anime.thumbnail ? (
                      <img src={anime.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.1)', fontSize: '0.6rem' }}>
                        ?
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {anime.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                      {(anime.episodes?.dub ?? 0) > 0 ? 'Dub / ' : ''}{(anime.episodes?.sub ?? 0)}ep
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
