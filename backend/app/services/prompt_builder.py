from __future__ import annotations

from dataclasses import dataclass

from app.services.semantic_search_service import SearchResult


@dataclass(slots=True)
class PromptBuilder:
    """
    Builds prompts for Retrieval-Augmented Generation (RAG).

    Combines the user's query with retrieved document chunks
    into a structured prompt for the LLM.
    """

    system_instruction: str = (
        "You are an AI assistant for industrial documentation.\n"
        "Answer ONLY using the provided context.\n"
        "If the answer is not present in the context, respond with:\n"
        "\"I don't have enough information from the provided documents.\"\n"
        "Do not make up information."
    )

    def build_prompt(
        self,
        query: str,
        search_results: list[SearchResult],
    ) -> str:
        """
        Build the final prompt sent to the language model.

        Args:
            query: User question.
            search_results: Relevant chunks retrieved from the vector database.

        Returns:
            Formatted prompt string.
        """

        if not query.strip():
            raise ValueError("Query cannot be empty.")

        if not search_results:
            context = "No relevant context was found."
        else:
            context = "\n\n".join(
                f"[Chunk ID: {result.chunk_id}]\n{result.text}"
                for result in search_results
            )

        prompt = (
            f"{self.system_instruction}\n\n"
            f"Context:\n"
            f"{'-' * 60}\n"
            f"{context}\n"
            f"{'-' * 60}\n\n"
            f"Question:\n"
            f"{query}\n\n"
            f"Answer:"
        )

        return prompt