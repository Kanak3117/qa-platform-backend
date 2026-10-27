# Dailoqa QA Platform

Dailoqa is a QA platform prototype with a FastAPI and PostgreSQL backend and a React/TypeScript frontend. The backend includes authentication, project membership and roles, QA data models and migrations, and AI-assisted bug triage.

## Member 4: AI bug triage

The AI service uses `gpt-4.1-mini` by default (configurable with `OPENAI_MODEL`) to suggest a concise title, category, severity, priority, and rationale. It validates structured model output and returns provider errors as API responses. Suggestions are advisory and require QA review.

Duplicate suggestions use local TF-IDF cosine similarity against up to 500 newest, non-deleted bugs from the authorized project. Candidate bug descriptions are not sent to the model. The frontend's bug creation and bug details screens can request live analysis from the backend when signed in with a configured API and project. Applying suggestions in the current frontend updates its in-memory demo state.

See [`docs/AI_MODULE.md`](docs/AI_MODULE.md) for endpoints, evaluation, seed data, verification steps, and limitations.

## Stack

- Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16
- React 18, TypeScript (strict mode), Vite, Tailwind CSS
- OpenAI Chat Completions API with structured JSON output

## Run the backend and database

1. Copy `.env.example` to `.env` and set `POSTGRES_PASSWORD` and a private random `SECRET_KEY`. Set `OPENAI_API_KEY` to enable live AI analysis. Never commit `.env` or expose API keys.
2. Start the database and API. The API container applies Alembic migrations before starting:

   ```sh
   docker compose up --build
   ```

3. Open the API documentation at <http://localhost:8000/docs>.

For local Python development without Docker, install dependencies with `python -m pip install -r requirements.txt`, configure `DATABASE_URL` in `.env`, run `alembic upgrade head`, then start `uvicorn app.main:app --reload`.

## Run the frontend

In another terminal:

```sh
cd frontend
cp .env.example .env
npm ci
npm run dev
```

The example frontend API URL is `http://localhost:8000`. Sign in with a backend user who belongs to an active project to use live AI analysis. A configured provider key is required. The other bug, suite, case, run, and execution workflows still use in-memory demo data; refreshing the page resets those demo changes.

## AI endpoints

All routes require an authenticated project member unless noted. Replace `PROJECT_UUID` with an active project ID and send a bearer access token.

- `POST /api/projects/{project_id}/ai/analyze` analyzes a report and compares it with project bug records.
- `POST /api/projects/{project_id}/ai/bugs/{bug_id}/analyze` analyzes and saves advisory fields in `bug_ai_analyses` without changing the bug itself.
- `POST /api/projects/{project_id}/ai/evaluate` runs a QA-engineer-labeled evaluation against project bug records.

The sample evaluation dataset has ten cases and is intended for an initial smoke check, not as a statistically representative accuracy benchmark. Duplicate metrics require reviewed duplicate labels. See [`docs/AI_MODULE.md`](docs/AI_MODULE.md) before reporting accuracy.

## Verification

Backend tests:

```sh
python -m unittest discover -s tests -v
```

Frontend type-check and production build:

```sh
cd frontend
npm ci
npm run build
```

GitHub Actions runs both checks on pull requests.
