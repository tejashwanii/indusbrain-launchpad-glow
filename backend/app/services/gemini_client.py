"""Reusable Gemini API client for backend services."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

try:
    from google import genai
except ImportError:  # pragma: no cover - handled at runtime
    genai = None

from app.core.config import settings


class GeminiClientError(Exception):
    """Base exception for Gemini client failures."""


class EmptyPromptError(GeminiClientError, ValueError):
    """Raised when the prompt is empty or whitespace-only."""


class GeminiClient:
    """Thin wrapper around the Google Gemini API with cached model initialization."""

    def __init__(self, *, api_key: str | None = None, model_name: str | None = None) -> None:
        """Initialize the Gemini client.

        Args:
            api_key: Optional API key override. Defaults to the configured environment value.
            model_name: Gemini model identifier to use for generation.
        """

        self._api_key = api_key or settings.GEMINI_API_KEY
        if not self._api_key:
            raise GeminiClientError("GEMINI_API_KEY is not configured.")
        self._model_name = model_name or settings.GEMINI_MODEL

    def generate_response(self, prompt: str) -> str:
        """Send a prompt to Gemini and return only the generated text.

        Args:
            prompt: The user prompt to send to the model.

        Returns:
            The generated response text.

        Raises:
            EmptyPromptError: The prompt is empty or whitespace-only.
            GeminiClientError: The client cannot initialize or generate a response.
        """

        _validate_prompt(prompt)

        try:
            client = self._get_model()
            response = client.models.generate_content(model=self._model_name, contents=prompt)
        except EmptyPromptError:
            raise
        except Exception as error:
            raise GeminiClientError(f"Unable to generate a Gemini response: {error}") from error

        if hasattr(response, "text") and isinstance(response.text, str):
            return response.text

        raise GeminiClientError("Gemini returned an invalid response payload.")

    @lru_cache(maxsize=1)
    def _get_model(self) -> Any:
        """Create and cache the Gemini client instance."""

        if not self._api_key:
            raise GeminiClientError("GEMINI_API_KEY is not configured.")

        if genai is None:
            raise GeminiClientError("The google-genai package is not installed.")

        try:
            return genai.Client(api_key=self._api_key)
        except Exception as error:
            raise GeminiClientError(f"Unable to initialize the Gemini client: {error}") from error


def _validate_prompt(prompt: str) -> None:
    """Ensure the prompt is a non-empty string."""

    if not isinstance(prompt, str) or not prompt.strip():
        raise EmptyPromptError("prompt must be a non-empty string.")
