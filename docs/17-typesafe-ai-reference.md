# TypeSafe AI / Jev practical reference

> **Status:** Normative integration reference + dated external facts
> **Snapshot date:** 2026-09-25
> **Primary sources:** https://docs.typesafe.ai/introduction and https://docs.typesafe.ai/agent-skill

This file exists so an implementation agent does not need to rediscover what TypeSafe/Jev is before it can implement Milestones 1-2.

## What TypeSafe AI is

TypeSafe AI exposes "System One" decision models: models designed to evaluate state and return structured decisions for software, rather than generate prose for a human.

**Jev** is TypeSafe's flagship System One model.

The basic contract is:

~~~text
state + typed questions
        |
        v
       Jev
        |
        v
structured typed answers + probabilities
~~~

Jev is not:

- an LLM chat model;
- an agent loop;
- a tool executor;
- a workflow engine;
- a speech model.

It is a decision primitive that sits inside a larger application.

Official introduction:
https://docs.typesafe.ai/introduction

## Current API and SDK

### Hosted API

Endpoint:

~~~text
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
Content-Type: application/json
~~~

Authentication uses an API key, normally supplied to the application as the environment variable TYPESAFE_API_KEY.

### JavaScript/TypeScript SDK

This repository is TypeScript-first, so the reference implementation should use the official JavaScript SDK inside the TypeSafe adapter:

~~~bash
pnpm add @typesafe-ai/sdk
~~~

The SDK requires Node.js 20+.

Example:

~~~ts
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

const response = await client.systemOne({
  state: {
    text: "today I drank 200 ml Coke ... no, I mean water",
    activeEvents: [
      {
        id: "evt_hydration_1",
        type: "hydration",
        fields: { amountMl: 200, drink: "Coke" },
      },
    ],
  },
  questions: {
    relation: choice("How does the newest speech relate to the active state?", {
      new_event: "Starts a separate intent/event",
      continuation: "Adds information to an existing event",
      correction: "Replaces or changes existing meaning",
      aside: "Does not belong in application state",
    }),
    complete: noul("Is there enough stable information to update structured state?"),
    stability: score("How stable is the interpretation?", [
      "Too early; wait for more evidence",
      "Useful draft but likely to change",
      "Stable enough to soft commit",
      "Stable enough to seal",
    ]),
  },
});
~~~

Official SDK:
https://docs.typesafe.ai/sdk/javascript

## Request shape

A System One request contains:

~~~json
{
  "state": {},
  "model": "jev-latest",
  "questions": {}
}
~~~

state can be:

- a string;
- a JSON object;
- an array.

For this project, prefer structured JSON state so questions can refer to explicit fields and active event IDs.

The question ID is application-owned. Answers are returned under the same ID.

Official API reference:
https://docs.typesafe.ai/api

## The three question types

### Noul

A yes/no judgment.

Returns:

~~~ts
type NoulAnswer = {
  type: "noul";
  noul: number; // P(true), 0..1
};
~~~

There is **no separate confidence field** for a Noul.

Use it when the probability itself is the useful signal.

Examples for this project:

- is this request complete enough?
- is this tool call consistent with user intent?
- does this step satisfy the goal?
- is this candidate worth persisting as memory?

### Choice

Choose one item from a closed set.

Returns:

~~~ts
type ChoiceAnswer<T extends string = string> = {
  type: "choice";
  choice: T;
  probabilities: Record<T, number>;
  confidence: number;
};
~~~

Current API limit: up to 255 Choice options.

Examples:

- new_event / continuation / correction / cancel / aside;
- fast_model / reasoning_model / no_llm;
- target active event;
- memory scope.

### Score

Evaluate along an ordered rubric.

Returns:

~~~ts
type ScoreAnswer = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};
~~~

Current API accepts up to 10 ordered levels.

Examples:

- action risk;
- interpretation stability;
- urgency;
- severity.

Official primitives:
https://docs.typesafe.ai/primitives

## Batching / speculative fan-out

Questions against the same state should normally be sent in **one Jev request**.

TypeSafe evaluates questions independently and in parallel. The docs explicitly recommend speculative fan-out: ask questions that may only be relevant on some code paths, then let code ignore irrelevant answers.

For this project, one voice semantic checkpoint might batch:

~~~text
relation
target event
completeness
stability
needs open-ended reasoning
memory-candidate signal
~~~

Do not make six HTTP calls unless one decision genuinely depends on the answer of another.

TypeSafe's current docs say adding questions usually has little effect on response time. Their parallel-questions cookbook reports a large speed/cost advantage from batching versus one-question-per-call; treat the exact benchmark as an external reference, not a performance promise for this app.

References:
- https://docs.typesafe.ai/patterns/fan-out
- https://docs.typesafe.ai/cookbooks

## Independent questions

Questions within one System One request see the same state and are evaluated independently.

Question B does not see Question A's answer.

If a later question truly depends on the first answer, make a second request after code has incorporated the first result into state or used it to construct new candidates.

This matters for target-event selection. Prefer asking relation + target against the same known active-event set when possible. Only do a second request if the first result changes the state/candidate set required for the next question.

## Current model / limits / price

As of this snapshot, TypeSafe documents:

~~~text
jev-latest -> jev-1.13.0

Price:
$0.042 per 1M input tokens
output tokens free

Rate limits:
250,000 tokens / second
1,200 requests / minute

Context:
64k tokens per request total
32k tokens for state + longest individual question

Input:
text / JSON only
no direct image/audio/video
~~~

Rate limits can change dynamically. Do not encode them as architectural constants.

For reproducible threshold/eval work, prefer a pinned version such as jev-1.13.0. The jev-latest alias can move when a new release ships.

