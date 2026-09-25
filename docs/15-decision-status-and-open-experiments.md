# Decision status and open experiments

> **Status:** Normative planning reference  
> **Last updated:** 2026-09-25

This file answers: **What should an implementation agent build, what should it spike, and what should it leave alone?**

## Implement

| Area | Current direction | Evidence/design |
|---|---|---|
| Core runtime | Application-owned thin semantic/JEV/policy layer | 01, 10, ADR 0002 |
| JEV inputs | Bounded SemanticFrame + versioned question registry | 11 |
| State | Explicit SemanticEvent identity + CREATE/PATCH/MERGE/SEAL | 12 |
| UI | React, typed application components, App + Inspector modes | 09, 12, 04 |
| Tools | Provider-neutral Tool Gateway with deterministic policy/approval | 14 |
| Persistence | SQLite locally | 02, ADR 0001 |
| Telemetry | Structured trace + OpenTelemetry + Inspector event stream | 04 |
| Voice semantic model | Transcript Ledger + semantic checkpoints | 08 |
| Memory | Episode candidates + JEV classification + deterministic write policy | 13 |

## Implement as a vertical slice, not as a framework

First useful proof:

~~~text
typed or streamed input
   -> SemanticFrame
   -> fake/real JEV question set
   -> policy
   -> SemanticEvent CREATE/PATCH
   -> typed UI card
   -> trace visible in Inspector
~~~

Then add one governed tool.

Then add the mixed-utterance voice scenario.

## Spike before selecting

### Harness

Evaluate the least-complex implementation of the same contract using one or more of:

- thin own orchestrator;
- Microsoft Agent Framework;
- GitHub Copilot SDK behind our pre-turn layer;
- LangChain/LangGraph;
- Strands.

Success criteria:

- raw input is available before reasoning-model selection;
- model class can be selected before the relevant call;
- tool proposals can pass through Tool Gateway;
- trace events can correlate model/tool/runtime events;
- cancellation works;
- implementation remains smaller than building equivalent machinery ourselves.

Do not reimplement mature harness features merely for "purity."

### STT/control-first voice provider

Run the same scenario against candidate providers.

Measure:

- first partial latency;
- final transcript latency;
- revision/correction behavior;
- endpointing;
- correlation quality;
- SDK/transport complexity;
- cost.

### Native realtime provider

Evaluate after the control-first path exists.

Measure:

- conversational latency;
- barge-in;
- tool-call control;
- session resumption;
- event observability;
- ability to delegate complex reasoning.

### AG-UI / CopilotKit

Only adopt after proving a concrete reduction in code for:

- typed agent events;
- human approval;
- generative/structured UI.

Core SemanticEvent and Tool Gateway contracts remain ours.

### Cloud

Choose only for the first deployed demo.

Compare operational simplicity, not theoretical maximum scale.

## Research later

These are worthwhile questions but are not required for the first useful product:

- JEV-based large tool-catalog activation vs prompt-cache effects;
- JEV-based context prefetch/relevance;
- session-retro automatic artifact suggestions;
- provider-independent model capability registry;
- API Journey Compiler retrieval/evidence model;
- WebMCP adapter for browser actions.

## Deferred until evidence demands them

- Durable Objects as mandatory session architecture;
- Convex as mandatory backend;
- Step Functions/workflow engine;
- microservices;
- queue/event bus;
- vector memory;
- generalized skill/plugin marketplace;
- multi-agent supervisor;
- arbitrary generated UI code;
- implementing every provider.

## How to change status

If a spike produces evidence that changes one of the chosen directions:

1. write the result under docs/research;
2. update this status file;
3. update the relevant normative design;
4. add an ADR for a durable cross-cutting change;
5. update tests/evals that encode the old behavior.

Do not change architecture by silently introducing a library in an implementation PR.
