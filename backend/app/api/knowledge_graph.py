import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["Knowledge Graph"])


@router.get("/knowledge-graph/{document_id}")
async def get_knowledge_graph(document_id: str):
    graph_file = Path("graphs") / f"{document_id}.json"

    if not graph_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Knowledge graph not found.",
        )

    with graph_file.open("r", encoding="utf-8") as f:
        return json.load(f)