from fastapi import APIRouter, HTTPException, status

from app.core.logging import get_logger
from app.schemas.chat import ChatRequest, ChatResponse, SourceChunk
from app.services.rag_service import RAGService, RAGServiceError

router = APIRouter(tags=["chat"])
logger = get_logger("indusbrain.chat")

rag_service = RAGService()


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
)
async def chat(request: ChatRequest) -> ChatResponse:
    """Answer user questions using Retrieval-Augmented Generation."""

    logger.info(
        "chat_request_received",
        extra={"question": request.question},
    )

    try:
        response = rag_service.answer_question(request.question)

        logger.info(
            "chat_request_completed",
            extra={
                "question": request.question,
                "results_found": response.search_results.total_results,
            },
        )

        return ChatResponse(
            question=response.question,
            answer=response.answer,
            sources=[
                SourceChunk(
                    chunk_id=result.chunk_id,
                    similarity_score=result.similarity_score,
                    metadata=result.metadata,
                )
                for result in response.search_results.results
            ],
        )

    except RAGServiceError as error:
        logger.exception(
            "chat_request_failed",
            extra={"error": str(error)},
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error