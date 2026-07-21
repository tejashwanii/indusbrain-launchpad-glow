from pathlib import Path
import json

from app.core.config import settings
from app.schemas.dashboard import DashboardStats
from app.services.chromadb_service import ChromaDBService


class DashboardService:
    def __init__(self) -> None:
        self._chroma = ChromaDBService()

    def get_stats(self) -> DashboardStats:
        print("Dashboard API called")

        upload_dir = Path(settings.UPLOAD_DIRECTORY)

        metadata_file = upload_dir / "metadata.json"

        if metadata_file.exists():
            with metadata_file.open("r", encoding="utf-8") as f:
                metadata = json.load(f)
            documents = len(metadata)
        else:
            documents = 0

        try:
            chunks = self._chroma.get_collection().count()
        except Exception:
            chunks = 0

        stats_file = upload_dir / "stats.json"

        ai_queries = 0
        average_response_time = "-"

        if stats_file.exists():
            with stats_file.open("r", encoding="utf-8") as f:
                data = json.load(f)

            ai_queries = data.get("ai_queries", 0)

            if ai_queries > 0:
                average_response_time = (
                    f"{data.get('total_response_time', 0) / ai_queries:.2f}s"
                )

        stats = DashboardStats(
            documents_indexed=documents,
            indexed_chunks=chunks,
            ai_queries=ai_queries,
            average_response_time=average_response_time,
        )

        print(stats)

        return stats