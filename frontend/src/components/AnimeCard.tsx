import { Link } from 'react-router-dom'
import type { SearchResult } from '../api'

interface Props {
  anime: SearchResult
}

const FALLBACK_BG = '#111'

export default function AnimeCard({ anime }: Props) {
  const hasDub = (anime.episodes?.dub ?? 0) > 0

  return (
    <Link
      to={`/anime/${anime.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.15s',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{
          width: '100%',
          aspectRatio: '3/4',
          background: FALLBACK_BG,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {anime.thumbnail ? (
            <img
              src={anime.thumbnail}
              alt={anime.name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <span style={{ fontSize: '0.75rem', opacity: 0.3 }}>{anime.name.charAt(0)}</span>
          )}
        </div>
        <div style={{ padding: 12 }}>
          <h3 style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            lineHeight: 1.3,
            marginBottom: 4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {anime.name}
          </h3>
          <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', alignItems: 'center' }}>
            <span>{anime.episodes?.sub ?? '?'} ep</span>
            {hasDub && <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>DUB</span>}
            {anime.status && (
              <span style={{
                marginLeft: 'auto',
                color: anime.status === 'Finished' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)',
                fontSize: '0.7rem',
              }}>
                {anime.status === 'Finished' ? 'FIN' : 'ONGOING'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
