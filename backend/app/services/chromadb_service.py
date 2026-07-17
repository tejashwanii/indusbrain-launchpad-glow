"""Reusable ChromaDB persistence service for chunk embeddings."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.services.embedding_service import ChunkEmbedding

logger = get_logger("indusbrain.chromadb")

COLLECTION_NAME = "industrial_documents"


class ChromaDBServiceError(Exception):
    """Base exception for ChromaDB service failures."""


class ChromaDBInitializationError(ChromaDBServiceError):
    """Raised when the persistent Chroma client cannot be initialized."""


class ChromaDBCollectionError(ChromaDBServiceError):
    """Raised when a collection cannot be created or accessed."""


class ChromaDBInsertionError(ChromaDBServiceError):
    """Raised when embeddings cannot be inserted into the collection."""


class ChromaDBInvalidInputError(ChromaDBServiceError, ValueError):
    """Raised when inputs are empty, invalid, or malformed."""


class ChromaDBService:
    """Persist chunk embeddings into a local, persistent Chroma collection."""

    def __init__(self, *, persist_directory: str | None = None) -> None:
        """Initialize the ChromaDB service with a persistent local backend.

        Args:
            persist_directory: Optional override for the local Chroma storage path.
        """

        self._persist_directory = persist_directory or settings.CHROMA_DB_PATH
        self._client: Any | None = None
        self._collection: Any | None = None

    def create_collection(self) -> Any:
        """Create and return the configured Chroma collection."""

        try:
            collection = self._get_client().create_collection(name=COLLECTION_NAME)
        except Exception as error:
            raise ChromaDBCollectionError(
                f"Unable to create Chroma collection '{COLLECTION_NAME}'."
            ) from error

        self._collection = collection
        return collection

    def get_collection(self) -> Any:
        """Return the configured collection, creating it if it does not exist."""

        if self._collection is not None:
            return self._collection

        try:
            client = self._get_client()
            collection = client.get_collection(name=COLLECTION_NAME)
        except Exception:
            return self.create_collection()

        self._collection = collection
        return collection

    def reset_collection(self) -> None:
        """Delete and recreate the configured collection."""

        try:
            self._get_client().delete_collection(name=COLLECTION_NAME)
        except Exception as error:
            raise ChromaDBCollectionError(
                f"Unable to reset Chroma collection '{COLLECTION_NAME}'."
            ) from error

        self._collection = None

    def add_embeddings(self, chunk_embeddings: list[ChunkEmbedding]) -> None:
        """Insert chunk embeddings into the configured collection.

        Args:
            chunk_embeddings: Ordered embeddings returned by the embedding service.

        Raises:
            ChromaDBInvalidInputError: The input list or any chunk embedding is invalid.
            ChromaDBCollectionError: The collection cannot be created or accessed.
            ChromaDBInsertionError: The batch cannot be written to Chroma.
        """

        _validate_chunk_embeddings(chunk_embeddings)

        collection = self.get_collection()

        ids = [embedding.chunk_id for embedding in chunk_embeddings]
        documents = [embedding.text for embedding in chunk_embeddings]
        embeddings = [embedding.embedding for embedding in chunk_embeddings]
        metadatas = [
            {"chunk_index": embedding.chunk_index} for embedding in chunk_embeddings
        ]

        try:
            collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
            )
        except Exception as error:
            logger.exception(
                "chromadb_insertion_failed",
                extra={
                    "collection_name": COLLECTION_NAME,
                    "chunk_count": len(chunk_embeddings),
                },
            )
            raise ChromaDBInsertionError(
                f"Unable to insert embeddings into collection '{COLLECTION_NAME}'."
            ) from error

    def _get_client(self) -> Any:
        """Create and cache a persistent Chroma client if necessary."""

        if self._client is not None:
            return self._client

        try:
            import chromadb
        except ImportError as error:
            raise ChromaDBInitializationError(
                "The chromadb package is not installed."
            ) from error

        try:
            self._client = chromadb.PersistentClient(path=str(Path(self._persist_directory)))
        except Exception as error:
            raise ChromaDBInitializationError(
                "Unable to initialize a persistent Chroma client."
            ) from error

        return self._client


def _validate_chunk_embeddings(chunk_embeddings: list[ChunkEmbedding]) -> None:
    """Ensure chunk embeddings are provided as a non-empty list of valid values."""

    if not isinstance(chunk_embeddings, list) or not chunk_embeddings:
        raise ChromaDBInvalidInputError(
            "chunk_embeddings must be a non-empty list of ChunkEmbedding values."
        )

    for embedding in chunk_embeddings:
        if not isinstance(embedding, ChunkEmbedding):
            raise ChromaDBInvalidInputError(
                "chunk_embeddings must contain only ChunkEmbedding values."
            )

        if not isinstance(embedding.chunk_id, str) or not embedding.chunk_id.strip():
            raise ChromaDBInvalidInputError("chunk_id must be a non-empty string.")

        if not isinstance(embedding.text, str) or not embedding.text.strip():
            raise ChromaDBInvalidInputError("text must be a non-empty string.")

        if not isinstance(embedding.embedding, list) or not embedding.embedding:
            raise ChromaDBInvalidInputError("embedding must be a non-empty list of floats.")

        if not all(isinstance(value, (int, float)) for value in embedding.embedding):
            raise ChromaDBInvalidInputError("embedding values must be numeric.")

        if isinstance(embedding.chunk_index, bool) or not isinstance(embedding.chunk_index, int):
            raise ChromaDBInvalidInputError("chunk_index must be an integer.")
