import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimeCard from '../components/AnimeCard'
import { getTrending, getPopular, searchAnime, type SearchResult } from '../api'

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Thriller', 'Mystery',
  'Seinen', 'Shounen', 'Magic', 'Supernatural', 'Sports',
]

export default function LandingPage() {
  const nav = useNavigate()
  const [trending, setTrending] = useState<SearchResult[]>([])
  const [popular, setPopular] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTrending(), getPopular()])
      .then(([t, p]) => {
        // Shuffle trending slightly for variety
        setTrending(t.sort(() => Math.random() - 0.5))
        setPopular(p)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      nav(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleGenreClick = (genre: string) => {
    if (selectedGenre === genre) {
      setSelectedGenre('')
      nav('/search')
    } else {
      setSelectedGenre(genre)
      nav(`/search?genres=${encodeURIComponent(genre)}&sort_by=Popular`)
    }
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Hero */}
        <div style={{
          textAlign: 'center',
          padding: '60px 0 48px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 40,
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 12,
            lineHeight: 1.1,
          }}>
            Anime Downloader
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            Search, select, download. Browse trending anime or find something new.
          </p>

          <form onSubmit={handleSearch} style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              transition: 'border-color 0.15s',
            }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
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
                  color: searchQuery.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                  cursor: searchQuery.trim() ? 'pointer' : 'default',
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
            justifyContent: 'center',
            marginTop: 24,
          }}>
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => handleGenreClick(g)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  border: selectedGenre === g
                    ? '1px solid rgba(255,255,255,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: selectedGenre === g ? 'rgba(255,255,255,0.06)' : 'transparent',
                  transition: 'all 0.1s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  if (selectedGenre !== g) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                }}
                onMouseLeave={e => {
                  if (selectedGenre !== g) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Trending */}
        <section style={{ marginBottom: 48 }}>
          <h2 className="section-title">Trending Now</h2>
          {loading ? (
            <div className="grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
              ))}
            </div>
          ) : (
            <div className="grid">
              {trending.map(anime => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          )}
        </section>

        {/* Popular */}
        <section>
          <h2 className="section-title">Most Popular</h2>
          {loading ? (
            <div className="grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
              ))}
            </div>
          ) : (
            <div className="grid">
              {popular.map(anime => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
