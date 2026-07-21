from types import SimpleNamespace

from app.services.compliance_service import AI_UNAVAILABLE_MESSAGE, ComplianceService
from app.services.gemini_client import GeminiClientError


class DummyRAGService:
    def __init__(self, answer: str) -> None:
        self.answer = answer

    def retrieve_context(self, query: str, *, top_k: int) -> SimpleNamespace:
        assert top_k == 16
        return SimpleNamespace(results=[SimpleNamespace(text="Documented PPE inspections")])

    def generate_from_context(self, query: str, search_results: list[object]) -> str:
        return self.answer


def test_compliance_analysis_parses_expected_model_payload() -> None:
    payload = ComplianceService(rag_service=DummyRAGService('''
        {"overall":94,"standards":[
          {"name":"ISO 55000","score":96,"status":"Compliant","reason":"Maintenance is documented."},
          {"name":"IEC 61511","score":91,"status":"Mostly Compliant","reason":"Shutdown procedures are documented."},
          {"name":"OSHA 1910","score":84,"status":"Needs Review","reason":"PPE is partially documented."},
          {"name":"ATEX 2014/34/EU","score":76,"status":"Needs Review","reason":"Explosion controls are limited."}
        ]}
    ''')).analyze_compliance()

    assert payload["overall"] == 94
    assert [item["name"] for item in payload["standards"]] == [
        "ISO 55000", "IEC 61511", "OSHA 1910", "ATEX 2014/34/EU"
    ]


def test_compliance_analysis_returns_required_fallback_for_gemini_failure() -> None:
    class UnavailableRAGService(DummyRAGService):
        def generate_from_context(self, query: str, search_results: list[object]) -> str:
            raise GeminiClientError("503 UNAVAILABLE")

    payload = ComplianceService(rag_service=UnavailableRAGService("")).analyze_compliance()

    assert payload == {"overall": 0, "standards": [], "message": AI_UNAVAILABLE_MESSAGE}
