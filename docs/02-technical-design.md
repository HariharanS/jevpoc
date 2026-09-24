# Technical design

## Recommended initial stack

Use a boring TypeScript stack:

- Node.js 22+
- TypeScript
- React + Vite for the web UI
- Fastify for the local/API server
- SQLite for local persistence
- Drizzle ORM only if it reduces SQL friction; plain SQL is acceptable
- Zod for runtime schemas
- Vitest for unit/integration tests
- OpenTelemetry API/SDK for traces
- Server-Sent Events for live inspector updates

Why this shape:

- runs fully locally,
- UI and server concerns are cleanly separated,
- no dependency on a particular serverless runtime,
- easy to containerize,
- deployable later to a VM/container platform,
- adapters can be moved to serverless/edge only if useful.

Do **not** add CopilotKit initially. A standard React UI is sufficient for the POC and leaves the orchestration visible. Revisit an agent UI framework only after the interaction model becomes complex enough to justify it.

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

Exact types may evolve, but preserve the separation between **decision**, **policy**, and **execution**.

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

Do not create a generic provider framework. Implement the exact methods the application needs.

## Orchestrator pseudocode

```ts
async function handleTurn(input: AgentInput): Promise<TurnResult> {
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

If the real code becomes substantially more complicated than this before multiple use cases exist, stop and simplify.

## Persistence

Initial SQLite tables:

- `sessions`
- `turns`
- `trace_events`
- `memory_candidates`

Store JSON payloads where schemas are still evolving. Normalize only data that must be queried/indexed.

## API surface

Start small:

- `POST /api/sessions/:id/turns`
- `GET /api/sessions/:id`
- `GET /api/traces/:id`
- `GET /api/traces/:id/events` (SSE)
- `POST /api/approvals/:id`

## Configuration

Environment variables only for secrets and deployment-specific values.

Policy thresholds should live in versioned config/code so changes are reviewable.

## Failure handling

- External AI timeout -> typed failure, trace it, do not silently retry forever.
- One bounded retry is acceptable for transient network failures.
- Invalid LLM tool proposal -> reject before execution.
- Low-confidence decision -> route to clarification or LLM according to policy.
- JEV unavailable -> explicit fallback policy, not accidental behavior.
