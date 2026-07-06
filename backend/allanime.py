import base64
import json
import re
import subprocess
from typing import Any

import httpx

API = "https://api.allanime.day"
REFR = "https://youtu-chan.com"
AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0"

SEARCH_QUERY = """query($search:SearchInput,$limit:Int,$page:Int,$translationType:VaildTranslationTypeEnumType,$countryOrigin:VaildCountryOriginEnumType){
  shows(search:$search limit:$limit page:$page translationType:$translationType countryOrigin:$countryOrigin){
    edges{_id name thumbnail description genres availableEpisodes status season rating __typename}
  }
}"""

SHOW_DETAIL_QUERY = """query($showId:String!){
  show(_id:$showId){
    _id name thumbnail description genres availableEpisodesDetail season status rating
  }
}"""

EPISODE_SOURCE_HASH = "d405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec"


def decrypt_tobeparsed(data: dict[str, Any]) -> str:
    t = data.get("data", {}).get("tobeparsed", "")
    if not t:
        return json.dumps(data)
    raw = base64.b64decode(t)
    key = subprocess.run(
        ["openssl", "dgst", "-sha256", "-binary"],
        input=b"Xot36i3lK3:v1",
        capture_output=True,
    ).stdout
    key_hex = key.hex().encode()
    iv = raw[1:13].hex() + "00000002"
    ct = raw[13:-16]
    out = subprocess.run(
        ["openssl", "enc", "-d", "-aes-256-ctr", "-K", key_hex, "-iv", iv, "-nosalt", "-nopad"],
        input=ct,
        capture_output=True,
    ).stdout
    return out.decode(errors="replace")


def extract_episodes(detail: dict, mode: str) -> list[str]:
    raw = detail.get(mode, "")
    if isinstance(raw, list):
        return [str(e) for e in raw]
    if isinstance(raw, str):
        matches = re.findall(r'"([^"]+)"', raw)
        return matches if matches else raw.split(",")
    return []


async def search_anime(
    query: str = "",
    page: int = 1,
    limit: int = 30,
    sort_by: str = "",
    genres: list[str] | None = None,
) -> list[dict]:
    search: dict[str, Any] = {"allowAdult": False, "allowUnknown": False}
    if query:
        search["query"] = query
    if sort_by:
        search["sortBy"] = sort_by
    if genres:
        search["genres"] = genres
        search["includeGenres"] = True

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{API}/api",
            json={
                "variables": {
                    "search": search,
                    "limit": limit,
                    "page": page,
                    "translationType": "dub",
                    "countryOrigin": "ALL",
                },
                "query": SEARCH_QUERY,
            },
            headers={"User-Agent": AGENT, "Referer": REFR, "Content-Type": "application/json"},
            timeout=15,
        )
    data = resp.json()
    edges = data.get("data", {}).get("shows", {}).get("edges", [])
    results = []
    for e in edges:
        ep = e.get("availableEpisodes", {})
        results.append({
            "id": e["_id"],
            "name": e["name"],
            "thumbnail": e.get("thumbnail", ""),
            "description": e.get("description", ""),
            "genres": e.get("genres", []),
            "status": e.get("status", ""),
            "season": e.get("season", {}),
            "rating": e.get("rating", ""),
            "episodes": {"dub": ep.get("dub", 0), "sub": ep.get("sub", 0), "raw": ep.get("raw", 0)},
        })
    return results


async def get_show_detail(show_id: str) -> dict | None:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{API}/api",
            json={"variables": {"showId": show_id}, "query": SHOW_DETAIL_QUERY},
            headers={"User-Agent": AGENT, "Referer": REFR, "Content-Type": "application/json"},
            timeout=15,
        )
    data = resp.json()
    show = data.get("data", {}).get("show")
    if not show:
        return None
    detail = show.get("availableEpisodesDetail") or {}
    return {
        "id": show["_id"],
        "name": show["name"],
        "thumbnail": show.get("thumbnail", ""),
        "description": show.get("description", ""),
        "genres": show.get("genres", []),
        "status": show.get("status", ""),
        "season": show.get("season", {}),
        "rating": show.get("rating", ""),
        "episodes": {
            "dub": extract_episodes(detail, "dub"),
            "sub": extract_episodes(detail, "sub"),
            "raw": extract_episodes(detail, "raw"),
        },
    }


async def get_episode_sources(show_id: str, mode: str, episode: str) -> dict[str, Any]:
    params = {"showId": show_id, "translationType": mode, "episodeString": episode}
    extensions = {"persistedQuery": {"version": 1, "sha256Hash": EPISODE_SOURCE_HASH}}
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{API}/api",
            params={"variables": json.dumps(params), "extensions": json.dumps(extensions)},
            headers={"User-Agent": AGENT, "Referer": REFR, "Origin": REFR},
            timeout=15,
        )
    body = resp.text
    if '"tobeparsed"' in body:
        text = decrypt_tobeparsed(resp.json())
    else:
        text = body
    try:
        parsed = json.loads(text)
        episode_data = parsed.get("episode") or parsed.get("data", {}).get("episode", {})
        if isinstance(episode_data, dict):
            urls = episode_data.get("sourceUrls", [])
            upload_date = episode_data.get("uploadDate", {})
            result = {"sources": urls, "uploadDate": upload_date}
            return result
        return {"sources": [], "uploadDate": {}}
    except json.JSONDecodeError:
        sources = re.findall(r'"sourceUrl":"(https://[^"]*)"', text)
        names = re.findall(r'"sourceName":"([^"]*)"', text)
        return {
            "sources": [{"sourceUrl": u, "sourceName": n, "priority": i} for i, (u, n) in enumerate(zip(sources, names))],
            "uploadDate": {},
        }


def pick_best_source(sources: list[dict]) -> str | None:
    if not sources:
        return None
    priorities = {"tools.fast4speed": 0, "ok.ru": 1, "mp4upload": 2, "streamsb": 3, "streamlare": 4}
    sorted_sources = sorted(
        sources,
        key=lambda s: (
            next((p for k, p in priorities.items() if k in s.get("sourceUrl", "")), 99),
            s.get("priority", 99),
        ),
    )
    for s in sorted_sources:
        url = s.get("sourceUrl", "")
        if url:
            return url
    return None
