from app.services.chunking_service import DocumentChunk
from app.services.chroma_service import ChromaDocumentStore
from app.services.embedding_service import ChunkEmbedding


class DummyCollection:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    def upsert(self, *, ids, embeddings, documents, metadatas) -> None:
        self.calls.append(
            {
                "ids": ids,
                "embeddings": embeddings,
                "documents": documents,
                "metadatas": metadatas,
            }
        )


class DummyClient:
    def __init__(self) -> None:
        self.collection = DummyCollection()
        self.collection_name: str | None = None

    def get_or_create_collection(self, name: str):
        self.collection_name = name
        return self.collection


def test_store_embeddings_persists_document_and_chunk_metadata() -> None:
    client = DummyClient()
    store = ChromaDocumentStore(
        client_factory=lambda: client,
        collection_name="indusbrain-test",
    )

    embeddings = [
        ChunkEmbedding(
            chunk_id="chunk-1",
            chunk_index=0,
            text="Example chunk text",
            embedding=[0.1, 0.2, 0.3],
        )
    ]

    result = store.store_embeddings("document-123", embeddings)

    assert result.stored_count == 1
    assert result.collection_name == "indusbrain-test"
    assert client.collection_name == "indusbrain-test"
    assert client.collection.calls[0]["ids"] == ["document-123:chunk-1"]
    assert client.collection.calls[0]["documents"] == ["Example chunk text"]
    assert client.collection.calls[0]["metadatas"] == [
        {
            "document_id": "document-123",
            "chunk_id": "chunk-1",
            "chunk_index": 0,
        }
    ]
