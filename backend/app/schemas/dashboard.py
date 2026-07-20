from pydantic import BaseModel


class DashboardStats(BaseModel):
    documents_indexed: int
    indexed_chunks: int
    ai_queries: int
    average_response_time: str