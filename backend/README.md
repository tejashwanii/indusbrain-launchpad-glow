# IndusBrain backend

FastAPI backend scaffold for the IndusBrain application. It currently exposes only a health check and contains no business logic.

## Requirements

- Python 3.12

## Run locally

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The health endpoint is available at `http://127.0.0.1:8000/health` and returns:

```json
{"status":"ok"}
```

Local CORS is configured for the standard Vite and common frontend development ports on `localhost` and `127.0.0.1`.

## Configuration

Copy `.env.example` to `.env` before adding local configuration. Settings are loaded with `pydantic-settings` and are available throughout the application as `app.core.config.settings`.
