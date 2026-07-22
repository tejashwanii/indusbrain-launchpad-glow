"""Reusable Sentence Transformers embeddings for future indexing pipelines."""

from dataclasses import dataclass
from functools import lru_cache
from typing import TYPE_CHECKING, Any

from app.services.chunking_service import DocumentChunk

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer


EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


class EmbeddingServiceError(Exception):
    """Base exception for embedding-service failures."""


class InvalidEmbeddingInputError(EmbeddingServiceError, ValueError):
    """Raised when text or document chunks cannot be embedded."""


class EmbeddingModelLoadError(EmbeddingServiceError):
    """Raised when the configured Sentence Transformers model cannot be loaded."""


class EmbeddingGenerationError(EmbeddingServiceError):
    """Raised when the embedding model cannot generate valid vectors."""


@dataclass(frozen=True)
class ChunkEmbedding:
    """An embedding paired with the source chunk metadata needed for indexing."""

    chunk_id: str
    chunk_index: int
    text: str
    embedding: list[float]
    document_name: str = ""


@lru_cache(maxsize=1)
def _get_model() -> "SentenceTransformer":
    """Load the configured embedding model once and cache it for the process lifetime."""

    try:
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer(EMBEDDING_MODEL_NAME)
    except Exception as error:
        raise EmbeddingModelLoadError(
            f"Unable to load embedding model '{EMBEDDING_MODEL_NAME}'."
        ) from error


class EmbeddingService:
    """Create vector embeddings without coupling to a vector database or pipeline."""

    def embed_text(self, text: str) -> list[float]:
        """Generate one embedding vector for non-empty text.

        Args:
            text: Text to embed.

        Returns:
            A dense embedding vector represented as Python floats.

        Raises:
            InvalidEmbeddingInputError: The text is empty, whitespace-only, or invalid.
            EmbeddingModelLoadError: The model cannot be initialized.
            EmbeddingGenerationError: Vector generation fails or returns an invalid vector.
        """

        _validate_text(text)
        return self._embed_texts([text])[0]

    def embed_chunks(self, chunks: list[DocumentChunk]) -> list[ChunkEmbedding]:
        """Generate embeddings for document chunks in one model batch.

        Args:
            chunks: Ordered chunks returned from the chunking service.

        Returns:
            Chunk metadata paired with its corresponding embedding vector.

        Raises:
            InvalidEmbeddingInputError: The chunk list or any chunk text is invalid.
            EmbeddingModelLoadError: The model cannot be initialized.
            EmbeddingGenerationError: Batch vector generation fails or returns invalid vectors.
        """

        _validate_chunks(chunks)
        vectors = self._embed_texts([chunk.text for chunk in chunks])

        if len(vectors) != len(chunks):
            raise EmbeddingGenerationError("The model returned an unexpected number of embeddings.")

        return [
            ChunkEmbedding(
                chunk_id=chunk.chunk_id,
                chunk_index=chunk.chunk_index,
                text=chunk.text,
                embedding=vector,
            )
            for chunk, vector in zip(chunks, vectors, strict=True)
        ]

    def _embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Run one embedding batch and normalize the result to Python lists."""

        try:
            encoded_vectors = _get_model().encode(texts, convert_to_numpy=True)
            raw_vectors = encoded_vectors.tolist()
        except EmbeddingModelLoadError:
            raise
        except Exception as error:
            raise EmbeddingGenerationError("Failed to generate embeddings.") from error

        try:
            if len(texts) == 1 and raw_vectors and isinstance(raw_vectors[0], (int, float)):
                raw_vectors = [raw_vectors]
            return [_coerce_vector(vector) for vector in raw_vectors]
        except (TypeError, ValueError) as error:
            raise EmbeddingGenerationError("The model returned an invalid embedding vector.") from error


def _validate_text(text: str) -> None:
    """Reject empty or non-string text before model execution."""

    if not isinstance(text, str) or not text.strip():
        raise InvalidEmbeddingInputError("Text must be a non-empty string.")


def _validate_chunks(chunks: list[DocumentChunk]) -> None:
    """Validate chunk input independently from any future indexing pipeline."""

    if not isinstance(chunks, list) or not chunks:
        raise InvalidEmbeddingInputError("chunks must be a non-empty list of DocumentChunk values.")

    for chunk in chunks:
        if not isinstance(chunk, DocumentChunk):
            raise InvalidEmbeddingInputError("chunks must contain only DocumentChunk values.")
        _validate_text(chunk.text)


def _coerce_vector(vector: Any) -> list[float]:
    """Convert one model vector to a non-empty list of Python floats."""

    if not isinstance(vector, list) or not vector:
        raise ValueError("Embedding vector is empty or not list-shaped.")
    return [float(value) for value in vector]
