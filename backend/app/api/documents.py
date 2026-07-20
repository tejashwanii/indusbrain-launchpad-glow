from fastapi import APIRouter

from app.schemas.document_list import DocumentListResponse
from app.services.document_service import DocumentService

router = APIRouter(tags=["documents"])

document_service = DocumentService()


@router.get("/documents", response_model=DocumentListResponse)
def get_documents() -> DocumentListResponse:
    return document_service.list_documents()