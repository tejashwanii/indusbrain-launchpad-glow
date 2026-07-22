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
    document_name: str | None = None
    metadata: dict


class ChatResponse(BaseModel):
    question: str
    answer: str
    confidence: float
    confidence_level: str
    sources: list[SourceChunk]