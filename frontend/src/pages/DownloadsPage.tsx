import { useEffect, useState, useRef } from 'react'
import { getAllDownloads, type DownloadStatus } from '../api'

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadStatus[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    getAllDownloads().then(data => setDownloads(data.downloads || []))

    const ws = new WebSocket(`ws://${window.location.host}/ws/downloads`)
    wsRef.current = ws
    return () => ws.close()
  }, [])

  const active = downloads.filter(d => d.status === 'downloading' || d.status === 'queued')
  const done = downloads.filter(d => d.status === 'done' || d.status === 'failed')

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title">Downloads</h1>

        {downloads.length === 0 && (
          <div className="empty-state">
            <h2>No downloads yet</h2>
            <p>Search for an anime and start downloading.</p>
          </div>
        )}

        {active.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active ({active.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {active.map(d => (
                <DownloadItem key={d.task_id} item={d} />
              ))}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed ({done.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {done.map(d => (
                <DoneItem key={d.task_id} item={d} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function DownloadItem({ item }: { item: DownloadStatus }) {
  const [state, setState] = useState(item)

  useEffect(() => {
    if (state.status !== 'done' && state.status !== 'failed') {
      const ws = new WebSocket(`ws://${window.location.host}/ws/download/${item.task_id}`)
      ws.onmessage = e => {
        try { setState(JSON.parse(e.data)) } catch {}
      }
      return () => ws.close()
    }
  }, [item.task_id, state.status])

  const pct = Math.round(state.progress)

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.06)',
      padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
            {state.show_title}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Episode {state.episode} &middot; {state.mode.toUpperCase()} &middot; {state.quality || 'best'}p
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
          <div style={{ color: state.status === 'queued' ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
            {state.status === 'queued' ? 'Queued' : `${pct}%`}
          </div>
          {state.speed && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{state.speed}</div>}
        </div>
      </div>

      {state.status === 'downloading' && (
        <div style={{
          width: '100%',
          height: 2,
          background: 'rgba(255,255,255,0.06)',
          position: 'relative',
        }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            background: '#fff',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {state.status === 'failed' && state.error && (
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,100,100,0.7)', marginTop: 4 }}>
          {state.error.slice(0, 200)}
        </div>
      )}
    </div>
  )
}

function DoneItem({ item }: { item: DownloadStatus }) {
  const filesize = item.filesize > 0
    ? item.filesize > 1_000_000_000
      ? `${(item.filesize / 1_000_000_000).toFixed(1)} GB`
      : `${(item.filesize / 1_000_000).toFixed(0)} MB`
    : ''

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 14px',
      border: '1px solid rgba(255,255,255,0.06)',
      fontSize: '0.85rem',
    }}>
      <div>
        <span style={{ fontWeight: 500 }}>{item.show_title}</span>
        <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>
          Ep {item.episode}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {filesize && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{filesize}</span>}
        <span style={{
          color: item.status === 'done' ? 'rgba(255,255,255,0.5)' : 'rgba(255,100,100,0.7)',
          fontSize: '0.75rem',
        }}>
          {item.status === 'done' ? 'Done' : 'Failed'}
        </span>
      </div>
    </div>
  )
}
