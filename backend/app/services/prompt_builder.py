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
        "You are an expert assistant for industrial maintenance manuals.\n\n"
        "Your job is to answer the user's question using the provided document excerpts.\n\n"
        "The user's wording may not exactly match the wording in the document.\n"
        "Infer the user's intent whenever reasonable.\n"
        "If the document contains information that answers the user's question using different wording, use it.\n"
        "Combine information from multiple excerpts when necessary.\n"
        "Do not invent information that is not supported by the context.\n"
        "Only say 'I don't have enough information from the provided documents.' "
        "when the context genuinely does not answer the user's question."
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
                f"Document Excerpt {i + 1}:\n{result.text}"
                for i, result in enumerate(search_results)
            )

        prompt = (
            f"{self.system_instruction}\n\n"
            f"You have been given excerpts from an industrial maintenance manual.\n\n"
            f"================ DOCUMENT =================\n\n"
            f"{context}\n\n"
            f"===========================================\n\n"
            f"User Question:\n"
            f"{query}\n\n"
            f"Answer:"
        )

        return prompt