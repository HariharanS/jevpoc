# Product contract

**Status: current.** Implementation status lives in ../STATUS.md. The product is a Live Intent Workspace, not primarily a chatbot, trace viewer or universal generated-UI framework.

## Outcome

Natural text, and later continuous voice, becomes useful typed cards. A correction patches the existing item. Incomplete items stay visible without guessed values. A user can inspect how one card was understood; an engineer can reveal the actual execution trace in the same session.

The application/harness orchestrates. JEV supplies bounded judgments. Application code owns IDs, versions, validation, policy and writes. An LLM handles genuinely open-ended synthesis or explicitly measured extraction, not routine question-template selection.

## Golden story

| Input | Expected behavior |
|---|---|
| Today I drank 200 ml Coke | Create a provisional hydration item with evidence-backed amount/drink. |
| Ah no, I mean water | Patch the same item; retain 200 ml and correction history. |
| Pick up my Australia Post parcel at 2pm | Capture a task, place and local time; do not invent a calendar date. |
| Remind me to take my medicine | Create an incomplete reminder; no inferred medication, dose or time. |
| My dream car arrived; I am happy | Create a journal item retaining the stated fact/feeling. |
| But I am sad about letting my old car go | Continue that journal item; sadness does not erase happiness. |

Four final cards, not six. The paragraph and chunked forms must have equivalent meaningful final fields. Source fixtures use logical event aliases, not prescribed production UUIDs. The explicit word Today may be resolved with the fixture clock and session timezone; a task merely saying 2pm cannot acquire a date by association.

A captured task is not a scheduled alert. M1 says Captured, Updated, Draft or Needs a time/date. It never promises to remind, send or execute. The medicine example is a capture example, not medical advice.

## Experience

Input and cards are primary. The input visual contracts as state accumulates. Text remains fully usable. Transcript is compact and optional. A selected-card explanation presents evidence, changes and missing fields. Developer processing/timeline is a deeper disclosure, not another product or a compulsory dashboard.

Cards keep stable IDs, order and focus during streaming. Missing information does not repeatedly interrupt a continuous utterance. Explicit form edits use deterministic validation rather than another semantic model call. Follow [UI.md](UI.md).

## Scope

M0–1: local workspace; schemas; immutable evidence; scripted interpretation/fake decisions; ordered atomic mutations; typed cards; current-state API; live/replay inspection; cancellation and local restart behavior.

Not M0–1: general natural-language extraction; real TypeSafe/LLM/STT/TTS; external tools; approval roles; long-term memory; native speech-to-speech; payment journey compiler; production auth or hosting.

Five card types suffice: hydration, task, reminder, journal, generic. Unknown text is explicitly unsupported in fake mode. Do not force every question into a card taxonomy. A generic quote is not a successful execution or invented summary.

Local modular monolith first: React/Vite, Fastify, TypeScript core, SQLite. Provider adapters remain small. No event bus, vector database, universal harness, plugin marketplace, mandatory CopilotKit or arbitrary model-generated executable UI.
