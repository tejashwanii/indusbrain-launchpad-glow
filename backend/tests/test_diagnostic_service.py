from types import SimpleNamespace

from app.services.diagnostic_service import DiagnosticService
from app.services.gemini_client import GeminiClientError
from app.services.rag_service import RAGServiceError


class DummyRAGService:
    def __init__(self, answer: str) -> None:
        self.answer = answer

    def retrieve_context(self, question: str, *, top_k: int) -> SimpleNamespace:
        return SimpleNamespace(total_results=1, results=[SimpleNamespace(text="Hydraulic oil schedule")])

    def generate_from_context(self, question: str, search_results: list[object]) -> str:
        return self.answer


def test_generate_diagnostics_parses_structured_json_payload() -> None:
    service = DiagnosticService(
        rag_service=DummyRAGService(
            '{"insights":[{"kind":"maintenance","category":"Preventive Maintenance","title":"Hydraulic Oil Replacement","description":"Hydraulic oil should be replaced every 6 months.","timing":"Every 6 months","severity":"medium","actions":["Open SOP"]}]}'
        )
    )

    payload = service.generate_diagnostics()

    assert payload["insights"][0]["title"] == "Hydraulic Oil Replacement"
    assert payload["insights"][0]["severity"] == "medium"
    assert payload["insights"][0]["actions"] == ["Open SOP"]


def test_generate_diagnostics_returns_empty_state_without_indexed_documents() -> None:
    class EmptyRAGService:
        def retrieve_context(self, question: str, *, top_k: int) -> SimpleNamespace:
            return SimpleNamespace(total_results=0, results=[])

    payload = DiagnosticService(rag_service=EmptyRAGService()).generate_diagnostics()

    assert payload == {
        "insights": [],
        "message": "No indexed documents available.",
    }


def test_generate_diagnostics_returns_fallback_when_gemini_is_unavailable() -> None:
    class UnavailableGeminiRAGService(DummyRAGService):
        def generate_from_context(self, question: str, search_results: list[object]) -> str:
            raise GeminiClientError("503 UNAVAILABLE")

    payload = DiagnosticService(
        rag_service=UnavailableGeminiRAGService("")
    ).generate_diagnostics()

    assert payload["insights"] == []
    assert payload["message"] == (
        "AI insight generation is temporarily unavailable. Your uploaded documents remain indexed and can be retried shortly."
    )


def test_generate_diagnostics_handles_wrapped_gemini_failure() -> None:
    class WrappedGeminiFailureRAGService(DummyRAGService):
        def generate_from_context(self, question: str, search_results: list[object]) -> str:
            try:
                raise GeminiClientError("503 UNAVAILABLE")
            except GeminiClientError as error:
                raise RAGServiceError("Unable to generate diagnostics.") from error

    payload = DiagnosticService(
        rag_service=WrappedGeminiFailureRAGService("")
    ).generate_diagnostics()

    assert payload["insights"] == []
