from __future__ import annotations

from app.services.report_service import ReportService


class DummyDiagnosticService:
    def generate_diagnostics(self) -> dict[str, list[dict[str, object]]]:
        return {
            "insights": [
                {
                    "kind": "AI",
                    "title": "Maintenance Insight",
                    "body": "Hydraulic oil should be replaced every 6 months.",
                    "time": "Generated now",
                    "severity": "warning",
                    "actions": [{"label": "Open SOP", "primary": True}],
                }
            ]
        }


class DummyStatsService:
    def get_dashboard_stats(self, documents: list[dict[str, object]], insights: list[dict[str, object]]) -> dict[str, int]:
        return {
            "documents_indexed": len(documents),
            "chunks": 24,
            "ai_queries": max(1, len(insights)),
        }


def test_generate_report_bytes_returns_pdf_payload() -> None:
    service = ReportService(
        diagnostic_service=DummyDiagnosticService(),
        stats_service=DummyStatsService(),
    )

    payload = service.generate_report_bytes()

    assert payload.startswith(b"%PDF")
    assert b"IndusBrain AI" in payload
