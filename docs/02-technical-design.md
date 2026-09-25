# Technical design

## Recommended initial stack

Use a boring TypeScript stack:

- Node.js 22+
- TypeScript
- React + Vite for the web UI
- Fastify for the local/API server
- WebSocket for realtime voice/media events
- SQLite for local persistence
- Drizzle ORM only if it reduces SQL friction; plain SQL is acceptable
- Zod for runtime schemas
- Vitest for unit/integration tests
- OpenTelemetry API/SDK for traces
- Server-Sent Events for live inspector updates

Why this shape:

- runs fully locally,
- UI and server concerns are cleanly separated,
- voice does not require committing to one provider or cloud,
- no dependency on a particular serverless runtime,
- easy to containerize,
- deployable later to a VM/container platform,
- adapters can be moved to serverless/edge only if useful.

Do **not** add CopilotKit initially. A standard React UI is sufficient for the POC and leaves orchestration and voice-state transitions visible. Revisit an agent UI framework only after the interaction model becomes complex enough to justify it.

## Repository shape

```
/
├─ AGENTS.md
├─ README.md
├─ apps/
│  ├─ api/
│  └─ web/
├─ packages/
│  └─ core/
├─ docs/
│  ├─ adr/
│  └─ ...
└─ tests/
```

This is the maximum useful separation initially. Do not split into more packages until code pressure demands it.

## Core domain types

```ts
type SessionId = string;
type TraceId = string;

type AgentInput = {
  sessionId: SessionId;
  text: string;
  attachments?: AttachmentRef[];
};

type Decision<T> = {
  value: T;
  confidence?: number;
  probabilities?: Record<string, number>;
  provider: "jev" | "fake";
  latencyMs?: number;
};

type Route =
  | { kind: "deterministic"; handler: string }
  | { kind: "llm"; modelClass: "fast" | "reasoning" }
  | { kind: "needs_clarification"; reason: string }
  | { kind: "needs_approval"; action: ProposedAction };

type ProposedAction = {
  toolId: string;
  input: unknown;
};

type TurnResult = {
  response: string;
  route: Route;
  traceId: TraceId;
};
```

Exact types may evolve, but preserve the separation between **evidence**, **decision**, **policy**, and **execution**.

## Voice event types

Core must not depend on OpenAI/Gemini/xAI event names.

Start with a small canonical vocabulary:

```ts
type SpeechEvent =
  | { type: "speech.started"; utteranceId: string; at: number }
  | {
      type: "transcript.partial";
      utteranceId: string;
      revision: number;
      text: string;
      at: number;
    }
  | {
      type: "transcript.revised";
      utteranceId: string;
      revision: number;
      replacesRevision: number;
      text: string;
      at: number;
    }
  | {
      type: "transcript.final";
      utteranceId: string;
      revision: number;
      text: string;
      at: number;
    }
  | { type: "speech.ended"; utteranceId: string; at: number }
  | { type: "response.interrupted"; responseId: string; at: number };
```

The Transcript Ledger stores these events and materializes the current transcript view.

Do not collapse provider correction and user semantic correction into the same concept.

## Ports

Keep small interfaces for volatile external systems:

```ts
interface DecisionEngine {
  decide(request: DecisionRequest): Promise<DecisionResponse>;
}

interface LanguageModel {
  generate(request: GenerationRequest): Promise<GenerationResponse>;
}

interface ToolExecutor {
  execute(call: ValidatedToolCall): Promise<ToolResult>;
}

interface SessionStore {
  load(id: SessionId): Promise<SessionState | null>;
  save(state: SessionState): Promise<void>;
}

interface TraceSink {
  record(event: TraceEvent): Promise<void>;
}
```

Voice has two intentionally different capability shapes.

For control-first voice:

```ts
interface SpeechInput {
  pushAudio(frame: AudioFrame): Promise<void>;
  events(): AsyncIterable<SpeechEvent>;
}

interface SpeechOutput {
  speak(request: SpeakRequest): AsyncIterable<OutputAudioEvent>;
  cancel(responseId: string): Promise<void>;
}
```

For native realtime speech-to-speech:

