"""Generate downloadable PDF reports from uploaded documents and diagnostics."""

from __future__ import annotations

import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.config import settings
from app.services.chunking_service import chunk_document
from app.services.diagnostic_service import DiagnosticService
from app.services.pdf_service import extract_pdf_text


class ReportServiceError(Exception):
    """Raised when a PDF report cannot be generated."""


class ReportService:
    """Build a PDF report summarizing uploaded documents and AI diagnostics."""

    def __init__(
        self,
        *,
        diagnostic_service: DiagnosticService | None = None,
        stats_service: Any | None = None,
    ) -> None:
        self._diagnostic_service = diagnostic_service or DiagnosticService()
        self._stats_service = stats_service

    def generate_report_bytes(self) -> bytes:
        """Create a PDF report and return the encoded bytes."""

        try:
            documents = self._load_documents()
            diagnostics = self._diagnostic_service.generate_diagnostics()
            insights = diagnostics.get("insights", [])
            stats = self._get_stats(documents, insights)
        except Exception as error:
            raise ReportServiceError("Unable to build the report payload.") from error

        buffer = io.BytesIO()
        document = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#16263D"),
            spaceAfter=8,
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["BodyText"],
            fontSize=10,
            textColor=colors.HexColor("#5A6782"),
            spaceAfter=16,
        )
        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["BodyText"],
            fontSize=10,
            leading=14,
            spaceAfter=6,
        )
        bullet_style = ParagraphStyle(
            "ReportBullet",
            parent=styles["BodyText"],
            fontSize=10,
            leading=13,
            leftIndent=12,
            spaceAfter=4,
        )
        section_style = ParagraphStyle(
            "ReportSection",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=colors.HexColor("#244A9A"),
            spaceAfter=8,
            spaceBefore=12,
        )

        story: list[Any] = []
        story.append(Paragraph("IndusBrain Operations Report", title_style))
        story.append(
            Paragraph(
                f"Generated {self._now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
                subtitle_style,
            )
        )
        story.append(Spacer(1, 6))

        story.append(Paragraph("Dashboard Statistics", section_style))
        stats_table = Table(
            [
                ["Documents Indexed", str(stats.get("documents_indexed", 0))],
                ["Indexed Chunks", str(stats.get("chunks", 0))],
                ["AI Queries", str(stats.get("ai_queries", 0))],
            ],
            colWidths=[2.6 * inch, 1.4 * inch],
        )
        stats_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F6FF")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#16263D")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9E3F0")),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(stats_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Uploaded Documents", section_style))
        if documents:
            for document in documents:
                story.append(Paragraph(f"• {document.get('filename', 'Document')}", bullet_style))
        else:
            story.append(Paragraph("No uploaded documents are available yet.", body_style))
        story.append(Spacer(1, 10))

        story.append(Paragraph("AI Insights", section_style))
        if insights:
            for insight in insights:
                story.append(Paragraph(f"{insight.get('title', 'Insight')}", body_style))
                story.append(Paragraph(f"{insight.get('body', '')}", bullet_style))
                story.append(Paragraph(f"Severity: {insight.get('severity', 'info')}", bullet_style))
        else:
            story.append(Paragraph("No AI insights were generated from the current documents.", body_style))
        story.append(Spacer(1, 10))

        story.append(Paragraph("Maintenance Recommendations", section_style))
        story.append(Paragraph("Review the documented procedures and schedule the recommended actions using the AI guidance above.", body_style))
        story.append(Spacer(1, 10))

        story.append(Paragraph("Generated by IndusBrain AI", subtitle_style))

        document.build(story)
        return buffer.getvalue()

    def _load_documents(self) -> list[dict[str, Any]]:
        upload_directory = settings.UPLOAD_DIRECTORY
        documents: list[dict[str, Any]] = []
        try:
            for path in sorted(Path(upload_directory).glob("*.pdf")):
                if path.is_file():
                    documents.append({"filename": path.name, "path": str(path)})
        except OSError:
            return []
        return documents

    def _get_stats(self, documents: list[dict[str, Any]], insights: list[dict[str, Any]]) -> dict[str, int]:
        if self._stats_service is not None:
            return self._stats_service.get_dashboard_stats(documents, insights)

        chunk_count = 0
        for document in documents:
            path = Path(document.get("path", ""))
            if not path.is_file():
                continue
            try:
                extraction_result = extract_pdf_text(path)
                chunk_count += len(chunk_document(extraction_result.full_text))
            except Exception:
                continue

        return {
            "documents_indexed": len(documents),
            "chunks": chunk_count,
            "ai_queries": max(1, len(insights)),
        }

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)
