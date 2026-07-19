from fastapi import APIRouter, HTTPException, status

from app.core.logging import get_logger
from app.schemas.diagnostics import DiagnosticResponse
from app.services.diagnostic_service import DiagnosticService, DiagnosticServiceError

router = APIRouter(tags=["diagnostics"])
logger = get_logger("indusbrain.diagnostics")

service = DiagnosticService()


@router.post(
    "/diagnostic",
    response_model=DiagnosticResponse,
    status_code=status.HTTP_200_OK,
)
async def diagnostic() -> DiagnosticResponse:
    """Generate structured diagnostic insights based on uploaded documents."""

    logger.info("diagnostic_request_received")

    try:
        payload = service.generate_diagnostics()
    except DiagnosticServiceError as error:
        logger.exception("diagnostic_request_failed", extra={"error": str(error)})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    logger.info(
        "diagnostic_request_completed",
        extra={"insights_count": len(payload.get("insights", []))},
    )

    return DiagnosticResponse(**payload)
