# First demo and evaluation plan

> **Status:** Normative
> **Purpose:** Define what proves the POC works, how to label fixtures, and how to compare Jev against a simpler LLM-first baseline.

## First demo

Name:

> **Live Intent Workspace**

The first public/demoable product slice is the mixed-intent semantic workspace described in docs/examples/01-mixed-utterance-end-to-end.md.

It starts text-first, then reuses the same semantic runtime for streaming voice.

## Why this demo

A model-router-only demo is cheaper to build but does not prove the product idea.

This demo exercises the differentiating parts:

- incremental input;
- multiple intents in one stream;
- correction / PATCH semantics;
- incomplete state;
- typed UI projection;
- Jev batching;
- optional LLM escalation;
- live Inspector.

## Explicit baseline

The POC must compare our architecture against a simpler baseline:

~~~text
BASELINE

input / final transcript
  -> general-purpose LLM
  -> structured semantic output
  -> state mutation
~~~

versus:

~~~text
JEV CONTROL PLANE

input / streaming transcript
  -> checkpoint scheduler
  -> Jev bounded decisions
  -> deterministic policy
  -> optional LLM
  -> state mutation
~~~

Do not claim the JEV design is superior until measurements support it.

## Evaluation levels

### Level 1 — individual decision quality

Examples:

- relation = new_event / continuation / correction / aside;
- target event;
- completeness;
- needs reasoning;
- memory scope;
- tool intent match.

### Level 2 — semantic state quality

Did the runtime create the correct final SemanticEvents?

Examples:

- one Water hydration event, not Coke + Water duplicates;
- parcel task at 2pm;
- medicine reminder remains incomplete;
- journal reflection is a continuation, not a duplicate event.

### Level 3 — system trade-offs

Compare:

- latency;
- number of model calls;
- cost;
- LLM skip rate;
- traceability;
- UI stability;
- correction latency.

## Initial POC success targets

These are **provisional engineering targets**, not marketing claims.

On the checked-in labelled fixture suite:

1. **Explicit correction handling**
   - >= 95% of explicit correction fixtures PATCH the intended existing event;
   - zero silent execution of superseded draft values.

2. **Event relation classification**
   - >= 90% top-choice accuracy across new / continuation / correction / cancel / aside / unclear fixtures.

3. **End-to-end semantic scenario**
   - >= 90% of scenarios produce the expected event set and required fields;
   - duplicate-event rate <= 5%.

4. **General-purpose LLM avoidance**
   - >= 50% of bounded semantic checkpoints complete without invoking the general-purpose LLM.

5. **Quality vs LLM-first baseline**
   - end-to-end semantic success no worse than 5 percentage points below the chosen LLM baseline;
   - if Jev is better, report the measured difference rather than assuming it.

6. **Latency**
   - median bounded-decision path should be materially faster than the chosen LLM baseline;
   - target for the experiment: <= 60% of baseline median decision latency.
   - do not convert this to an absolute millisecond SLA until measured.

7. **Cost**
   - bounded semantic-decision input cost should be materially lower than the LLM-first baseline;
   - target for experiment: <= 25% of baseline cost for equivalent labelled scenarios.

8. **Streaming stability**
   - no more than one visible card-type flip for a fixture unless the user explicitly corrects/reframes the intent;
   - explicit user corrections should become visible in state within one subsequent semantic checkpoint.

If a target proves unrealistic after a valid benchmark, update this file with evidence rather than gaming fixtures.

## Required benchmark variants

For streaming scenarios compare:

### A. Final-only Jev

Wait for final transcript, call Jev once.

Purpose:
- simplest Jev baseline;
- shows the cost of waiting.

### B. Hybrid checkpoint + Jev

Current chosen design.

Purpose:
- live state;
- correction handling;
- bounded calls.

### C. LLM-first

Checkpoint or final transcript -> structured-output LLM.

Purpose:
- strongest simpler alternative.

Optional later:

### D. Native realtime speech-to-speech

Only after A-C are understood.

## Fixture format

Use JSONL.

Directory:

~~~text
tests/evals/
  README.md
  voice-semantic-update.jsonl
  pre-turn-routing.jsonl
  scenarios.jsonl
  tool-gating.jsonl          # Milestone 4
  memory-scope.jsonl         # Milestone 5
