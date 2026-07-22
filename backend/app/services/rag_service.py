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
    confidence: float
    confidence_level: str
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
        self._gemini_client = gemini_client

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
            search_response = self.retrieve_context(question, top_k=top_k)

            best_score = max(
                (result.similarity_score for result in search_response.results),
                default=0.0,
            )

            confidence = max(
                0.0,
                min(round(((best_score + 1) / 2) * 100, 1), 100.0),
            )

            if confidence >= 80:
                confidence_level = "High"
            elif confidence >= 60:
                confidence_level = "Medium"
            else:
                confidence_level = "Low"

            try:
                answer = self.generate_from_context(
                    question,
                    search_response.results,
                )
            except Exception:
                fallback_chunks = "\n\n".join(
                    f"• {result.text}"
                    for result in search_response.results[:3]
                )

                answer = (
                    "⚠️ AI generation is temporarily unavailable because the "
                    "language model could not be reached.\n\n"
                    "The following information was retrieved from the uploaded "
                    "documents:\n\n"
                    f"{fallback_chunks}"
                )

            return RAGResponse(
                question=question,
                answer=answer,
                confidence=confidence,
                confidence_level=confidence_level,
                search_results=search_response,
            )

        except Exception as error:
            raise RAGServiceError(
                f"Unable to complete the RAG pipeline: {error}"
            ) from error

    def retrieve_context(
        self,
        query: str,
        *,
        top_k: int = 5,
    ) -> SearchResponse:
        """Retrieve document chunks for a RAG request."""

        if not isinstance(query, str) or not query.strip():
            raise ValueError("query must be a non-empty string.")

        try:
            return self._search_service.search(
                query=query,
                top_k=top_k,
            )
        except Exception as error:
            raise RAGServiceError(
                "Unable to retrieve document context."
            ) from error

    def generate_from_context(
        self,
        query: str,
        search_results: list,
    ) -> str:
        """Generate an answer from retrieved document chunks."""

        if not search_results:
            raise ValueError(
                "search_results must contain at least one document chunk."
            )

        prompt = self._prompt_builder.build_prompt(
            query=query,
            search_results=search_results,
        )

        if not prompt.strip():
            raise ValueError("Generated prompt must not be empty.")

        gemini_client = self._gemini_client or GeminiClient()

        return gemini_client.generate_response(prompt)