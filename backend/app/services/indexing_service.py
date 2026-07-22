"""Reusable document indexing orchestration for the backend pipeline."""

from __future__ import annotations

from app.core.logging import get_logger
from dataclasses import dataclass
from pathlib import Path

from app.services.chunking_service import chunk_document
from app.services.chromadb_service import ChromaDBService
from app.services.embedding_service import ChunkEmbedding, EmbeddingService
from app.services.pdf_service import extract_pdf_text
from app.services.knowledge_graph_service import KnowledgeGraphService

logger = get_logger("indusbrain.indexing")

class DocumentIndexingError(Exception):
    """Base exception for document indexing failures."""


class DocumentIndexingFailure(DocumentIndexingError):
    """Raised when the indexing workflow cannot be completed successfully."""


@dataclass(frozen=True)
class IndexingResult:
    """Summary of a completed document indexing operation."""

    document_name: str
    total_pages: int
    total_chunks: int
    indexed_chunks: int
    status: str


class DocumentIndexingService:
    """Coordinate PDF extraction, chunking, embedding generation, and Chroma storage."""

    def __init__(
        self,
        *,
        embedding_service: EmbeddingService | None = None,
        chromadb_service: ChromaDBService | None = None,
    ) -> None:
        """Create an indexing service with reusable collaborators.

        Args:
            embedding_service: Optional embedding service instance for generating vectors.
            chromadb_service: Optional ChromaDB persistence service for storing vectors.
        """

        self._embedding_service = embedding_service or EmbeddingService()
        self._chromadb_service = chromadb_service or ChromaDBService()

    def index_document(
    self,
    pdf_path: str,
    document_name: str,
) -> IndexingResult:
        """Run the full document indexing workflow for a PDF file.

        Args:
            pdf_path: Filesystem path to the source PDF document.

        Returns:
            A summary describing the indexed document and the number of stored chunks.

        Raises:
            DocumentIndexingError: The input path is invalid.
            DocumentIndexingFailure: The indexing workflow fails at any stage.
        """

        if not isinstance(pdf_path, str) or not pdf_path.strip():
            raise DocumentIndexingError("pdf_path must be a non-empty string.")

        path = Path(pdf_path)
        if not path.is_file():
            raise DocumentIndexingError(f"PDF file not found: {path}")

        try:
            extraction_result = extract_pdf_text(path)

            graph_service = KnowledgeGraphService()

            try:
                graph_service.generate(
                    extraction_result.full_text,
                    path.stem,
                )
            except Exception as e:
                logger.warning(
                    "Knowledge graph generation skipped: %s",
                    e,
                )

            chunks = chunk_document(extraction_result.full_text)
            embeddings = self._embedding_service.embed_chunks(chunks)
            embeddings = [
                ChunkEmbedding(
                    chunk_id=embedding.chunk_id,
                    chunk_index=embedding.chunk_index,
                    text=embedding.text,
                    embedding=embedding.embedding,
                    document_name=document_name,
                )
                for embedding in embeddings
            ]
            self._chromadb_service.add_embeddings(embeddings)
        except (DocumentIndexingError, ValueError) as error:
            raise DocumentIndexingFailure(f"Unable to index document '{path}'.") from error
        except Exception as error:
            raise DocumentIndexingFailure(f"Unable to index document '{path}'.") from error

        return IndexingResult(
            document_name=path.name,
            total_pages=extraction_result.total_pages,
            total_chunks=len(chunks),
            indexed_chunks=len(embeddings),
            status="indexed",
        )