~~~

Each line must be reviewable without running a model.

### Decision fixture

~~~json
{
  "id": "voice-correction-001",
  "questionSet": "voice_semantic_update_v1",
  "state": {
    "request": {
      "text": "ah no I mean water",
      "source": "voice"
    },
    "recent": {
      "transcriptTail": "today I drank 200 ml Coke ... ah no I mean water"
    },
    "activeEvents": [
      {
        "id": "evt_hydration_1",
        "type": "hydration",
        "status": "draft",
        "fields": {
          "amountMl": 200,
          "drink": "Coke"
        }
      }
    ]
  },
  "expected": {
    "relation": "correction",
    "targetEvent": "evt_hydration_1"
  },
  "notes": "Explicit semantic correction; should patch, not create a second event."
}
~~~

### End-to-end scenario fixture

~~~json
{
  "id": "mixed-intent-001",
  "chunks": [
    "today I drank 200 ml Coke",
    "ah no I mean water",
    "pick up my parcel at 2 pm",
    "remind me to take my medicine"
  ],
  "expectedEvents": [
    {
      "type": "hydration",
      "fields": { "amountMl": 200, "drink": "water" }
    },
    {
      "type": "task",
      "fields": { "time": "14:00" }
    },
    {
      "type": "reminder",
      "status": "draft"
    }
  ]
}
~~~

## Labelling process

Before tuning thresholds:

1. create fixtures from project scenarios;
2. two human passes if practical:
   - first label;
   - review ambiguous cases;
3. mark genuinely ambiguous fixtures explicitly rather than forcing a fake "correct" answer;
4. version the question set;
5. run Jev and baseline LLM;
6. inspect failures;
7. only then tune question wording/thresholds.

For a one-person POC, a second AI agent can critique labels, but the human owns the final expected business behavior.

## Minimum fixture count before claiming results

Milestone 2:

- at least 50 decision fixtures total;
- at least 10 explicit correction examples;
- at least 10 continuation/new-intent boundary examples;
- at least 10 incomplete/unclear examples.

Before voice-provider comparison:

- at least 10 recorded/live utterance scripts;
- include filler speech, false starts and long "yapping" turns.

This is enough to reveal obvious architecture problems without pretending to be a production benchmark.

## What to record per run

For Jev:

~~~text
fixtureId
questionSetVersion
jev model version
raw answers/probabilities
policy decision
latency
input/output tokens
estimated cost
fallback used?
~~~

For LLM baseline:

~~~text
fixtureId
provider/model
structured output
latency
input/output tokens
estimated cost
parse/schema failures
~~~

For streaming:

~~~text
checkpoint count
checkpoint reasons
time to first useful event
card mutations
duplicate events
LLM routes
final semantic state
~~~

## Cost calculation

Do not hard-code external provider pricing throughout the codebase.

Use one versioned benchmark-pricing config:

~~~text
tests/evals/pricing.json
~~~

Record:

- source URL;
- retrieved date;
- input/output/audio prices;
- provider/model.

TypeSafe current pricing belongs in that file when the benchmark is implemented.

## Calibration

Thresholds live in one reviewable module.

Suggested future path:

~~~text
packages/core/src/policy/thresholds.ts
~~~

Each threshold must reference:

- question set/version;
- intended false-positive/false-negative trade-off;
- eval fixture(s) that motivated it.

Do not scatter constants like 0.55 through orchestration code.

## Question-set versioning

Question sets are code/config artifacts.

Example:

~~~text
voice_semantic_update_v1
pre_turn_v1
tool_proposal_v1
completion_v1
memory_v1
~~~

If wording/criteria change in a way that can change behavior, bump the version and rerun fixtures.

## Report artifact

Add a generated or hand-written benchmark report:

~~~text
docs/evals/YYYY-MM-DD-baseline-report.md
~~~

It should answer:

- what did Jev get right/wrong?
- what did LLM-first get right/wrong?
- which was faster?
- which was cheaper?
- how many general LLM calls were avoided?
- where did checkpointing help/hurt?
- should the architecture remain as-is?

That report, not the architecture docs alone, is the evidence that the POC hypothesis works.
