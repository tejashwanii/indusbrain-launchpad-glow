from pathlib import Path

from app.core.config import settings
from app.schemas.dashboard import DashboardStats
from app.services.chromadb_service import ChromaDBService


class DashboardService:
    def __init__(self) -> None:
        self._chroma = ChromaDBService()

    def get_stats(self) -> DashboardStats:
        print("Dashboard API called")

        upload_dir = Path(settings.UPLOAD_DIRECTORY)

        documents = len(list(upload_dir.glob("*.pdf")))

        try:
            chunks = self._chroma.get_collection().count()
        except Exception:
            chunks = 0

        stats = DashboardStats(
            documents_indexed=documents,
            indexed_chunks=chunks,
            ai_queries=0,
            average_response_time="-",
        )

        print(stats)

        return stats