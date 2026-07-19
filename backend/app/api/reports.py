from fastapi import APIRouter, HTTPException, Response, status

from app.core.logging import get_logger
from app.services.report_service import ReportService, ReportServiceError

router = APIRouter(tags=["reports"])
logger = get_logger("indusbrain.reports")
service = ReportService()


@router.get(
    "/report",
    status_code=status.HTTP_200_OK,
)
async def report() -> Response:
    """Generate and return a PDF report for the current dashboard context."""

    logger.info("report_request_received")

    try:
        pdf_bytes = service.generate_report_bytes()
    except ReportServiceError as error:
        logger.exception("report_generation_failed", extra={"error": str(error)})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    logger.info("report_request_completed")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=indusbrain-report.pdf"},
    )
