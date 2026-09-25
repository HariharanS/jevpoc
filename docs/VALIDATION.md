# Validation evidence

Date: 25 September 2026. Scope: repository contracts and explicitly scripted prototypes. No production application or live-provider benchmark was run.

## Executed locally

Environment: Node 22.16.0; TypeScript 5.8.3; Python 3.13; jsonschema 4.26.0; system Chromium 144.0.7559.96. These describe the test environment, not a recommendation to deploy an old runtime patch.

| Command/check | Observed result |
|---|---|
| `node --test prototypes/runtime/model.test.mjs` | 16 tests passed, zero failed. In-memory behavior only. |
| `python scripts/validate_repo.py --contracts-only --require-tsc` | Valid schema; 8 synthetic scenarios, 16 requests, 13 expected events; 31 exact UTF-16 spans; paragraph/chunk final-field equivalence. |
| Negative contract cases | 14 malformed structural/answer-relationship cases rejected; fractional Score accepted. Not a live SDK test. |
| Generated types + strict compilation | Generator equality and TypeScript noEmit passed. |
| Actual E02 output validation | Six emitted snapshots / 15 intermediate event payloads and six mutation batches match canonical schema. |
| `python scripts/browser_smoke.py --inline` | Passed 1440/768/360px replay, stable card DOM identity, selected evidence, keyboard focus return, stale rejection, reset while pending, reduced-motion styling, no horizontal overflow or page errors. |
| HTTP server safety checks | Unlisted paths including .env/traversal rejected with 404; foreign Host rejected with 403. |

The default served-browser smoke attempt was blocked by this execution environment's Chromium administrator network policy. The successful inline mode loads the same local HTML/CSS and controlled script/fixture content into the DOM, but does not prove browser HTTP import loading or CSP. The HTTP server itself was tested separately. This is a smoke check, not a comprehensive accessibility, cross-browser or performance audit.

## Repository automation

[../.github/workflows/verify.yml](../.github/workflows/verify.yml) runs the full repository validator and Node tests on pull requests and pushes to main. It checks generated types, task/acceptance references, dependency cycles, local Markdown targets and reintroduced retired paths. Results for a specific commit belong to its GitHub Actions run, not a permanent promise in this file.

Reproduce full checks:

```bash
python -m pip install -r requirements.txt
python scripts/validate_repo.py --require-tsc
node --test prototypes/runtime/model.test.mjs
```

TypeScript 5.8.3 is the pinned contract-check compiler in CI. The application package lock/runtime is a B00 deliverable. The browser test is optional and separately documented under prototypes/README.md.

## Explicitly unproven

Real language understanding/extraction, JEV/LLM accuracy or cost superiority, STT/TTS, microphone capture, actual concurrent persistence, SQLite atomicity, HTTP run APIs, SSE gap-free replay, restart recovery, external exactly-once execution, auth/tenant isolation, notifications, memory, cloud hosting and user approval of final pixel styling.

The 30 application acceptance cases remain specifications. Passing these repository/prototype checks must not mark M0–1 application tasks done.
