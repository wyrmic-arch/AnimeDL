import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AnimeCard from '../components/AnimeCard'
import { searchAnime, type SearchResult } from '../api'

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Thriller', 'Mystery',
  'Seinen', 'Shounen', 'Magic', 'Supernatural', 'Sports',
]

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const genresParam = params.get('genres') || ''

  const [query, setQuery] = useState(q)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    genresParam ? genresParam.split(',').map(s => s.trim()).filter(Boolean) : []
  )
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery(q)
  }, [q])

  useEffect(() => {
    if (!q && selectedGenres.length === 0) {
      setResults([])
      return
    }
    setLoading(true)
    searchAnime(q, 1, selectedGenres.length > 0 ? 'Popular' : '', selectedGenres.join(','))
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [q, selectedGenres])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sp = new URLSearchParams()
    if (query.trim()) sp.set('q', query.trim())
    if (selectedGenres.length > 0) {
      sp.set('genres', selectedGenres.join(','))
      sp.set('sort_by', 'Popular')
    }
    setParams(sp)
  }

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search anime..."
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
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              SEARCH
            </button>
          </div>
        </form>

        {/* Genre pills */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 32,
        }}>
          {GENRES.map(g => {
            const active = selectedGenres.includes(g)
            return (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  border: active
                    ? '1px solid rgba(255,255,255,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                {g}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: 16 }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            <div className="grid">
              {results.map(anime => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingTop: 60 }}>
            {q || selectedGenres.length > 0
              ? 'No results found.'
              : 'Use the search bar or select genres to find anime.'}
          </p>
        )}
      </div>
    </div>
  )
}
