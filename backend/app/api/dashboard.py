from fastapi import APIRouter

from app.schemas.dashboard import DashboardStats
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["dashboard"])

dashboard_service = DashboardService()


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats() -> DashboardStats:
    return dashboard_service.get_stats()