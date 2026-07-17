"""Reusable semantic search orchestration over Chroma-backed document chunks."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.services.chromadb_service import ChromaDBService
from app.services.embedding_service import EmbeddingService


class EmptyQueryError(ValueError):
    """Raised when a semantic search query is empty or whitespace-only."""


class SemanticSearchError(Exception):
    """Base exception for semantic-search failures."""


@dataclass(frozen=True)
class SearchResult:
    """A single semantic-search hit returned for a query."""

    chunk_id: str
    text: str
    similarity_score: float
    metadata: dict[str, Any]


@dataclass(frozen=True)
class SearchResponse:
    """Structured semantic-search output for downstream consumers."""

    query: str
    total_results: int
    results: list[SearchResult]


class SemanticSearchService:
    """Search indexed document chunks using embeddings stored in ChromaDB."""

    def __init__(
        self,
        *,
        embedding_service: EmbeddingService | None = None,
        chromadb_service: ChromaDBService | None = None,
    ) -> None:
        """Create a semantic-search service with reusable collaborators.

        Args:
            embedding_service: Optional embedding service instance for query vectors.
            chromadb_service: Optional Chroma persistence service for retrieval.
        """

        self._embedding_service = embedding_service or EmbeddingService()
        self._chromadb_service = chromadb_service or ChromaDBService()

    def search(self, query: str, top_k: int = 5) -> SearchResponse:
        """Search indexed chunks for the most similar text to a natural-language query.

        Args:
            query: The search query to embed and compare against indexed chunks.
            top_k: Maximum number of results to return.

        Returns:
            A structured response containing the matching chunks and scores.

        Raises:
            EmptyQueryError: The query is empty or whitespace-only.
            SemanticSearchError: Query embedding or Chroma retrieval fails.
        """

        _validate_query(query)
        _validate_top_k(top_k)

        try:
            query_embedding = self._embedding_service.embed_text(query)
            collection = self._chromadb_service.get_collection()
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
            )
        except EmptyQueryError:
            raise
        except Exception as error:
            raise SemanticSearchError("Unable to perform semantic search.") from error

        return SearchResponse(
            query=query,
            total_results=_coerce_result_count(results),
            results=_build_search_results(results),
        )


def _validate_query(query: str) -> None:
    """Ensure the search query is a non-empty string."""

    if not isinstance(query, str) or not query.strip():
        raise EmptyQueryError("query must be a non-empty string.")


def _validate_top_k(top_k: int) -> None:
    """Ensure the requested result count is a positive integer."""

    if isinstance(top_k, bool) or not isinstance(top_k, int) or top_k <= 0:
        raise SemanticSearchError("top_k must be a positive integer.")


def _coerce_result_count(results: dict[str, Any]) -> int:
    """Extract the number of returned results from Chroma's query response."""

    try:
        ids = results.get("ids", [])
        if isinstance(ids, list) and ids:
            return len(ids[0])
        return 0
    except Exception:
        return 0


def _build_search_results(results: dict[str, Any]) -> list[SearchResult]:
    """Convert Chroma query output into reusable search-result dataclasses."""

    try:
        ids = results.get("ids", []) or []
        documents = results.get("documents", []) or []
        distances = results.get("distances", []) or []
        metadatas = results.get("metadatas", []) or []

        if not isinstance(ids, list) or not ids:
            return []

        normalized_ids = ids[0]
        normalized_documents = documents[0] if documents else []
        normalized_distances = distances[0] if distances else []
        normalized_metadatas = metadatas[0] if metadatas else []

        search_results: list[SearchResult] = []
        for index, chunk_id in enumerate(normalized_ids):
            document_text = normalized_documents[index] if index < len(normalized_documents) else ""
            distance_value = normalized_distances[index] if index < len(normalized_distances) else 0.0
            metadata_value = normalized_metadatas[index] if index < len(normalized_metadatas) else {}
            similarity_score = max(0.0, 1.0 - float(distance_value))
            search_results.append(
                SearchResult(
                    chunk_id=str(chunk_id),
                    text=str(document_text),
                    similarity_score=similarity_score,
                    metadata=dict(metadata_value),
                )
            )
        return search_results
    except Exception:
        return []
