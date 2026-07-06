import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getAnimeDetail, getAllDownloads, startDownload, type AnimeDetail, type DownloadStatus } from '../api'

interface EpisodeCheck {
  num: string
  checked: boolean
}

const GENRE_COLORS: Record<string, string> = {
  Action: '#fff', Adventure: '#ccc', Comedy: '#999', Drama: '#666',
  Fantasy: '#bbb', Horror: '#555', Romance: '#ddd', 'Sci-Fi': '#aaa',
  Seinen: '#777', Shounen: '#888',
}

export default function AnimePage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const fallbackTitle = params.get('name') || 'Anime'

  const [anime, setAnime] = useState<AnimeDetail | null>(null)
  const [mode, setMode] = useState<'dub' | 'sub'>(() => {
    const saved = localStorage.getItem('preferred_mode') as 'dub' | 'sub' | null
    return saved || 'dub'
  })
  const [quality, setQuality] = useState(() => localStorage.getItem('preferred_quality') || '720')
  const [destination, setDestination] = useState(() => localStorage.getItem('preferred_dest') || '')
  const [episodes, setEpisodes] = useState<EpisodeCheck[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const [activeDownloads, setActiveDownloads] = useState<DownloadStatus[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const wsRefs = useRef<Map<string, WebSocket>>(new Map())

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getAnimeDetail(id)
      .then(d => {
        setAnime(d)
        const epList = d.episodes?.[mode] || []
        setEpisodes(epList.map((num: string) => ({ num, checked: false })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, mode])

  useEffect(() => {
    if (!id) return
    getAllDownloads().then(d => {
      const relevant = d.downloads.filter(t => t.task_id.startsWith(id!))
      setActiveDownloads(relevant)
      relevant.filter(t => t.status === 'done').forEach(t => setCompletedIds(p => new Set(p).add(t.task_id)))
    })
  }, [id])

  useEffect(() => {
    activeDownloads.forEach(task => {
      if (wsRefs.current.has(task.task_id)) return
      const ws = new WebSocket(`/ws/download/${task.task_id}`)
      wsRefs.current.set(task.task_id, ws)
      ws.onmessage = e => {
        try {
          const data = JSON.parse(e.data)
          setActiveDownloads(prev => prev.map(t => t.task_id === data.task_id ? { ...t, ...data } : t))
          if (data.status === 'done') {
            setCompletedIds(p => new Set(p).add(data.task_id))
            ws.close()
            wsRefs.current.delete(task.task_id)
          } else if (data.status === 'failed') {
            ws.close()
            wsRefs.current.delete(task.task_id)
          }
        } catch { }
      }
    })
  }, [activeDownloads])

  const toggleEp = (num: string) => {
    setEpisodes(prev => prev.map(e => e.num === num ? { ...e, checked: !e.checked } : e))
  }

  const toggleSelectAll = () => {
    setSelectAll(p => {
      const newVal = !p
      setEpisodes(prev => prev.map(e => ({ ...e, checked: newVal })))
      return newVal
    })
  }

  const handleStartDownload = useCallback(async () => {
    if (!id || !anime) return
    const selected = episodes.filter(e => e.checked).map(e => e.num)
    if (selected.length === 0) return

    setDownloading(true)
    localStorage.setItem('preferred_mode', mode)
    localStorage.setItem('preferred_quality', quality)
    if (destination) localStorage.setItem('preferred_dest', destination)

    const batchSize = 3
    for (let i = 0; i < selected.length; i += batchSize) {
      const batch = selected.slice(i, i + batchSize)
      const epStr = batch.join(',')
      try {
        const result = await startDownload(id, epStr, mode, quality, destination, anime.name)
        setActiveDownloads(prev => [
          ...prev,
          ...result.tasks.map(t => ({
            task_id: t.task_id,
            show_title: anime.name,
            episode: t.episode,
            mode,
            quality,
            status: 'queued',
            progress: 0,
            speed: '',
            eta: '',
            filename: '',
            filesize: 0,
            error: '',
          } as DownloadStatus)),
        ])
      } catch { }
    }
    setDownloading(false)
  }, [id, anime, episodes, mode, quality, destination])

  // Progress for each episode
  const progressByEp = new Map<string, DownloadStatus>()
  activeDownloads.forEach(t => progressByEp.set(t.episode, t))

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="skeleton" style={{ height: 320, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 6 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 40 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!anime) {
    return <div className="container" style={{ paddingTop: 80, color: 'rgba(255,255,255,0.2)' }}>Anime not found.</div>
  }

  const currentEpisodes = anime.episodes?.[mode] || []
  const totalEps = currentEpisodes.length
  const selectedCount = episodes.filter(e => e.checked).length

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Banner with cover image */}
      {anime.thumbnail && (
        <div style={{
          width: '100%',
          height: 360,
          overflow: 'hidden',
          position: 'relative',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <img
            src={anime.thumbnail}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.15)' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, #0a0a0a 100%)',
          }} />
        </div>
      )}

      <div className="container" style={{ marginTop: anime.thumbnail ? -100 : 40, position: 'relative', zIndex: 1 }}>
        {/* Title + meta */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}>
          {anime.name}
        </h1>

        {anime.rating && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 12 }}>
            {anime.rating}
          </p>
        )}

        {/* Genres */}
        {anime.genres && anime.genres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {anime.genres.map(g => (
              <span
                key={g}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Status + Season */}
        {(anime.status || anime.season?.year) && (
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginBottom: 16, display: 'flex', gap: 16 }}>
            {anime.status && <span>{anime.status}</span>}
            {anime.season?.year && <span>{anime.season.quarter || ''} {anime.season.year}</span>}
            {totalEps > 0 && <span>{totalEps} episode{totalEps !== 1 ? 's' : ''}</span>}
          </p>
        )}

        {/* Description */}
        {anime.description && (
          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            marginBottom: 32,
            maxWidth: 700,
          }}>
            {anime.description}
          </p>
        )}

        {/* Mode / Quality / Destination */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
          padding: 20,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['dub', 'sub'] as const).map(m => {
              const count = anime.episodes?.[m]?.length || 0
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: 'none',
                    background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: mode === m ? '#fff' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {m.toUpperCase()} ({count})
                </button>
              )
            })}
          </div>

          <select
            value={quality}
            onChange={e => setQuality(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="best">Best Quality</option>
            <option value="1080">1080p</option>
            <option value="720">720p</option>
            <option value="480">480p</option>
            <option value="360">360p</option>
          </select>

          <input
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder="Download destination (default ~/Videos/anime)"
            style={{
              flex: 1,
              minWidth: 200,
              padding: '8px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Batch controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>
            {currentEpisodes.length} episode{currentEpisodes.length !== 1 ? 's' : ''}
            {selectedCount > 0 && (
              <span style={{ marginLeft: 8, color: '#fff' }}>{selectedCount} selected</span>
            )}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleSelectAll}
              style={{
                padding: '8px 18px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              {selectAll ? 'DESELECT ALL' : 'SELECT ALL'}
            </button>
            <button
              onClick={handleStartDownload}
              disabled={selectedCount === 0 || downloading}
              style={{
                padding: '8px 24px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.15)',
                background: selectedCount > 0 && !downloading ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: selectedCount > 0 && !downloading ? '#fff' : 'rgba(255,255,255,0.15)',
                cursor: selectedCount > 0 && !downloading ? 'pointer' : 'default',
              }}
            >
              {downloading ? 'STARTING...' : `DOWNLOAD (${selectedCount})`}
            </button>
          </div>
        </div>

        {/* Episode grid */}
        {episodes.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingTop: 40 }}>
            No episodes available for {mode.toUpperCase()}.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
            gap: 6,
          }}>
            {episodes.map(ep => {
              const task = progressByEp.get(ep.num)
              const isDone = task && task.status === 'done'
              const isFailed = task && task.status === 'failed'
              const isActive = task && (task.status === 'queued' || task.status === 'downloading' || task.progress > 0)
              const progress = task?.progress ?? 0

              return (
                <label
                  key={ep.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    height: 44,
                    border: isDone
                      ? '1px solid rgba(255,255,255,0.3)'
                      : isActive
                        ? '1px solid rgba(255,255,255,0.15)'
                        : isFailed
                          ? '1px solid rgba(255,255,255,0.06)'
                          : '1px solid rgba(255,255,255,0.06)',
                    background: isDone
                      ? 'rgba(255,255,255,0.04)'
                      : ep.checked
                        ? 'rgba(255,255,255,0.03)'
                        : 'transparent',
                    cursor: isActive ? 'default' : 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={ep.checked || isDone}
                    disabled={!!task}
                    onChange={() => toggleEp(ep.num)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: isDone
                      ? '#fff'
                      : isActive
                        ? `rgba(255,255,255,${0.15 + (progress / 100) * 0.85})`
                        : isFailed
                          ? 'rgba(255,255,255,0.15)'
                          : ep.checked
                            ? '#fff'
                            : 'rgba(255,255,255,0.3)',
                    transition: 'color 0.3s',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>
                    {ep.num}
                  </span>
                  {isDone && (
                    <span style={{
                      position: 'absolute',
                      right: 3,
                      top: 0,
                      fontSize: '0.5rem',
                      color: 'rgba(255,255,255,0.3)',
                    }}>✓</span>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