Official model page:
https://docs.typesafe.ai/models

## Latency

The public docs do not publish a latency SLA that we should hard-code into the POC.

Therefore:

- record Jev round-trip latency on every call;
- benchmark on our own fixtures;
- compare against the chosen general-purpose LLM baseline;
- do not claim a fixed millisecond budget until measured.

Batching should be preferred because questions are evaluated in parallel.

## Is Jev deterministic?

No architectural assumption in this repository should require byte-for-byte deterministic outputs.

Jev is probabilistic. Pinning a model version improves reproducibility of the model definition, but repeated evaluations can still vary.

TypeSafe's self-consistency cookbook reports low probability variance for Jev in its tested workload, but not zero variance.

Implication:

- use probabilities and confidence;
- calibrate thresholds;
- use hysteresis for streaming state;
- never treat a single uncertain answer as irreversible authorization.

Reference:
https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook

## Confidence

Choice and Score return:

- a full probability distribution;
- a derived confidence value.

Noul returns the probability of true directly and has no separate confidence field.

Do not add confidence thresholds everywhere by default.

Use:

- the highest Choice probability when all you need is the best option;
- probability margins/hysteresis when comparing streaming candidates;
- risk-specific confidence thresholds when the cost of a wrong action matters;
- Noul probability thresholds for yes/no policy.

Official confidence guidance:
https://docs.typesafe.ai/confidence

## DecisionEngine adapter for this repo

Core code must not depend directly on TypeSafe SDK response classes.

Use an application-owned port:

~~~ts
type DecisionQuestion =
  | NoulQuestion
  | ChoiceQuestion
  | ScoreQuestion;

type DecisionAnswer =
  | NoulDecisionAnswer
  | ChoiceDecisionAnswer
  | ScoreDecisionAnswer;

type DecisionRequest = {
  state: JsonValue;
  questions: Record<string, DecisionQuestion>;
  model?: string;
};

type DecisionResponse = {
  model: string;
  answers: Record<string, DecisionAnswer>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  latencyMs: number;
};

interface DecisionEngine {
  decide(request: DecisionRequest): Promise<DecisionResponse>;
}
~~~

Implementations:

~~~text
FakeDecisionEngine       -> Milestone 1 / deterministic fixtures
TypeSafeDecisionEngine   -> wraps @typesafe-ai/sdk
~~~

The fake must implement the **same answer shapes** as the real adapter.

## Failure behavior

The adapter should surface typed errors:

~~~ts
type DecisionEngineError =
  | { kind: "unauthorized" }
  | { kind: "invalid_request"; details: unknown }
  | { kind: "rate_limited"; retryAfterMs?: number }
  | { kind: "overloaded"; retryAfterMs?: number }
  | { kind: "timeout" }
  | { kind: "unavailable"; message: string };
~~~

The official SDK has retry/backoff behavior for rate-limit/overload responses. The application still owns stage-specific fallback policy; see docs/18-runtime-contracts.md.

## How AI coding agents should use TypeSafe

TypeSafe publishes a drop-in agent skill for Claude Code, Codex and other coding-agent environments.

Official page:
https://docs.typesafe.ai/agent-skill

### Project-local skill installation

For agents supported by skills.sh:

~~~bash
npx skills add typesafe-ai/skills --skill typesafe-ai
~~~

For Claude Code:

~~~bash
claude plugin marketplace add typesafe-ai/skills
claude plugin install typesafe@typesafe-ai
~~~

The skill can also be read directly:
https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md

### Agent rule for this repository

When modifying:

- Jev request shape;
- question design;
- TypeSafe adapter code;
- thresholds;
- batching;
- eval fixtures;

the coding agent should use/read the TypeSafe skill first.

Do not invent SDK/API fields from memory.

### Useful agent prompt

~~~text
Use the TypeSafe skill. Read docs/11-jev-request-modeling.md,
docs/17-typesafe-ai-reference.md and the current eval fixtures.
Implement the smallest requested slice using the official TypeSafe
SDK shapes. Batch independent questions sharing the same state.
Do not change question wording or thresholds without updating evals.
~~~

## Useful TypeSafe demos / reference patterns

Official references worth preserving for agents:

### Quick start / support triage

Mixes Choice, Score and Noul in one request.

https://docs.typesafe.ai/introduction/quickstart

### Speculative fan-out

Ask several potentially relevant questions once, route in code.

https://docs.typesafe.ai/patterns/fan-out

Very relevant to our checkpoint design.

### Intent routing

A direct reference for request -> closed-set route -> code handler.

https://docs.typesafe.ai/patterns

### Function calling cookbook

Maps natural-language requests to ordinary typed functions using TypeSafe decisions.

https://docs.typesafe.ai/cookbooks

Relevant to Tool Gateway work.

### Skill suggestion cookbook

Ranks a large catalog, fetches top candidates, then re-checks with better evidence.

Relevant to future skill/tool routing.

### Structure recovery

Shows a real two-request dependency: first create structure, then classify newly-created blocks.

Relevant to understanding when a second Jev call is actually necessary.

### Guardrails for LLMs

Uses TypeSafe decisions before/after another LLM.

Relevant to our "Jev around an agent harness" control-plane design.

### Self-consistency

Shows repeated Jev decisions and uncertainty routing.

Relevant to calibration and threshold setting.

## Project-specific Jev examples

The first implementation should use question sets from:

- docs/11-jev-request-modeling.md;
- docs/16-streaming-checkpoint-scheduler.md;
- tests/evals/.

Do not make the first demo a generic support-ticket example. The official demos explain the primitive; our mixed-intent/correction scenario proves this project's architecture.