```ts
interface RealtimeVoiceSession {
  sendAudio(frame: AudioFrame): Promise<void>;
  sendToolResult(result: ToolResult): Promise<void>;
  cancelResponse(): Promise<void>;
  events(): AsyncIterable<RealtimeVoiceEvent>;
}
```

Do not force the two modes into one lowest-common-denominator interface.

Do not create a generic provider framework. Implement the exact methods the application needs.

## Orchestrator pseudocode

Text and voice semantic checkpoints enter the same core operation:

```ts
async function handleSemanticInput(input: SemanticInput): Promise<TurnResult> {
  const state = await sessions.loadOrCreate(input.sessionId);
  const normalized = normalize(input, state);

  const pre = await decisions.decide(buildPreflightQuestions(normalized));
  const route = policy.route(pre, normalized);

  const outcome =
    route.kind === "deterministic"
      ? await deterministicHandlers.run(route, normalized)
      : route.kind === "llm"
        ? await runLlmPath(route, normalized)
        : route;

  const checked = await evaluateOutcome(outcome, normalized);
  await persistTurn(state, normalized, checked);

  return checked;
}
```

Raw transcript deltas do not call this function directly. A voice coordinator creates semantic checkpoints first.

If the real code becomes substantially more complicated than this before multiple use cases exist, stop and simplify.

## Voice coordinator

The initial coordinator only needs to:

1. accept normalized speech events,
2. append them to the Transcript Ledger,
3. decide when a semantic checkpoint exists,
4. call core orchestration with bounded context,
5. reconcile later revisions into draft/soft-committed structured events,
6. cancel stale assistant output on interruption.

Do not implement a generic streaming workflow engine.

## Persistence

Initial SQLite tables:

- `sessions`
- `turns`
- `trace_events`
- `memory_candidates`
- `speech_events` when voice is enabled

Store JSON payloads where schemas are still evolving. Normalize only data that must be queried/indexed.

Raw audio retention is not required and should be off by default.

## API surface

Start small:

- `POST /api/sessions/:id/turns`
- `GET /api/sessions/:id`
- `GET /api/traces/:id`
- `GET /api/traces/:id/events` (SSE)
- `POST /api/approvals/:id`
- `WS /api/voice/sessions/:id` for the initial server-mediated voice path

A later native provider adapter may use a client-direct WebRTC/WebSocket connection secured with provider-supported ephemeral credentials while a sideband/control connection keeps tools and telemetry under application ownership.

## Provider capability registry

Do not branch core code on provider names.

An adapter may publish capabilities such as:

```ts
type VoiceCapabilities = {
  nativeSpeechToSpeech: boolean;
  streamingInputTranscript: boolean;
  inputTranscriptRevisions: boolean;
  outputTranscript: boolean;
  serverVad: boolean;
  semanticTurnDetection: boolean;
  bargeIn: boolean;
  toolCalling: boolean;
  asyncTools: boolean;
};
```

These flags inform session setup and tests; they are not a reason to build a large provider framework.

## Model routing

There are two different choices:

1. **voice session selection** — provider/model/voice/transport chosen for a realtime session;
2. **reasoning routing** — deterministic handler vs fast model vs reasoning model selected per semantic task.

Do not continuously replace the live voice model because a JEV classification changes. A realtime model can remain the conversational shell while bounded backend reasoning uses another model.

## Configuration

Environment variables only for secrets and deployment-specific values.

Policy thresholds should live in versioned config/code so changes are reviewable.

Voice provider/model names should be configuration, not domain logic.

## Failure handling

- External AI timeout -> typed failure, trace it, do not silently retry forever.
- One bounded retry is acceptable for transient network failures.
- Invalid LLM or voice-model tool proposal -> reject before execution.
- Low-confidence decision -> route to clarification or LLM according to policy.
- JEV unavailable -> explicit fallback policy, not accidental behavior.
- Voice connection loss -> preserve ledger/session state and expose reconnect state.
- User barge-in -> cancel stale output and record interruption.
- Late transcript revision -> patch only state still inside its correction horizon; never silently rewrite an already-executed consequential action.
