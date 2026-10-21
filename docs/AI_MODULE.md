# AI bug triage and live evaluation

## Bug triage workflow

1. A QA engineer submits a report and project ID.
2. The authenticated API checks project membership.
3. The backend asks the configured LLM for a title, category, severity, priority, and rationale.
4. A local TF-IDF cosine matcher compares the report with candidate bugs supplied by the caller and returns up to five possible matches.
5. The QA engineer reviews the suggestions. AI never creates, changes, closes, or merges a bug.

Severity and priority are returned as a consistent pair: Critical/P0, High/P1, Medium/P2, or Low/P3. The model must use only impact supported by the report; uncertain cases should default to Medium/P2 with an explanation.

## Configuration

Set OPENAI_API_KEY in the local .env file. The default model is gpt-4.1-mini; set OPENAI_MODEL to override it. OPENAI_BASE_URL is optional for an OpenAI-compatible provider. Keep API keys out of source control and restart FastAPI after changing environment settings.

## Triage API

POST /api/projects/{project_id}/ai/analyze requires a Bearer token and membership in that project. Example body:

    {
      "title": "Checkout payment failure",
      "description": "The card is charged but checkout reports that the transaction failed.",
      "existing_bugs": [
        {
          "id": "BUG-12",
          "title": "Charge succeeds but checkout fails",
          "description": "Card is charged and no order is created."
        }
      ]
    }

The response contains suggestions, duplicate IDs/titles and similarity scores, duplicate_method, and requires_qa_review=true. Existing candidates are optional (maximum 500). The endpoint returns 503 when the API key is missing, 502 for provider/network/format failures, and normal FastAPI 422 responses for invalid input.

## Live labeled evaluation API

POST /api/projects/{project_id}/ai/evaluate runs the configured live model against a small QA-labeled dataset. It requires a project QA_ENGINEER or system ADMIN token. Each request is capped at 10 cases to bound cost and runtime. The endpoint calls the live provider once per case and returns per-case predictions, provider error codes, and aggregate metrics. Evaluation runs are not persisted; save the response as test evidence if needed. Provider errors are counted; the local duplicate matcher can still be scored if a provider call fails.

The repository currently has no Bug model, bug list endpoint, or persisted bug database. existing_bugs in each evaluation case is therefore a supplied test fixture, not a database query. The included docs/ai_evaluation_sample.json is a tiny synthetic mock dataset for wiring and smoke checks. It is not representative enough to claim model accuracy. When bug management is integrated, candidate bugs must be loaded server-side and filtered by project ID and authenticated user.

The request requires expected_category, expected_severity, expected_priority, one or more QA-approved accepted_titles, and expected_duplicate_ids. Expected severity and priority must follow the same mapping as the prompt. Expected duplicate IDs must exist in that case's candidate list. Approved titles are compared case-insensitively after whitespace normalization; punctuation and wording otherwise need to match an approved title.

Example call after loading the sample JSON and setting a QA bearer token:

    curl -X POST "http://127.0.0.1:8000/api/projects/PROJECT_UUID/ai/evaluate" \
      -H "Authorization: Bearer $QA_TOKEN" \
      -H "Content-Type: application/json" \
      --data-binary @docs/ai_evaluation_sample.json

The response includes the ranked duplicate suggestions for every case, even if its LLM call failed. Rates are returned as fractions from 0.0 to 1.0; multiply by 100 to display percentages. The response reports:
- provider success rate and denominator;
- category, severity, priority, and combined severity/priority exact match;
- title acceptance against the approved alternatives;
- duplicate precision@5 (relevant candidates in the first five divided by five, averaged over cases with candidates);
- duplicate recall@5 (expected relevant IDs found in the first five, averaged over cases with at least one expected duplicate).

Cases with no candidate bugs are excluded from duplicate precision; cases with no expected duplicate are excluded from duplicate recall. The API returns denominators so rates are not shown without sample size. These metrics describe only the submitted labeled sample. They do not establish general accuracy. Define minimum sample size and acceptance thresholds with the mentor before presenting results.

## Testing

Run offline regression tests:

    python -m unittest discover -s tests -v

The suite mocks provider responses and covers response validation, missing configuration, provider failures, title normalization, severity/priority consistency, duplicate matching, and evaluation metric aggregation. GitHub Actions runs this suite on pull requests and pushes to main.

For live verification, configure the key and database, start FastAPI, create a project, and add a QA_ENGINEER member. Open /docs, authorize with that member's token, submit the example evaluation request, and inspect every per-case result and denominator. Do not put a real API key or bearer token in screenshots or reports.

## Limitations

LLM suggestions can be wrong, overstate impact, or vary across reports. TF-IDF is lexical: it can miss paraphrases and may mistake keyword overlap for a match. Results depend on report quality, candidate coverage, provider availability, and API usage. New bug title and description are sent to the configured AI provider; candidate bug texts are compared locally. Keep human review in the workflow and never automate bug closure or merging based only on this response.
