const API_BASE = '/api';

export interface SearchResult {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  genres: string[];
  status: string;
  season: { quarter?: string; year?: number };
  rating: string;
  episodes: { dub: number; sub: number; raw: number };
}

export interface AnimeDetail {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  genres: string[];
  status: string;
  season: { quarter?: string; year?: number };
  rating: string;
  episodes: { dub: string[]; sub: string[]; raw: string[] };
}

export interface SourceInfo {
  sourceUrl: string;
  sourceName: string;
  priority: number;
}

export interface SourcesResponse {
  sources: SourceInfo[];
  best_url: string | null;
  uploadDate: Record<string, unknown>;
}

export interface DownloadTask {
  task_id: string;
  episode: string;
  status: string;
}

export interface DownloadStatus {
  task_id: string;
  show_title: string;
  episode: string;
  mode: string;
  quality: string;
  status: string;
  progress: number;
  speed: string;
  eta: string;
  filename: string;
  filesize: number;
  error: string;
}

export async function searchAnime(q = '', page = 1, sortBy = '', genres = ''): Promise<SearchResult[]> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  if (sortBy) params.set('sort_by', sortBy);
  if (genres) params.set('genres', genres);
  const res = await fetch(`${API_BASE}/search?${params}`);
  const data = await res.json();
  return data.results;
}

export async function getTrending(): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE}/trending`);
  const data = await res.json();
  return data.results;
}

export async function getPopular(): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE}/popular`);
  const data = await res.json();
  return data.results;
}

export async function getAnimeDetail(showId: string): Promise<AnimeDetail> {
  const res = await fetch(`${API_BASE}/anime/${showId}`);
  return res.json();
}

export async function getEpisodeSources(showId: string, episode: string, mode = 'dub'): Promise<SourcesResponse> {
  const res = await fetch(`${API_BASE}/anime/${showId}/sources/${episode}?mode=${mode}`);
  return res.json();
}

export async function startDownload(
  showId: string,
  episodes: string,
  mode: string,
  quality: string,
  destination: string,
  title: string,
): Promise<{ tasks: DownloadTask[] }> {
  const res = await fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ show_id: showId, episodes, mode, quality, destination, title }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getTaskStatus(taskId: string): Promise<DownloadStatus> {
  const res = await fetch(`${API_BASE}/download/${taskId}`);
  return res.json();
}

export async function getAllDownloads(): Promise<{ downloads: DownloadStatus[] }> {
  const res = await fetch(`${API_BASE}/downloads`);
  return res.json();
}
