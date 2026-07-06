import asyncio
import json
import os
import re
import time
import uuid
from typing import Any

downloading: dict[str, Any] = {}
completed: list[dict] = []
_processes: dict[str, asyncio.subprocess.Process] = {}


def sanitize_filename(name: str) -> str:
    return re.sub(r"[\\/:*?\"<>|]", "", name).strip()


async def run_download(
    task_id: str,
    source_url: str,
    dest_dir: str,
    filename: str,
    referer: str = "https://youtu-chan.com",
):
    os.makedirs(dest_dir, exist_ok=True)
    outpath = os.path.join(dest_dir, f"{filename}.mp4")
    task = downloading.get(task_id, {})
    task["status"] = "downloading"
    task["filename"] = f"{filename}.mp4"
    task["started_at"] = time.time()

    try:
        proc = await asyncio.create_subprocess_exec(
            "yt-dlp",
            "--no-warnings",
            "--no-part",
            "--merge-output-format", "mp4",
            "-f", "best",
            "--referer", referer,
            "--newline",
            "-o", outpath,
            source_url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        _processes[task_id] = proc

        last_update = time.time()
        if proc.stdout is None:
            task["status"] = "failed"
            task["error"] = "process stdout was closed unexpectedly"
            downloading[task_id] = task
            return

        async for line in proc.stdout:
            line = line.decode(errors="replace").strip()
            if not line:
                continue

            if "[download]" in line:
                p_match = re.search(r"(\d+\.?\d*)%", line)
                s_match = re.search(r"at\s+([\d.]+[KiMG]i?B/s)", line)
                e_match = re.search(r"ETA\s+(\d+:\d+)", line)

                if p_match:
                    task["progress"] = float(p_match.group(1))
                if s_match:
                    task["speed"] = s_match.group(1)
                if e_match:
                    task["eta"] = e_match.group(1)

                now = time.time()
                if now - last_update > 0.3:
                    downloading[task_id] = task
                    last_update = now

        await proc.wait()

        if proc.returncode == 0 and os.path.exists(outpath):
            task["status"] = "done"
            task["progress"] = 100.0
            task["filesize"] = os.path.getsize(outpath)
            downloading[task_id] = task
            completed.append({
                "task_id": task_id,
                "title": task.get("show_title", ""),
                "episode": task.get("episode", ""),
                "filename": f"{filename}.mp4",
                "filepath": outpath,
                "filesize": task["filesize"],
                "mode": task.get("mode", ""),
                "completed_at": time.time(),
            })
        else:
            stderr_data = ""
            if proc.stderr:
                stderr_data = (await proc.stderr.read()).decode(errors="replace")[-500:]
            task["status"] = "failed"
            task["error"] = stderr_data
            downloading[task_id] = task

    except asyncio.CancelledError:
        task["status"] = "cancelled"
        downloading[task_id] = task
    except Exception as e:
        task["status"] = "failed"
        task["error"] = str(e)[:500]
        downloading[task_id] = task
    finally:
        _processes.pop(task_id, None)


def stop_all_downloads() -> list[str]:
    stopped = []
    for task_id, proc in list(_processes.items()):
        try:
            proc.terminate()
        except Exception:
            pass
        task = downloading.get(task_id)
        if task:
            task["status"] = "cancelled"
            downloading[task_id] = task
        stopped.append(task_id)
    _processes.clear()
    return stopped


async def download_episodes(
    episodes: list[str],
    show_title: str,
    show_id: str,
    source_urls: dict[str, str],
    mode: str,
    quality: str,
    destination: str,
) -> list[dict]:
    results = []
    for ep in episodes:
        task_id = uuid.uuid4().hex[:12]
        url = source_urls.get(ep)
        if not url:
            results.append({"task_id": task_id, "episode": ep, "status": "failed", "error": "no source URL"})
            continue

        if not destination:
            safe_title = sanitize_filename(show_title)
            dest_dir = os.path.expanduser(f"~/Videos/anime/{safe_title}/")
        else:
            dest_dir = os.path.expanduser(destination)

        filename = f"Episode_{ep.zfill(2)}"

        task = {
            "task_id": task_id,
            "show_title": show_title,
            "episode": ep,
            "mode": mode,
            "quality": quality,
            "status": "queued",
            "progress": 0.0,
            "speed": "",
            "eta": "",
            "filename": f"{filename}.mp4",
            "filesize": 0,
            "error": "",
        }
        downloading[task_id] = task
        results.append({"task_id": task_id, "episode": ep, "status": "queued"})

        asyncio.create_task(run_download(task_id, url, dest_dir, filename))

    return results


def get_task_status(task_id: str) -> dict | None:
    return downloading.get(task_id)


def get_all_downloads() -> list[dict]:
    return list(downloading.values()) + completed[-50:]
