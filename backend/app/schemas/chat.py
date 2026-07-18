from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        description="User question about the uploaded documents.",
    )


class SourceChunk(BaseModel):
    chunk_id: str
    similarity_score: float
    metadata: dict


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list[SourceChunk]