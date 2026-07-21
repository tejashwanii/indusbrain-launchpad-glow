"""Compliance analysis over indexed industrial document chunks."""

from __future__ import annotations

import json
import re
from typing import Any

from app.core.logging import get_logger
from app.services.chromadb_service import ChromaDBService
from app.services.gemini_client import GeminiClientError
from app.services.rag_service import RAGService, RAGServiceError

logger = get_logger("indusbrain.compliance.service")

AI_UNAVAILABLE_MESSAGE = (
    "Compliance analysis is temporarily unavailable. Your documents remain indexed and can be analyzed later."
)
NO_DOCUMENTS_MESSAGE = (
    "No documents uploaded. Upload industrial documents to generate an AI-powered compliance assessment."
)

_STANDARD_NAMES = ("ISO 55000", "IEC 61511", "OSHA 1910", "ATEX 2014/34/EU")


class ComplianceServiceError(Exception):
    """Raised when document retrieval for a compliance assessment fails."""


class ComplianceService:
    """Assess indexed industrial documentation against requested standards."""

    def __init__(
        self,
        *,
        rag_service: RAGService | None = None,
        chromadb_service: ChromaDBService | None = None,
    ) -> None:
        """Create the service, optionally accepting a shared RAG service for testing."""

        self._rag_service = rag_service
        self._chromadb_service = chromadb_service or ChromaDBService()

    def analyze_compliance(self) -> dict[str, Any]:
        """Retrieve relevant chunks and ask Gemini for a structured compliance assessment."""

        try:
            if not self._chromadb_service.has_indexed_chunks():
                return {"overall": 0, "standards": [], "message": NO_DOCUMENTS_MESSAGE}

            rag_service = self._rag_service or RAGService()
            search_response = rag_service.retrieve_context(self._retrieval_query(), top_k=16)
        except (GeminiClientError, RAGServiceError) as error:
            if isinstance(error, GeminiClientError) or self._has_gemini_failure(error):
                return self._log_and_return_unavailable(error)
            raise ComplianceServiceError("Unable to retrieve compliance document context.") from error
        except Exception as error:
            # RAGService construction can fail when the Gemini client is unavailable.
            if self._has_gemini_failure(error):
                return self._log_and_return_unavailable(error)
            raise ComplianceServiceError("Unable to retrieve compliance document context.") from error

        if not search_response.results:
            return {"overall": 0, "standards": [], "message": NO_DOCUMENTS_MESSAGE}

        try:
            answer = rag_service.generate_from_context(
                self._generation_query(), search_response.results
            )
            return self._parse_payload(answer)
        except Exception as error:
            # Generation errors and malformed model output should not make the endpoint unavailable.
            return self._log_and_return_unavailable(error)

    @staticmethod
    def _retrieval_query() -> str:
        """Return the domain terms used to retrieve compliance evidence from ChromaDB."""

        return (
            "maintenance safety inspection PPE hazard emergency procedures "
            "lockout tagout preventive maintenance industrial compliance"
        )

    @staticmethod
    def _generation_query() -> str:
                """Return instructions for Gemini, with RAG supplying the document excerpts.

                Important: the model should only assign a numeric score when there is sufficient
                evidence in the supplied excerpts. If a standard cannot be evaluated from the
                excerpts, return `score`: null and `status`: "Not Evaluated" with an explanatory
                `reason`. Allowed status values: "Compliant", "Needs Review", "Needs Improvement",
                "Not Evaluated". Do not infer facts that are not present in the excerpts.
                """

                return (
                        "Evaluate the supplied industrial document excerpts only. Assess evidence against ISO 55000, "
                        "IEC 61511, OSHA 1910, and ATEX 2014/34/EU. Do not infer evidence that is absent from the excerpts. "
                        "Return ONLY a valid JSON object, with no Markdown or explanatory text, in exactly this shape:\n"
                        "{\n"
                        "  \"overall\": null,\n"
                        "  \"standards\": [\n"
                        "    {\"name\": \"ISO 55000\", \"score\": null, \"status\": \"Not Evaluated\", \"reason\": \"...\"},\n"
                        "    {\"name\": \"IEC 61511\", \"score\": null, \"status\": \"Not Evaluated\", \"reason\": \"...\"},\n"
                        "    {\"name\": \"OSHA 1910\", \"score\": null, \"status\": \"Not Evaluated\", \"reason\": \"...\"},\n"
                        "    {\"name\": \"ATEX 2014/34/EU\", \"score\": null, \"status\": \"Not Evaluated\", \"reason\": \"...\"}\n"
                        "  ]\n"
                        "}\n"
                        "When sufficient evidence exists for a standard, set `score` to an integer 0-100 and use one of: "
                        "\"Compliant\", \"Needs Review\", or \"Needs Improvement\". If there is not enough evidence, "
                        "set `score` to null and `status` to \"Not Evaluated\" with a concise reason grounded in the excerpts. "
                        "Do not include any additional fields."
                )

    def _parse_payload(self, answer: str) -> dict[str, Any]:
        """Validate and normalize Gemini's JSON response before exposing it publicly."""

        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", answer.strip(), flags=re.IGNORECASE)
        parsed = json.loads(cleaned)
        if not isinstance(parsed, dict) or not isinstance(parsed.get("standards"), list):
            raise ValueError("Compliance payload must contain a standards array.")

        standards_by_name = {item.get("name"): item for item in parsed["standards"] if isinstance(item, dict)}
        if (
            len(parsed["standards"]) != len(_STANDARD_NAMES)
            or len(standards_by_name) != len(_STANDARD_NAMES)
            or set(standards_by_name) != set(_STANDARD_NAMES)
        ):
            raise ValueError("Compliance payload must include each requested standard exactly once.")

        standards = [self._normalize_standard(standards_by_name[name], name) for name in _STANDARD_NAMES]

        # Compute overall from only numeric scores returned by the model. Ignore None values.
        numeric_scores = [s["score"] for s in standards if isinstance(s.get("score"), int)]
        if numeric_scores:
            overall = int(round(sum(numeric_scores) / len(numeric_scores)))
            return {"overall": overall, "standards": standards}

        # If no standards could be evaluated, return overall: None and an explanatory message.
        return {
            "overall": None,
            "standards": standards,
            "message": "No applicable compliance standards could be evaluated from the uploaded documents.",
        }

    def _normalize_standard(self, item: dict[str, Any], name: str) -> dict[str, Any]:
        """Normalize a single standard while retaining only safe response fields.

        Accept `score` as an integer 0-100 or `None` when not evaluated. Enforce a concise
        `reason` and a permitted `status` value.
        """

        reason = item.get("reason")
        status = item.get("status")
        if not isinstance(reason, str) or not reason.strip():
            raise ValueError("Each compliance standard requires a reason.")
        if not isinstance(status, str) or not status.strip():
            raise ValueError("Each compliance standard requires a status.")

        status_clean = status.strip()
        allowed = {"Compliant", "Needs Review", "Needs Improvement", "Not Evaluated"}
        if status_clean not in allowed:
            raise ValueError(f"Status must be one of {sorted(allowed)}.")

        score = item.get("score")
        if score is None:
            normalized_score = None
        else:
            normalized_score = self._score(score)

        return {"name": name, "score": normalized_score, "status": status_clean, "reason": reason.strip()}

    @staticmethod
    def _score(value: Any) -> int:
        """Coerce a Gemini score to the public 0--100 integer range.

        This function expects a numeric-like value and returns an int in 0..100.
        It does not accept booleans or None.
        """

        if value is None:
            raise ValueError("Score cannot be None here.")
        if isinstance(value, bool):
            raise ValueError("Scores must be numeric.")
        try:
            return max(0, min(100, int(value)))
        except (TypeError, ValueError) as error:
            raise ValueError("Scores must be numeric.") from error

    @staticmethod
    def _has_gemini_failure(error: BaseException) -> bool:
        """Determine whether Gemini caused a wrapped service exception."""

        current: BaseException | None = error
        while current is not None:
            if isinstance(current, GeminiClientError):
                return True
            current = current.__cause__ or current.__context__
        return False

    @staticmethod
    def _log_and_return_unavailable(error: BaseException) -> dict[str, Any]:
        """Log a non-fatal model failure and return the stable availability payload."""

        logger.warning(
            "compliance_analysis_unavailable",
            extra={"error_type": type(error).__name__, "error": str(error)},
            exc_info=True,
        )
        return {"overall": 0, "standards": [], "message": AI_UNAVAILABLE_MESSAGE}
