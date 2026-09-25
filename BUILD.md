# BUILD.md — first coding-agent handoff

This file is the shortest path from "read the repo" to "start building."

## Your assignment

Implement **Milestones 0 and 1 only** from docs/07-implementation-plan.md.

Do not implement real Jev, a real LLM, or real microphone/STT yet.

The outcome must be a locally runnable **Live Intent Workspace** using deterministic fixtures and FakeDecisionEngine.

## Read before coding

Mandatory:

1. AGENTS.md
2. docs/README.md
3. docs/18-runtime-contracts.md
4. docs/19-first-demo-and-evaluation.md
5. docs/20-ui-ux-design.md
6. docs/02-technical-design.md
7. docs/12-semantic-state-and-ui-runtime.md
8. docs/04-observability.md
9. tests/evals/README.md
10. tests/evals/voice-semantic-update.jsonl
11. tests/evals/pre-turn-routing.jsonl

Do not restart framework/provider research. It is not needed for this slice.

## User-visible result

Run the app locally.

The Lab view should show:

~~~text
Input Stream
  -> simulated incremental transcript

Processing / Control
  -> checkpoint
  -> fake Jev typed answers
  -> policy decision

Intent Canvas
  -> cards create/update

Inspector
  -> live ordered trace
~~~

Replay:

~~~text
today I drank 200 ml Coke
ah no I mean water
pick up my parcel at 2 pm
remind me to take my medicine
~~~

Expected visible result:

~~~text
Hydration
  200 ml Water
  same event ID patched from Coke

Task
  Pick up parcel
  2:00 PM

Reminder
  Take medicine
  DRAFT / needs time
~~~

## Required project setup

~~~text
pnpm workspace
Node 22+
TypeScript
React + Vite
Fastify
Zod
node:sqlite
Vitest
Biome
OpenTelemetry package scaffolding
~~~

Do not add:

- ORM;
- LangGraph;
- MAF;
- Copilot SDK;
- queue/event bus;
- vector DB;
- CopilotKit;
- cloud resources.

## Required API behavior

Create run:

~~~http
POST /api/sessions/:sessionId/runs
~~~

Return immediately:

~~~json
{
  "traceId": "tr_...",
  "status": "running"
}
~~~

Live events:

~~~http
GET /api/traces/:traceId/events
~~~

SSE.

Session:

~~~http
GET /api/sessions/:sessionId
~~~

Trace replay:

~~~http
GET /api/traces/:traceId
~~~

## Required trace architecture

~~~text
TraceRecorder
  -> SQLite trace_events
  -> in-process TraceBus -> SSE
  -> optional OTel mirror
  -> stdout debug
~~~

SQLite is replay source of truth.

## FakeDecisionEngine

The fake must return the same typed answer shapes as real TypeSafe/Jev:

- NoulDecisionAnswer;
- ChoiceDecisionAnswer;
- ScoreDecisionAnswer.

Do not make a special fake-only contract.

It may use fixture/rule matching for this milestone.

## Required semantic mutations

Implement only:

- CREATE;
- PATCH;
- WAIT;
- SEAL if useful.

MERGE/CLOSE/CANCEL can exist as types but do not need full UI behavior unless trivial.

Corrections must preserve SemanticEvent.id.

## UI

Follow docs/20-ui-ux-design.md and docs/ui/lab-layout.svg.

Minimum:

- desktop 3-column Lab shell;
- placeholder animated voice orb;
- simulated transcript stream;
- Processing checkpoint cards;
- Intent Canvas cards;
- bottom Inspector timeline;
- App / Lab toggle.

Do not spend excessive time on animation polish.

## Persistence

Initial tables needed for Milestone 1:

~~~text
sessions
semantic_events
turns
trace_events
~~~

You may create speech_events schema for future use but it is not required to populate it yet.

## Tests

At minimum:

- FakeDecisionEngine contract shape;
- CREATE event;
- correction PATCH keeps same ID;
- incomplete reminder remains draft;
- POST run returns traceId before completion;
- SSE or TraceRecorder subscription sees ordered events;
- trace replay from SQLite works;
- session reload returns current semantic state.

## Definition of done

Before finishing:

~~~text
pnpm test
pnpm lint
pnpm typecheck
~~~

should pass.

Then update the PR/handoff with:

~~~text
Outcome:
What changed:
Key decisions:
Tests:
Known gaps:
Next useful task:
~~~

## Do not continue into Milestone 2 automatically

Stop after Milestone 1 works.

Milestone 2 introduces the real TypeSafe adapter and needs the official TypeSafe agent skill plus the eval harness.

The point of stopping is to verify that the semantic-state / UI / trace architecture works independently of external AI services.
