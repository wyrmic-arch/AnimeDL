<![CDATA[<pre align="center">
████████  ████████  ███████  ██████   ██████
   ██     ██    ██ ██    ██ ██    ██ ██
   ██     ████████ ██    ██ ██████   ██████
   ██     ██    ██ ██    ██ ██    ██     ██
   ██     ██    ██  ██████  ██████   ██████
</pre>

<h1 align="center">Anime Downloader</h1>

<p align="center">
  <strong>Self-hosted web app for searching, browsing, and downloading anime episodes.</strong>
</p>

<p align="center">
  <code>Python</code> · <code>FastAPI</code> · <code>React</code> · <code>yt-dlp</code>
</p>

<br>

---

<br>

## Overview

A clean, black-and-white web interface that lets you search any anime, browse trending and popular shows, filter by genre, and download episodes directly to your machine. Everything runs locally — no ads, no trackers, no accounts.

---

## Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| Python     | 3.11+   | Backend server (FastAPI) |
| Node.js    | 20+     | Frontend dev server (Vite) |
| yt-dlp     | latest  | Video download engine |
| ffmpeg     | latest  | Merges DASH video+audio streams (required by yt-dlp) |

Install missing deps:

```bash
# Python
pip install yt-dlp

# ffmpeg (choose one)
sudo apt install ffmpeg          # Debian/Ubuntu
sudo pacman -S ffmpeg            # Arch
brew install ffmpeg              # macOS

# Node.js — download from https://nodejs.org or use nvm
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/wyrmic-arch/anime-downloader.git
cd anime-downloader

# 2. Set up the backend
cd backend
pip install -r requirements.txt
cd ..

# 3. Set up the frontend
cd frontend
npm install
cd ..

# 4. Start both servers
bash start.sh
```

Open **http://localhost:5173** in your browser.

To stop the servers:

```bash
kill $(lsof -ti:8000) $(lsof -ti:5173) 2>/dev/null
```

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Trending shows, popular shows, genre filter, search bar |
| `/search` | Search | Text search with genre filters |
| `/anime/:id` | Anime Detail | Episode grid, Dub/Sub toggle, quality selector, batch download |
| `/downloads` | Downloads | Active downloads with real-time progress, stop all, completed history |
| `/history` | History | Shows you've downloaded — click to resume where you left off |
| `/setup` | Setup | How-to guide and prerequisites |

---

## Features

- **Search** — Find any anime by name or filter by genre
- **Trending / Popular** — Browse what's hot right now
- **Cover images** — Thumbnails, descriptions, genres, status badges
- **Dub / Sub** — Toggle between English dub and subbed episodes
- **Quality selection** — Choose from 360p to 1080p or best available
- **Batch download** — Select multiple episodes; runs up to 3 in parallel
- **Real-time progress** — Episode numbers gradually turn white as they download
- **Stop all** — Cancel all active downloads with one click
- **Download history** — Every completed episode is saved; pick up where you left off
- **Search history** — Recent searches appear in the dropdown when focusing the search bar
- **Recommendations** — Trending shows shown in the search dropdown
- **Custom destination** — Choose where files are saved
- **Persistent servers** — Both daemons survive shell disconnects (uses `setsid`)

---

## Project Structure

```
anime-downloader/
├── backend/
│   ├── main.py          # FastAPI routes, CORS, WebSocket
│   ├── allanime.py      # Allanime API client (search, detail, sources, AES decrypt)
│   ├── downloader.py    # yt-dlp subprocess management, progress tracking
│   ├── models.py        # Pydantic schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts                    # Typed fetch wrappers
│   │   ├── history.ts                # localStorage download/search history
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── AnimePage.tsx
│   │   │   ├── DownloadsPage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   └── SetupPage.tsx
│   │   ├── components/
│   │   │   ├── AnimeCard.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchDropdown.tsx
│   │   └── styles/global.css
│   └── package.json
├── start.sh
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=&genres=&sort_by=` | Search anime |
| GET | `/api/trending` | Trending shows |
| GET | `/api/popular` | Popular shows |
| GET | `/api/anime/{id}` | Full show detail (description, genres, episodes) |
| GET | `/api/anime/{id}/sources/{ep}?mode=` | Episode source URLs |
| POST | `/api/download` | Start download task |
| GET | `/api/download/{task_id}` | Task status |
| GET | `/api/download/{task_id}/file` | Serve completed file |
| GET | `/api/downloads` | All download tasks |
| POST | `/api/downloads/stop` | Stop all active downloads |
| WS | `/ws/download/{task_id}` | Real-time download progress |

---

## Open Source

This project is open source and released under the MIT License.

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Allanime API](https://allanime.to/)
]]>