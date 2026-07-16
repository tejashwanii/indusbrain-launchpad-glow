"""Structured logging configuration shared by the application."""

import json
import logging
import sys
import threading
from datetime import datetime, timezone
from typing import Any


_exception_hooks_installed = False


class JsonFormatter(logging.Formatter):
    """Serialize log records as one JSON object per line."""

    _standard_attributes = frozenset(logging.makeLogRecord({}).__dict__)

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        payload.update(
            {
                key: value
                for key, value in record.__dict__.items()
                if key not in self._standard_attributes and not key.startswith("_")
            }
        )
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    """Configure application logging once, without changing existing handlers."""

    root_logger = logging.getLogger()
    if any(getattr(handler, "_indusbrain_structured", False) for handler in root_logger.handlers):
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    handler._indusbrain_structured = True  # type: ignore[attr-defined]
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def install_exception_hooks() -> None:
    """Log process- and thread-level uncaught exceptions before delegating to defaults."""

    global _exception_hooks_installed
    if _exception_hooks_installed:
        return

    logger = get_logger("indusbrain.exceptions")
    previous_excepthook = sys.excepthook
    previous_threading_excepthook = threading.excepthook

    def log_uncaught_exception(
        exc_type: type[BaseException],
        exc_value: BaseException,
        traceback: Any,
    ) -> None:
        logger.critical(
            "uncaught_exception",
            exc_info=(exc_type, exc_value, traceback),
        )
        previous_excepthook(exc_type, exc_value, traceback)

    def log_uncaught_thread_exception(args: threading.ExceptHookArgs) -> None:
        logger.critical(
            "uncaught_thread_exception",
            extra={"thread_name": args.thread.name if args.thread else None},
            exc_info=(args.exc_type, args.exc_value, args.exc_traceback),
        )
        previous_threading_excepthook(args)

    sys.excepthook = log_uncaught_exception
    threading.excepthook = log_uncaught_thread_exception
    _exception_hooks_installed = True
