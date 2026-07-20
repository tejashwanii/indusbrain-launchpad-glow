import json
from pathlib import Path

from app.core.config import settings


class StatsService:
    def __init__(self):
        self.stats_file = Path(settings.UPLOAD_DIRECTORY) / "stats.json"

    def get_stats(self):
        if not self.stats_file.exists():
            return {
                "ai_queries": 0,
                "total_response_time": 0,
            }

        with self.stats_file.open("r", encoding="utf-8") as f:
            return json.load(f)

    def save_stats(self, stats):
        with self.stats_file.open("w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2)

    def record_query(self, response_time):
        stats = self.get_stats()

        stats["ai_queries"] += 1
        stats["total_response_time"] += response_time

        self.save_stats(stats)