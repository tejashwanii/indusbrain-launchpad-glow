"""High-level Retrieval-Augmented Generation (RAG) service."""

from __future__ import annotations

from dataclasses import dataclass

from app.services.gemini_client import GeminiClient
from app.services.prompt_builder import PromptBuilder
from app.services.semantic_search_service import (
    SearchResponse,
    SemanticSearchService,
)


class RAGServiceError(Exception):
    """Raised when the RAG pipeline fails."""


@dataclass(frozen=True)
class RAGResponse:
    """Structured response returned by the RAG pipeline."""

    question: str
    answer: str
    search_results: SearchResponse


class RAGService:
    """Coordinates semantic search, prompt generation and Gemini."""

    def __init__(
        self,
        *,
        search_service: SemanticSearchService | None = None,
        prompt_builder: PromptBuilder | None = None,
        gemini_client: GeminiClient | None = None,
    ) -> None:
        self._search_service = search_service or SemanticSearchService()
        self._prompt_builder = prompt_builder or PromptBuilder()
        self._gemini_client = gemini_client or GeminiClient()

    def answer_question(
        self,
        question: str,
        *,
        top_k: int = 5,
    ) -> RAGResponse:
        """
        Execute the complete RAG pipeline.

        User Question
            ↓
        Semantic Search
            ↓
        Prompt Builder
            ↓
        Gemini
            ↓
        Final Answer
        """

        if not isinstance(question, str) or not question.strip():
            raise ValueError("question must be a non-empty string.")

        try:
            search_response = self._search_service.search(
                query=question,
                top_k=top_k,
            )

            prompt = self._prompt_builder.build_prompt(
                query=question,
                search_results=search_response.results,
            )

            answer = self._gemini_client.generate_response(prompt)

            return RAGResponse(
                question=question,
                answer=answer,
                search_results=search_response,
            )

        except Exception as error:
            raise RAGServiceError(
                f"Unable to complete the RAG pipeline: {error}"
            ) from error