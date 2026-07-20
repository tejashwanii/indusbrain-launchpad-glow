from pydantic import BaseModel


class DocumentItem(BaseModel):
    filename: str
    status: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentItem]