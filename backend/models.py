from pydantic import BaseModel


class SearchParams(BaseModel):
    q: str
    page: int = 1


class DownloadRequest(BaseModel):
    show_id: str
    episodes: str
    mode: str = "dub"
    quality: str = "720"
    destination: str = ""
    title: str = ""


class DownloadTask(BaseModel):
    task_id: str
    show_title: str
    episode: str
    mode: str
    quality: str
    status: str = "queued"
    progress: float = 0.0
    speed: str = ""
    eta: str = ""
    filename: str = ""
    filesize: int = 0
    error: str = ""
