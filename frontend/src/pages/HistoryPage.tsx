import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, clearHistory, type HistoryEntry } from '../history'

export default function HistoryPage() {
  const nav = useNavigate()
  const [entries, setEntries] = useState<HistoryEntry[]>([])

  const load = () => setEntries(getHistory())

  useEffect(() => { load() }, [])

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
              History
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
              {entries.length} {entries.length === 1 ? 'show' : 'shows'} — pick up where you left off
            </p>
          </div>
          {entries.length > 0 && (
            <button
              onClick={() => { clearHistory(); load() }}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
            >
              CLEAR ALL
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 0',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.15)' }}>
              No history yet
            </p>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>
              Download some episodes and they&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map(e => (
              <HistoryCard key={`${e.showId}-${e.mode}`} entry={e} onClick={() => nav(`/anime/${e.showId}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryCard({ entry, onClick }: { entry: HistoryEntry; onClick: () => void }) {
  const count = entry.downloadedEpisodes.length
  const lastDate = new Date(entry.lastDownloaded).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 16,
        padding: 16,
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.01)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 72,
        height: 96,
        flexShrink: 0,
        background: '#111',
        overflow: 'hidden',
      }}>
        {entry.thumbnail ? (
          <img
            src={entry.thumbnail}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.1)' }}>
            ?
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>
          {entry.showName}
        </h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          <span>{entry.mode.toUpperCase()}</span>
          <span>{count} episode{count !== 1 ? 's' : ''}</span>
          <span>{lastDate}</span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: 2,
          background: 'rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.15)',
          }} />
        </div>

        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
          Click to resume
        </p>
      </div>
    </div>
  )
}
