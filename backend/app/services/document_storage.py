import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.schemas.documents import DocumentUploadResponse


class UnsupportedDocumentTypeError(ValueError):
    """Raised when an uploaded document is not a PDF."""


class UploadTooLargeError(ValueError):
    """Raised when an upload exceeds the configured byte limit."""


async def store_pdf(
    upload: UploadFile,
    upload_directory: str,
    max_upload_size: int,
) -> DocumentUploadResponse:
    """Validate and persist a PDF upload without processing its contents."""

    filename = Path(upload.filename or "").name
    if not filename or Path(filename).suffix.lower() != ".pdf":
        raise UnsupportedDocumentTypeError("Only PDF files are supported.")

    destination_directory = Path(upload_directory)
    destination_directory.mkdir(parents=True, exist_ok=True)

    document_id = str(uuid4())
    destination = destination_directory / f"{document_id}.pdf"
    bytes_written = 0

    try:
        with destination.open("xb") as stored_file:
            while chunk := await upload.read(1024 * 1024):
                bytes_written += len(chunk)
                if bytes_written > max_upload_size:
                    raise UploadTooLargeError(
                        f"Uploaded file exceeds the {max_upload_size}-byte limit."
                    )
                stored_file.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise

    metadata_file = destination_directory / "metadata.json"

    if metadata_file.exists():
        with metadata_file.open("r", encoding="utf-8") as f:
            metadata = json.load(f)
    else:
        metadata = []

    metadata.append(
        {
            "document_id": document_id,
            "original_filename": filename,
            "stored_filename": f"{document_id}.pdf",
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    with metadata_file.open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return DocumentUploadResponse(
        document_id=document_id,
        filename=filename,
        upload_time=datetime.now(timezone.utc),
        status="uploaded",
    )
