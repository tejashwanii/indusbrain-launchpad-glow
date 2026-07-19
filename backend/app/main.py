from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.uploads import router as uploads_router
from app.api.chat import router as chat_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger, install_exception_hooks

configure_logging()
install_exception_hooks()
logger = get_logger("indusbrain.api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("application_startup")
    try:
        yield
    except Exception:
        logger.exception("uncaught_lifespan_exception")
        raise
    finally:
        logger.info("application_shutdown")


app = FastAPI(
    title="IndusBrain API",
    version="0.1.0",
    lifespan=lifespan,
    servers=[
        {
            "url": f"http://{settings.HOST}:{settings.PORT}",
            "description": "Configured local server",
        }
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        f"http://{settings.HOST}:3000",
        f"http://{settings.HOST}:5173",
        f"http://{settings.HOST}:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(uploads_router)
app.include_router(chat_router)


@app.middleware("http")
async def log_requests(request, call_next):
    started_at = perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "uncaught_request_exception",
            extra={
                "method": request.method,
                "path": request.url.path,
                "duration_ms": round((perf_counter() - started_at) * 1000, 2),
            },
        )
        raise

    logger.info(
        "request_completed",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round((perf_counter() - started_at) * 1000, 2),
        },
    )
    return response


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
