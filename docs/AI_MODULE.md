# AI bug triage

## Workflow

1. A QA engineer submits a report and project ID.
2. The authenticated API checks project membership.
3. The backend asks the configured LLM for a title, category, severity, priority, and rationale.
4. A local TF-IDF cosine matcher compares the report with candidate bugs supplied by the caller and returns up to five possible matches.
5. The QA engineer reviews the suggestions. AI never creates, changes, closes, or merges a bug.

Severity and priority are returned as a consistent pair: Critical/P0, High/P1, Medium/P2, or Low/P3. The model must use only impact supported by the report; uncertain cases should default to Medium/P2 with an explanation.

## Configuration

Set OPENAI_API_KEY in the local .env file. The default model is gpt-4.1-mini; set OPENAI_MODEL to override it. OPENAI_BASE_URL is optional for an OpenAI-compatible provider. Keep API keys out of source control and restart FastAPI after changing environment settings.

## API

POST /api/projects/{project_id}/ai/analyze requires a Bearer token with membership in that project. Example JSON body:

{
  "title": "Checkout payment failure",
  "description": "The card is charged but checkout reports that the transaction failed.",
  "existing_bugs": [
    {"id": "BUG-12", "title": "Charge succeeds but checkout fails", "description": "Card is charged and no order is created."}
  ]
}

The response contains suggestions, duplicate IDs/titles and similarity scores, duplicate_method, and requires_qa_review=true. Existing candidates are optional (maximum 500). The endpoint returns 503 when the API key is missing, 502 for provider/network/format failures, and normal FastAPI 422 responses for invalid input.

This repository does not yet include a bug model or list endpoint, so the caller currently supplies candidate bugs. When bug management is integrated, fetch candidates server-side filtered by project ID and authenticated user instead of trusting arbitrary client-provided bug lists.

## Testing and evaluation

Run the complete offline regression suite with:

    python -m unittest discover -s tests -v

The tests mock provider responses and cover response validation, missing configuration, provider failures, title normalization, severity/priority consistency, and duplicate matching. A GitHub Actions workflow runs this suite on pull requests and pushes to main.

For live verification, set OPENAI_API_KEY and exercise the endpoint in /docs with an authenticated project member. Verify successful analysis, 422 validation, 401/403 access control, 503 missing configuration, and 502 provider failure. Do not put a real API key in screenshots or reports.

For model evaluation, use QA-labeled reports held out from prompt development. Track category accuracy, severity/priority exact match, human title acceptance, duplicate precision@5 and recall@5, provider failure rate, and sample size. Review incorrect cases; a small demo set does not establish general accuracy.

## Limitations

LLM suggestions can be wrong, overstate impact, or vary across reports. TF-IDF is lexical: it can miss paraphrases and may mistake keyword overlap for a match. Results depend on report quality, candidate coverage, provider availability, and API usage. Bug text is sent to the configured AI provider. Keep human review in the workflow and never automate bug closure or merging based only on this response.
