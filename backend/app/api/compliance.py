"""Compliance Center API endpoint."""

from fastapi import APIRouter, HTTPException, status

from app.core.logging import get_logger
from app.schemas.compliance import ComplianceResponse
from app.services.compliance_service import ComplianceService, ComplianceServiceError

router = APIRouter(tags=["compliance"])
logger = get_logger("indusbrain.compliance")
service = ComplianceService()


@router.get("/compliance", response_model=ComplianceResponse, status_code=status.HTTP_200_OK)
async def get_compliance() -> ComplianceResponse:
    """Generate a Compliance Center assessment using indexed document evidence."""

    try:
        payload = service.analyze_compliance()
    except ComplianceServiceError as error:
        logger.exception("compliance_request_failed", extra={"error": str(error)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Compliance document retrieval is temporarily unavailable.",
        ) from error

    return ComplianceResponse(**payload)
