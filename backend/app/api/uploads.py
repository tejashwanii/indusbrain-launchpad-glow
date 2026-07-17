from pathlib import Path
from typing import NoReturn

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.documents import DocumentUploadResponse
from app.services.document_storage import (
    UnsupportedDocumentTypeError,
    UploadTooLargeError,
    store_pdf,
)
from app.services.pdf_service import (
    CorruptedPDFError,
    EmptyPDFError,
    PasswordProtectedPDFError,
    extract_pdf_text,
)

router = APIRouter(tags=["documents"])
logger = get_logger("indusbrain.uploads")


def _stored_pdf_path(document_id: str) -> Path:
    """Build the storage path used by the document storage service."""
    return Path(settings.UPLOAD_DIRECTORY) / f"{document_id}.pdf"


def _validate_stored_pdf(document: DocumentUploadResponse) -> None:
    """Ensure a newly stored PDF can be opened and its pages parsed."""

    logger.info(
        "pdf_extraction_started",
        extra={
            "document_id": document.document_id,
            "uploaded_filename": document.filename,
        },
    )

    extract_pdf_text(_stored_pdf_path(document.document_id))

    logger.info(
        "pdf_extraction_succeeded",
        extra={
            "document_id": document.document_id,
            "uploaded_filename": document.filename,
        },
    )


def _cleanup_failed_upload(document: DocumentUploadResponse) -> None:
    """Remove a stored PDF when its subsequent validation fails."""

    path = _stored_pdf_path(document.document_id)

    try:
        path.unlink(missing_ok=True)
    except OSError as error:
        logger.exception(
            "upload_cleanup_failed",
            extra={
                "document_id": document.document_id,
                "uploaded_filename": document.filename,
                "error": str(error),
            },
        )
        return

    logger.info(
        "upload_cleanup_performed",
        extra={
            "document_id": document.document_id,
            "uploaded_filename": document.filename,
        },
    )


def _raise_extraction_error(
    document: DocumentUploadResponse,
    error: Exception,
) -> NoReturn:
    """Log, clean up, and convert PDF validation failures to HTTP errors."""

    logger.exception(
        "pdf_extraction_failed",
        extra={
            "document_id": document.document_id,
            "uploaded_filename": document.filename,
            "error": str(error),
        },
    )

    _cleanup_failed_upload(document)

    if isinstance(
        error,
        (
            PasswordProtectedPDFError,
            CorruptedPDFError,
            EmptyPDFError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unable to validate the uploaded PDF.",
    ) from error


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
) -> DocumentUploadResponse:
    """Store and validate a PDF document without further processing."""

    logger.info(
        "upload_started",
        extra={
            "uploaded_filename": file.filename,
        },
    )

    try:
        try:
            document = await store_pdf(
                upload=file,
                upload_directory=settings.UPLOAD_DIRECTORY,
                max_upload_size=settings.MAX_UPLOAD_SIZE,
            )
        except UnsupportedDocumentTypeError as error:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=str(error),
            ) from error

        except UploadTooLargeError as error:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=str(error),
            ) from error

        logger.info(
            "upload_saved",
            extra={
                "document_id": document.document_id,
                "uploaded_filename": document.filename,
            },
        )

        try:
            _validate_stored_pdf(document)
        except Exception as error:
            _raise_extraction_error(document, error)

        return document

    finally:
        await file.close()