"""Service for generating structured maintenance diagnostics from the RAG pipeline."""

from __future__ import annotations

import json
import re
from typing import Any

from app.core.logging import get_logger
from app.services.gemini_client import GeminiClientError
from app.services.rag_service import RAGService, RAGServiceError


class DiagnosticServiceError(Exception):
    """Raised when a diagnostic payload cannot be generated."""


logger = get_logger("indusbrain.diagnostics.service")
AI_UNAVAILABLE_MESSAGE = (
    "AI insight generation is temporarily unavailable. Your uploaded documents remain indexed and can be retried shortly."
)


class DiagnosticService:
    """Builds structured maintenance diagnostics from uploaded documents."""

    def __init__(self, *, rag_service: RAGService | None = None) -> None:
        self._rag_service = rag_service or RAGService()

    def generate_diagnostics(self) -> dict[str, Any]:
        """Generate a structured diagnostic payload from the RAG pipeline."""

        retrieval_query = (
            "industrial maintenance schedules, inspection requirements, operating limits, "
            "safety risks, failures, and recommended maintenance actions"
        )
        generation_query = (
            "Using only the supplied document excerpts, return JSON only with an 'insights' array "
            "containing 3 to 5 actionable industrial maintenance insights. Omit any insight that is "
            "not supported by the excerpts. Each insight must contain kind, category, title, "
            "description, timing, severity, and actions. category must be a concise label such as "
            "Preventive Maintenance or Risk Mitigation. severity must be high, medium, or low. "
            "actions must be an array of concise button labels. Do not use knowledge outside the excerpts."
        )

        try:
            search_results = self._rag_service.retrieve_context(retrieval_query, top_k=8)
            if not search_results.results:
                return {
                    "insights": [],
                    "message": "No indexed documents available.",
                }

            answer = self._rag_service.generate_from_context(
                generation_query,
                search_results.results,
            )
        except GeminiClientError as error:
            logger.warning(
                "diagnostic_ai_generation_unavailable",
                extra={"error_type": type(error).__name__, "error": str(error)},
                exc_info=True,
            )
            return self._ai_unavailable_payload()
        except RAGServiceError as error:
            if self._has_gemini_failure(error):
                logger.warning(
                    "diagnostic_ai_generation_unavailable",
                    extra={"error_type": type(error).__name__, "error": str(error)},
                    exc_info=True,
                )
                return self._ai_unavailable_payload()
            raise DiagnosticServiceError(
                "Unable to generate maintenance diagnostics."
            ) from error
        except ValueError as error:
            raise DiagnosticServiceError(
                "Unable to generate maintenance diagnostics."
            ) from error

        try:
            payload = self._parse_payload(answer)
        except (TypeError, ValueError) as error:
            raise DiagnosticServiceError("Gemini returned an invalid diagnostic response.") from error

        return payload

    @staticmethod
    def _ai_unavailable_payload() -> dict[str, Any]:
        """Return the stable diagnostic response while Gemini is unavailable."""

        return {"insights": [], "message": AI_UNAVAILABLE_MESSAGE}

    @staticmethod
    def _has_gemini_failure(error: BaseException) -> bool:
        """Identify a Gemini failure preserved as the cause of a RAG error."""

        current: BaseException | None = error
        while current is not None:
            if isinstance(current, GeminiClientError):
                return True
            current = current.__cause__ or current.__context__
        return False

    def _parse_payload(self, answer: str) -> dict[str, list[dict[str, Any]]]:
        cleaned = self._strip_code_fences(answer)
        parsed = json.loads(cleaned)

        if not isinstance(parsed, dict):
            raise ValueError("Diagnostic payload must be a JSON object.")

        insights = parsed.get("insights")
        if not isinstance(insights, list):
            raise ValueError("Diagnostic payload must contain an 'insights' array.")

        normalized_insights = [self._normalize_insight(item) for item in insights[:5]]
        return {"insights": normalized_insights}

    def _normalize_insight(self, item: Any) -> dict[str, Any]:
        if not isinstance(item, dict):
            raise ValueError("Each insight must be a JSON object.")

        actions = item.get("actions") or []
        normalized_actions = [self._normalize_action(action) for action in actions]

        return {
            "kind": self._coerce_kind(item.get("kind"), item.get("category")),
            "category": self._coerce_text(item.get("category"), "General"),
            "title": self._coerce_text(item.get("title"), "Maintenance Insight"),
            "description": self._coerce_text(item.get("description"), "Maintenance guidance is available."),
            "timing": self._coerce_text(item.get("timing"), "During operation"),
            "severity": self._coerce_severity(item.get("severity")),
            "actions": normalized_actions,
        }

    def _normalize_action(self, action: Any) -> str:
        if isinstance(action, str) and action.strip():
            return action.strip()
        if isinstance(action, dict):
            return self._coerce_text(action.get("label"), "Open SOP")
        return "Open SOP"

    def _strip_code_fences(self, answer: str) -> str:
        cleaned = answer.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        return cleaned.strip()

    def _coerce_kind(self, value: Any, category: Any) -> str:
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(category, str) and category.strip():
            return category.strip()
        return "AI"

    def _coerce_text(self, value: Any, default: str) -> str:
        if isinstance(value, str) and value.strip():
            return value.strip()
        return default

    def _coerce_severity(self, value: Any) -> str:
        if isinstance(value, str) and value.strip().lower() in {"high", "medium", "low"}:
            return value.strip().lower()
        return "low"
