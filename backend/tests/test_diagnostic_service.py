from types import SimpleNamespace

from app.services.diagnostic_service import DiagnosticService


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
