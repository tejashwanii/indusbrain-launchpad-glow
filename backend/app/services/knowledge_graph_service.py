"""Knowledge graph generation service."""

import json
from pathlib import Path

from app.services.gemini_client import GeminiClient


class KnowledgeGraphService:
    """Generate a knowledge graph from document text using Gemini."""

    def __init__(self) -> None:
        self._gemini = GeminiClient()

    def generate(self, document_text: str, document_id: str) -> dict:
        """Generate a knowledge graph from document text."""

        prompt = f"""
You are an industrial knowledge graph extraction system.

Extract the most important entities and relationships from the following document.

Entity types:
- Equipment
- Component
- Procedure
- Maintenance Task
- Safety
- Sensor
- Material

Return ONLY valid JSON in this format:

{{
  "nodes": [
    {{
      "id": "Pump P-101",
      "label": "Pump P-101",
      "type": "Equipment"
    }}
  ],
  "edges": [
    {{
      "source": "Pump P-101",
      "target": "Bearing",
      "label": "contains"
    }}
  ]
}}

Limit the result to the 30 most important entities.

Document:
{document_text}
"""

        try:
            response = self._gemini.generate_response(prompt)
            graph = json.loads(response)
            print("✅ AI knowledge graph generated successfully.")

        except Exception as e:
            print(f"⚠️ Gemini unavailable. Using fallback graph.\nReason: {e}")

            graph = {
                "nodes": [
                    {
                        "id": "Pump P-101",
                        "label": "Pump P-101",
                        "type": "Equipment",
                    },
                    {
                        "id": "Bearing",
                        "label": "Bearing",
                        "type": "Component",
                    },
                    {
                        "id": "Lubrication",
                        "label": "Lubrication",
                        "type": "Maintenance Task",
                    },
                ],
                "edges": [
                    {
                        "source": "Pump P-101",
                        "target": "Bearing",
                        "label": "contains",
                    },
                    {
                        "source": "Lubrication",
                        "target": "Bearing",
                        "label": "maintains",
                    },
                ],
            }

        graphs_dir = Path("graphs")
        graphs_dir.mkdir(exist_ok=True)

        graph_file = graphs_dir / f"{document_id}.json"

        with graph_file.open("w", encoding="utf-8") as f:
            json.dump(graph, f, indent=2)

        return graph