"""PDF text extraction primitives.

This module extracts embedded PDF text only. Pages without text are preserved in
the result so a future OCR service can detect and process scanned documents.
"""

from dataclasses import dataclass
from pathlib import Path

import fitz


class PDFExtractionError(Exception):
    """Base exception for failures while opening or extracting a PDF."""


class PDFNotFoundError(PDFExtractionError):
    """Raised when the requested PDF path does not exist or is not a file."""


class CorruptedPDFError(PDFExtractionError):
    """Raised when a PDF cannot be opened because its contents are invalid."""


class PasswordProtectedPDFError(PDFExtractionError):
    """Raised when a PDF requires a password before its contents can be read."""


class EmptyPDFError(PDFExtractionError):
    """Raised when a readable PDF contains no pages."""


@dataclass(frozen=True)
class PDFPageText:
    """Embedded text extracted from one PDF page, using one-based page numbering."""

    page_number: int
    text: str


@dataclass(frozen=True)
class PDFExtractionResult:
    """Text output from a PDF, retained at both document and page granularity."""

    full_text: str
    pages: list[PDFPageText]
    total_pages: int


def extract_pdf_text(pdf_path: str | Path) -> PDFExtractionResult:
    """Extract embedded text from a PDF while preserving one-based page numbers.

    Args:
        pdf_path: Filesystem path to the PDF to read.

    Returns:
        A document-level text value, text for each page, and the total page count.
        A page with no embedded text is returned with an empty ``text`` field so it
        can be processed by a future OCR implementation.

    Raises:
        PDFNotFoundError: The input path is not a file.
        CorruptedPDFError: PyMuPDF cannot open the document as a valid PDF.
        PasswordProtectedPDFError: The PDF requires a password.
        EmptyPDFError: The PDF opens successfully but contains zero pages.
        PDFExtractionError: Text cannot be read from an individual page.
    """

    path = Path(pdf_path)
    if not path.is_file():
        raise PDFNotFoundError(f"PDF file not found: {path}")

    try:
        document = fitz.open(path)
    except (fitz.EmptyFileError, fitz.FileDataError) as error:
        raise CorruptedPDFError(f"Unable to open PDF: {path}") from error
    except OSError as error:
        raise PDFExtractionError(f"Unable to read PDF: {path}") from error

    with document:
        if document.needs_pass:
            raise PasswordProtectedPDFError(f"PDF is password-protected: {path}")

        if document.page_count == 0:
            raise EmptyPDFError(f"PDF contains no pages: {path}")

        pages: list[PDFPageText] = []
        for page_index in range(document.page_count):
            try:
                page_text = document.load_page(page_index).get_text("text")
            except (fitz.FileDataError, RuntimeError) as error:
                raise PDFExtractionError(
                    f"Unable to extract text from page {page_index + 1}: {path}"
                ) from error

            pages.append(PDFPageText(page_number=page_index + 1, text=page_text))

    return PDFExtractionResult(
        full_text="\n".join(page.text for page in pages),
        pages=pages,
        total_pages=len(pages),
    )
