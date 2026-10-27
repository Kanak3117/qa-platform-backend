# AI bug triage and evaluation

## What the AI module does

The module provides advisory bug triage with `gpt-4.1-mini` by default, validates the provider's structured response, and ranks likely duplicates with local TF-IDF cosine similarity. The model only receives the reported title and description. Candidate bug text is matched locally and is not sent to the provider. AI output never changes a bug's core title, category, severity, priority, or status automatically.

The bug creation and bug details screens can request live suggestions through the project-scoped `/ai/analyze` endpoint. A QA engineer must choose whether to apply the returned fields. In the current frontend prototype, created bugs and applied suggestions remain in the in-memory demo store and are lost on refresh; the AI routes themselves use persisted project bug records for duplicate candidates. The persisted analysis endpoint below can save suggestions for a database-backed bug without changing that bug's fields.

The project database already defines `Bug` and `BugAIAnalysis` models. AI routes query the `bugs` table by the authenticated project ID and ignore soft-deleted records. Candidate search is capped at the newest 500 project bugs. `POST /api/projects/{project_id}/ai/bugs/{bug_id}/analyze` also saves the advisory suggestions to the bug's `BugAIAnalysis` row, creating or updating the one-to-one record; it does not overwrite the bug itself.

## Configuration

Set `OPENAI_API_KEY` in `.env`. The default model is `gpt-4.1-mini`; override it with `OPENAI_MODEL`. `OPENAI_BASE_URL` is optional for an OpenAI-compatible provider. Keep provider keys out of source control and restart FastAPI after changing environment values.

## API routes

### Analyze a new report against this project's bug database

`POST /api/projects/{project_id}/ai/analyze` requires an authenticated project member. The API loads candidates from the current project; it does not accept candidate bugs from the caller.

```json
{
  "title": "Checkout payment failure",
  "description": "The card is charged but checkout reports that the transaction failed."
}
```

The response contains a suggested title, category, severity, priority, rationale, and up to five duplicate suggestions with similarity scores. It sets `requires_qa_review: true`.

### Save AI suggestions for an existing bug

`POST /api/projects/{project_id}/ai/bugs/{bug_id}/analyze` requires an authenticated member of the project. The bug is looked up by both `bug_id` and `project_id`; deleted or cross-project bugs return 404. The endpoint excludes the source bug from duplicate candidates, then upserts the result into `bug_ai_analyses`. It does not mutate the bug record.

### Evaluate live model output

`POST /api/projects/{project_id}/ai/evaluate` requires the project `QA_ENGINEER` role or system `ADMIN`. Submit 1–10 human-labeled cases. The endpoint uses only non-deleted bug candidates from the authenticated project and excludes each case's `source_bug_code` from its own candidate list. It returns per-case results and denominators for provider success, category accuracy, severity accuracy, priority accuracy, exact severity/priority pair accuracy, title acceptance, and duplicate precision@5/recall@5. Evaluation responses are not persisted.

Set `duplicate_labels_complete` to `true` only after a QA reviewer has labeled both positive and negative duplicate cases. When duplicate labels are incomplete, duplicate metrics are returned as `null`; the API will not report an invented zero score. `expected_duplicate_ids` must identify existing bug codes in the same project.

Use `docs/ai_evaluation_sample.json` as an initial request body after the sample records are seeded. Its 10 cases come from the supplied sample file. The UI defines P1 (immediate), P2 (high), P3 (medium), and P4 (low), so the request fixture maps source priority words `Critical`, `High`, `Medium`, and `Low` to `P1`, `P2`, `P3`, and `P4`. Severity and priority are scored independently; there is no forced one-to-one mapping. The supplied records have no reviewed duplicate relationships, so duplicate metrics remain null.

Example request after obtaining a project QA token:

```sh
curl -X POST "http://127.0.0.1:8000/api/projects/PROJECT_UUID/ai/evaluate" \
  -H "Authorization: Bearer QA_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @docs/ai_evaluation_sample.json
```

### Seed the sample bug records into a test project

The repository has the database model and migration, but does not yet include bug CRUD routes. For local/demo evaluation only, `scripts/seed_ai_eval_bugs.py` imports the sample CSV directly into a specified project and reporter. Apply database migrations first, then run:

```sh
python scripts/seed_ai_eval_bugs.py --project-id PROJECT_UUID --reporter-id ACTIVE_USER_UUID --dry-run
python scripts/seed_ai_eval_bugs.py --project-id PROJECT_UUID --reporter-id ACTIVE_USER_UUID
```

The importer maps the supplied priority words to P1–P4, skips bug codes already present in the same project, and refuses a bug code owned by another project. Use a disposable development/test project; this sample is for smoke checks, not production data. The seed records are not a representative accuracy benchmark.

## Testing and evaluation protocol

Run the offline test suite with:

```sh
python -m unittest discover -s tests -v
```

Tests mock provider responses and cover structured response validation, provider errors, project-scoped candidate loading, persistence of advisory analysis, duplicate ranking, and evaluation metrics. CI runs the suite on pull requests.

For a live check, configure the provider key, migrate the database, seed a test project, and use a QA Engineer token. Check successful analysis, empty candidate handling, invalid input (422), unauthenticated access (401), non-member access (403), missing configuration (503), and provider failures (502). Do not include keys or bearer tokens in logs or screenshots.

For a meaningful accuracy report, use QA-reviewed held-out cases, freeze model/prompt versions for the run, review every mismatch, and report sample size with the metrics. The ten supplied rows are only an initial smoke dataset. They have no duplicate ground truth, so they cannot measure duplicate precision or recall. The supplied titles are treated as accepted title labels in the sample request; have QA confirm them before publishing title acceptance results.

## Limitations

LLM output can be wrong or inconsistent. TF-IDF is lexical and can miss paraphrases or over-rank keyword overlap. Duplicate quality depends on project candidate coverage and reviewed labels. The bug report title and description are sent to the configured provider. Keep a human reviewer in the loop and do not auto-close or merge bugs based on AI output.
