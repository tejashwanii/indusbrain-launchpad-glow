from pathlib import Path
import json

from app.core.config import settings
from app.schemas.document_list import (
    DocumentItem,
    DocumentListResponse,
)


class DocumentService:
    def list_documents(self) -> DocumentListResponse:
        metadata_file = Path(settings.UPLOAD_DIRECTORY) / "metadata.json"

        if not metadata_file.exists():
            return DocumentListResponse(documents=[])

        with metadata_file.open("r", encoding="utf-8") as f:
            metadata = json.load(f)

        documents = [
            DocumentItem(
                filename=document["original_filename"],
                status="Indexed",
            )
            for document in metadata
        ]

        return DocumentListResponse(documents=documents)