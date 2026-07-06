import asyncio
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from allanime import get_episode_sources, get_show_detail, pick_best_source, search_anime
from downloader import download_episodes, get_all_downloads, get_task_status, downloading
from models import DownloadRequest

app = FastAPI(title="Anime Downloader")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/search")
async def search(
    q: str = "",
    page: int = 1,
    sort_by: str = "",
    genres: str = "",
):
    genre_list = [g.strip() for g in genres.split(",") if g.strip()] if genres else None
    results = await search_anime(query=q, page=page, sort_by=sort_by, genres=genre_list)
    return {"results": results, "page": page}


@app.get("/api/trending")
async def trending():
    results = await search_anime(sort_by="Trending", limit=24)
    return {"results": results}


@app.get("/api/popular")
async def popular():
    results = await search_anime(sort_by="Popular", limit=24)
    return {"results": results}


@app.get("/api/anime/{show_id}")
async def anime_detail(show_id: str):
    show = await get_show_detail(show_id)
    if not show:
        raise HTTPException(404, "Anime not found")
    return show


@app.get("/api/anime/{show_id}/sources/{episode}")
async def episode_sources(show_id: str, episode: str, mode: str = "dub"):
    result = await get_episode_sources(show_id, mode, episode)
    sources = result.get("sources", [])
    best = pick_best_source(sources)
    return {
        "sources": sources,
        "best_url": best,
        "uploadDate": result.get("uploadDate", {}),
    }


@app.post("/api/download")
async def start_download(req: DownloadRequest):
    episodes_raw = req.episodes
    if "-" in episodes_raw:
        parts = episodes_raw.split("-")
        try:
            start, end = int(parts[0]), int(parts[1])
            episodes = [str(i) for i in range(start, end + 1)]
        except ValueError:
            raise HTTPException(400, "Invalid episode range")
    elif "," in episodes_raw:
        episodes = [e.strip() for e in episodes_raw.split(",")]
    else:
        episodes = [episodes_raw]

    source_urls = {}
    for ep in episodes:
        result = await get_episode_sources(req.show_id, req.mode, ep)
        url = pick_best_source(result.get("sources", []))
        if url:
            source_urls[ep] = url

    if not source_urls:
        raise HTTPException(404, "No source URLs found for any requested episode")

    results = await download_episodes(
        episodes=list(source_urls.keys()),
        show_title=req.title or "Anime",
        show_id=req.show_id,
        source_urls=source_urls,
        mode=req.mode,
        quality=req.quality,
        destination=req.destination,
    )

    return {"tasks": results}


@app.get("/api/download/{task_id}")
async def task_status(task_id: str):
    task = get_task_status(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@app.get("/api/download/{task_id}/file")
async def serve_file(task_id: str):
    task = get_task_status(task_id)
    if not task or task.get("status") != "done":
        raise HTTPException(404, "File not ready")
    fname = task.get("filename", "")
    if not fname:
        raise HTTPException(404, "No filename")

    dest = downloading.get(task_id, {}).get("_dest_dir", "")
    candidates = [Path(dest) / fname, Path.home() / "Videos/anime" / fname]
    for p in candidates:
        if p.exists():
            return FileResponse(str(p), filename=fname, media_type="video/mp4")
    raise HTTPException(404, "File not found on disk")


@app.get("/api/downloads")
async def all_downloads():
    return {"downloads": get_all_downloads()}


ws_clients: dict[str, list[WebSocket]] = {}


@app.websocket("/ws/download/{task_id}")
async def download_ws(websocket: WebSocket, task_id: str):
    await websocket.accept()
    if task_id not in ws_clients:
        ws_clients[task_id] = []
    ws_clients[task_id].append(websocket)
    try:
        while True:
            task = get_task_status(task_id)
            if task:
                await websocket.send_json(task)
                if task.get("status") in ("done", "failed"):
                    break
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
    finally:
        if task_id in ws_clients:
            ws_clients[task_id].remove(websocket)
            if not ws_clients[task_id]:
                del ws_clients[task_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
