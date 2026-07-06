const HISTORY_KEY = 'anime_download_history'
const SEARCH_KEY = 'anime_search_history'
const MAX_SEARCH = 10

export interface HistoryEntry {
  showId: string
  showName: string
  thumbnail: string
  mode: 'dub' | 'sub'
  downloadedEpisodes: string[]
  lastDownloaded: number
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHistory(entry: HistoryEntry) {
  const all = getHistory()
  const idx = all.findIndex(e => e.showId === entry.showId && e.mode === entry.mode)
  if (idx >= 0) {
    const merged = new Set([...all[idx].downloadedEpisodes, ...entry.downloadedEpisodes])
    all[idx] = { ...all[idx], ...entry, downloadedEpisodes: [...merged], lastDownloaded: Date.now() }
  } else {
    all.unshift(entry)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all))
}

export function addDownloadedEpisodes(showId: string, showName: string, thumbnail: string, mode: 'dub' | 'sub', episodes: string[]) {
  if (episodes.length === 0) return
  saveHistory({ showId, showName, thumbnail, mode, downloadedEpisodes: episodes, lastDownloaded: Date.now() })
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

// Search history
export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addSearchQuery(query: string) {
  const all = getSearchHistory().filter(q => q.toLowerCase() !== query.toLowerCase())
  all.unshift(query)
  localStorage.setItem(SEARCH_KEY, JSON.stringify(all.slice(0, MAX_SEARCH)))
}

export function clearSearchHistory() {
  localStorage.removeItem(SEARCH_KEY)
}
