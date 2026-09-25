# Observability and inspector

Observability is a product feature of this POC, not a later operations task.

## Goal

For any interaction, answer:

- what input did the system receive?
- for voice, what transcript hypotheses/revisions occurred?
- which semantic checkpoint caused processing?
- what state did each component see?
- which JEV questions were asked?
- what answers/confidence came back?
- which threshold/policy branch fired?
- was an LLM called, and why?
- which model was selected?
- which tools were proposed and executed?
- was approval required?
- was assistant output interrupted or cancelled?
- what failed or retried?
- how long did each step take?
- what did the system retain as state/memory?

## Correlation model

Use explicit identifiers rather than relying on log ordering:

- `sessionId` — conversational/session scope,
- `utteranceId` — one user speech unit,
- `revision` — version of transcript evidence,
- `traceId` — one processed semantic turn/checkpoint,
- `responseId` — one assistant response/audio stream,
- `toolCallId` — one proposed/executed tool action.

A long voice interaction can therefore contain many utterances and traces inside one session.

## Trace model

For text or semantic turns, record:

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

For voice, additionally record:

- `voice.session.started`
- `voice.speech.started`
- `voice.transcript.partial`
- `voice.transcript.revised`
- `voice.transcript.final`
- `voice.semantic_checkpoint`
- `voice.output.started`
- `voice.output.delta` only as lightweight metadata, not raw audio blobs
- `voice.output.completed`
- `voice.output.interrupted`
- `voice.session.reconnected`
- `voice.session.ended`

Provider-native event names may be preserved in metadata for debugging, but the inspector should render canonical events.

## End-to-end voice timeline

The useful unit is an episode/timeline:

```
speech starts
  -> partial transcript r1
  -> partial transcript r2
  -> semantic checkpoint
  -> JEV interpretation
  -> draft structured event
  -> user correction
  -> transcript revision r3
  -> JEV patch
  -> soft commit
  -> tool proposal
  -> approval/policy
  -> tool result
  -> assistant audio starts
  -> user barges in
  -> assistant audio cancelled
  -> next utterance
```

The inspector should make this sequence visually obvious.

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

Minimum useful text view:

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

Minimum useful voice view:

```
Voice episode
├─ Audio activity / turn boundaries
├─ Transcript ledger
│  ├─ r1 partial
│  ├─ r2 revised
│  └─ r3 final
├─ Semantic checkpoint
├─ JEV decisions
├─ Draft / patch / soft-commit / seal
├─ LLM call (if any)
├─ Tool proposal / approval / execution
├─ Assistant output
└─ Interruption / cancellation
```

This is more useful for the POC than a generic chatbot-debug panel.

## Metrics worth keeping

Start with only metrics that help compare architecture choices:

- speech-start -> first transcript latency,
- speech-end -> semantic checkpoint latency,
- checkpoint -> JEV latency,
- checkpoint -> first assistant audio latency,
- number of transcript revisions per utterance,
- number of JEV evaluations per utterance,
- corrections successfully patched vs duplicated,
- tool proposals blocked/approved,
- interruption -> audio-stop latency,
- provider errors/reconnections,
- LLM/tool/JEV cost metadata where available.

## Privacy

Do not assume traces are harmless.

Before cloud deployment, add:

- field-level redaction,
- secret filtering,
- configurable transcript retention,
- separation of user content from operational metadata.

Raw audio retention should be off by default. The event timeline should be diagnosable without retaining microphone audio.
