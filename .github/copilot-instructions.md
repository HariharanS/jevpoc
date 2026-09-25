# Copilot instructions for JEV POC

Read AGENTS.md and docs/README.md before substantial work.

The repository contains both **normative design** and **dated research snapshots**. Research files describe evaluated alternatives/current external capabilities; they are not permission to implement every option.

## Before coding

Always read:

1. docs/15-decision-status-and-open-experiments.md
2. docs/18-runtime-contracts.md
3. docs/07-implementation-plan.md

For Jev/TypeSafe work also read:

- docs/11-jev-request-modeling.md
- docs/17-typesafe-ai-reference.md
- tests/evals/README.md
- relevant JSONL fixtures
- official TypeSafe agent skill

For frontend work read docs/20-ui-ux-design.md.

For voice work read docs/08, docs/16 and the detailed voice capability matrix under docs/research.

## Priorities

1. smallest working vertical slice;
2. preserve raw evidence -> Jev -> deterministic policy control points;
3. deterministic/testable state and action handling;
4. typed provider/harness boundaries;
5. explicit versioned Jev question sets and calibrated policy thresholds;
6. stable SemanticEvent identity and PATCH behavior;
7. revision-aware voice behavior;
8. observable App/Lab behavior;
9. local-first operation.

## Locked first-demo choices

Do not reopen these during Milestones 0-2:

- first demo = Live Intent Workspace mixed-intent/correction flow;
- package manager = pnpm;
- Node = 22+;
- DB = node:sqlite + plain SQL;
- lint/format = Biome;
- Jev adapter = official @typesafe-ai/sdk behind DecisionEngine;
- first general LLM adapter = OpenAI official JS SDK behind LanguageModel;
- trace replay source = SQLite trace_events;
- live trace = in-process TraceBus -> SSE;
- traceId is created before processing;
- Milestones 1-3 are single-pass;
- approval only exists after concrete validated ToolProposal;
- Inspector is a runtime UI toggle.

## When implementing Jev

- use/read the TypeSafe agent skill before changing the adapter or question sets;
- do not invent API/SDK fields from memory;
- preserve Noul vs Choice vs Score answer shapes;
- Noul has probability, not generic confidence;
- batch independent questions sharing one state;
- do not put an LLM in front of Jev merely to formulate routine questions;
- rerun eval fixtures if question wording, criteria or thresholds change;
- pin the model version for benchmark runs;
- trace model version, latency, usage and fallback.

## When implementing the runtime

Preserve:

~~~text
evidence
 -> bounded SemanticFrame
 -> versioned Jev question set
 -> deterministic policy
 -> deterministic mutation OR configured LLM route
 -> Tool Gateway if needed
 -> completion / memory / trace
~~~

Do not let provider SDK objects become core domain types.

## When implementing UI

Use the three-column Lab design:

~~~text
Input Stream
   |
Processing / Jev / Policy
   |
Intent Canvas
   +
bottom Inspector timeline
~~~

The voice orb is provider-neutral.

Cards update in place using stable SemanticEvent IDs.

Build simulated streaming fixtures before real microphone/provider integration.

## Evaluation

The POC must compare against the LLM-first baseline defined in docs/19-first-demo-and-evaluation.md.

Do not make performance/quality claims without fixture results.

## Do not introduce opportunistically

Do not add CopilotKit, LangGraph, Temporal, queues, microservices, vector databases, Durable Objects as mandatory architecture, WebMCP as a foundation, or a generalized plugin system merely because they appear in research.

A concrete requirement or successful documented spike must justify the change.
