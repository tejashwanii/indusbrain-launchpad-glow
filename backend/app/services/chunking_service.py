"""Reusable recursive character-based text chunking for retrieval pipelines."""

from dataclasses import dataclass
from uuid import uuid4


DEFAULT_CHUNK_SIZE = 500
DEFAULT_CHUNK_OVERLAP = 100
_SEPARATORS = ("\n\n", "\n", ". ", " ", "")


class ChunkingError(ValueError):
    """Base exception for document chunking failures."""


class InvalidDocumentTextError(ChunkingError):
    """Raised when text cannot produce meaningful document chunks."""


class InvalidChunkingConfigurationError(ChunkingError):
    """Raised when the requested chunk size or overlap is invalid."""


@dataclass(frozen=True)
class DocumentChunk:
    """A retrievable text segment with a stable position in its source document."""

    chunk_id: str
    chunk_index: int
    text: str


def chunk_document(
    text: str,
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[DocumentChunk]:
    """Split document text into overlapping, paragraph-aware RAG chunks.

    Text is recursively separated on paragraph, line, sentence, and word
    boundaries before a character-level fallback is used. Whitespace-only
    fragments are excluded from the result.

    Args:
        text: The complete extracted document text.
        chunk_size: Maximum target size of each chunk, in characters.
        chunk_overlap: Target number of trailing characters carried into the
            following chunk.

    Returns:
        Ordered document chunks with zero-based indexes and generated UUIDs.

    Raises:
        InvalidDocumentTextError: The input is not a non-empty string.
        InvalidChunkingConfigurationError: Size or overlap values are invalid.
    """

    _validate_input(text, chunk_size, chunk_overlap)
    segments = _split_recursively(text.strip(), _SEPARATORS, chunk_size)
    chunk_texts = _merge_segments(segments, chunk_size, chunk_overlap)

    if not chunk_texts:
        raise InvalidDocumentTextError("Document text does not contain any chunkable content.")

    return [
        DocumentChunk(chunk_id=str(uuid4()), chunk_index=index, text=chunk_text)
        for index, chunk_text in enumerate(chunk_texts)
    ]


def _validate_input(text: str, chunk_size: int, chunk_overlap: int) -> None:
    """Validate document text and chunking controls before processing."""

    if not isinstance(text, str) or not text.strip():
        raise InvalidDocumentTextError("Document text must be a non-empty string.")
    if isinstance(chunk_size, bool) or not isinstance(chunk_size, int) or chunk_size <= 0:
        raise InvalidChunkingConfigurationError("chunk_size must be a positive integer.")
    if isinstance(chunk_overlap, bool) or not isinstance(chunk_overlap, int):
        raise InvalidChunkingConfigurationError("chunk_overlap must be an integer.")
    if not 0 <= chunk_overlap < chunk_size:
        raise InvalidChunkingConfigurationError(
            "chunk_overlap must be greater than or equal to zero and smaller than chunk_size."
        )


def _split_recursively(text: str, separators: tuple[str, ...], chunk_size: int) -> list[str]:
    """Return size-bounded segments, preferring separators in their given order."""

    if len(text) <= chunk_size:
        return [text]
    if not separators:
        return _split_by_character_count(text, chunk_size)

    separator = separators[0]
    if not separator or separator not in text:
        return _split_recursively(text, separators[1:], chunk_size)

    pieces = text.split(separator)
    segments: list[str] = []
    for index, piece in enumerate(pieces):
        # Restore the delimiter so paragraphs and sentence boundaries remain intact.
        candidate = piece if index == len(pieces) - 1 else f"{piece}{separator}"
        if not candidate.strip():
            continue
        if len(candidate) <= chunk_size:
            segments.append(candidate)
        else:
            segments.extend(_split_recursively(candidate, separators[1:], chunk_size))
    return segments


def _split_by_character_count(text: str, chunk_size: int) -> list[str]:
    """Apply the final character-based fallback to text with no useful delimiter."""

    # Smaller fallback units let the merge step retain overlap even for text
    # without paragraph, sentence, or word boundaries.
    segment_size = max(1, chunk_size // 2)
    return [text[index : index + segment_size] for index in range(0, len(text), segment_size)]


def _merge_segments(segments: list[str], chunk_size: int, chunk_overlap: int) -> list[str]:
    """Merge recursive segments into overlapping chunks without empty results."""

    chunks: list[str] = []
    current = ""

    for segment in segments:
        if not segment.strip():
            continue

        if current and len(current) + len(segment) > chunk_size:
            chunks.append(current.strip())
            current = _overlap_tail(current, chunk_overlap)

            # A boundary-preserving segment can be nearly chunk-sized. Reduce
            # overlap only when necessary to preserve the configured size cap.
            if len(current) + len(segment) > chunk_size:
                current = _overlap_tail(current, max(0, chunk_size - len(segment)))

        current += segment

    if current.strip():
        chunks.append(current.strip())

    return [chunk for chunk in chunks if chunk.strip()]


def _overlap_tail(text: str, overlap_size: int) -> str:
    """Return up to ``overlap_size`` trailing characters for the next chunk."""

    if overlap_size == 0:
        return ""
    return text[-overlap_size:]
