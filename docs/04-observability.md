# Observability and inspector

Observability is a product feature of this POC, not a later operations task.

## Goal

For any turn, answer:

- what input did the system receive?
- what state did each component see?
- which JEV questions were asked?
- what answers/confidence came back?
- which threshold/policy branch fired?
- was an LLM called, and why?
- which model was selected?
- which tools were proposed and executed?
- was approval required?
- what failed or retried?
- how long did each step take?
- what did the system retain as state/memory?

## Trace model

Use a single `traceId` per user turn and child spans/events for:

- `input.normalized`
- `jev.preflight`
- `policy.route`
- `llm.generate`
- `tool.proposed`
- `jev.action_check`
- `policy.action`
- `tool.execute`
- `jev.completion`
- `memory.classify`
- `turn.persist`

## Local implementation

Do not require an external observability backend.

Initially:

- emit OpenTelemetry spans,
- mirror useful structured trace events into SQLite,
- stream events to inspector UI using SSE,
- log concise JSON to stdout.

Later, export OTLP to whichever cloud backend is chosen.

## Inspector UI

A feature flag toggles inspector mode.

Minimum useful view:

```
Turn
├─ Input
├─ JEV preflight
│  ├─ question
│  ├─ answer
│  ├─ confidence/probabilities
│  └─ latency
├─ Policy route
├─ LLM call (if any)
├─ Tool proposal / approval / execution (if any)
├─ Completion decision
└─ Persisted signals
```

This is more useful for the POC than a generic chatbot-debug panel.

## Privacy

Do not assume traces are harmless.

Before cloud deployment, add:

- field-level redaction,
- secret filtering,
- configurable transcript retention,
- separation of user content from operational metadata.
