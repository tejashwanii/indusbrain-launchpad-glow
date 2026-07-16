from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.schemas.documents import DocumentUploadResponse
from app.services.document_storage import (
    UnsupportedDocumentTypeError,
    UploadTooLargeError,
    store_pdf,
)


router = APIRouter(tags=["documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(file: UploadFile = File(...)) -> DocumentUploadResponse:
    """Store a PDF document. OCR and other processing are intentionally deferred."""

    try:
        return await store_pdf(
            upload=file,
            upload_directory=settings.UPLOAD_DIRECTORY,
            max_upload_size=settings.MAX_UPLOAD_SIZE,
        )
    except UnsupportedDocumentTypeError as error:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(error))
    except UploadTooLargeError as error:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(error))
    finally:
        await file.close()
