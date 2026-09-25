# Product capabilities and user journeys

> **Status:** Normative product/design reference  
> **Purpose:** Define what we are actually building, not only the underlying architecture.

## Product thesis

This is **not primarily a chatbot**.

The product is a **live intent workspace** where natural language or voice is continuously interpreted into evolving typed state, and the interface changes to match the user's current intent.

The core interaction model is:

~~~text
language / voice
      |
      v
interpretation
      |
      v
evolving typed state
      |
      v
appropriate UI
~~~

A useful shorthand from the project discussion is:

> **Describe the problem. The interface appears.**

The application should feel closer to Shapeshift's "one input that becomes the right UI" idea than a normal chat window, but it must go beyond hard-coded intent-to-card mappings.

## Product modes

### App mode

The normal user-facing product.

The user sees:

- one primary text/voice input;
- live, provisional structured cards;
- forms only when fields are genuinely required;
- choices when a bounded decision is needed;
- approvals when an action needs consent;
- progress when work is running;
- confirmations after a committed action;
- corrections that mutate existing state instead of producing duplicate chat artifacts.

### Inspector mode

The same interaction with the control plane exposed.

The user/developer can inspect:

- raw or normalized input;
- voice transcript revisions;
- semantic checkpoints;
- JEV request state;
- every JEV question and answer;
- probabilities/confidence;
- deterministic threshold/policy decisions;
- selected model/model class;
- LLM calls;
- proposed and executed tools;
- approvals;
- state mutations;
- UI/card mutations;
- memory/retro classification;
- latency and cost metadata.

Do **not** expose private model chain-of-thought. Inspector mode is an execution/event trace.

## Core capabilities

### 1. Continuous text and voice input

Input may arrive as:

- complete typed text;
- growing text from a single input box;
- streaming speech transcription;
- native realtime voice;
- corrections to an earlier statement;
- multiple intents in one utterance.

The system must not assume one user turn equals one intent.

### 2. Evolving semantic state

The application maintains explicit structured state such as:

- active intent/event candidates;
- stable facts;
- unresolved fields;
- pending actions;
- approval state;
- task progress;
- correction relationships;
- evidence/source references.

The transcript is evidence. It is not the complete application state.

### 3. Provisional UI

A semantic interpretation may be useful before it is safe to commit.

Example:

~~~text
User: "I drank 200 ml Coke..."
UI:   [Hydration/Food card: 200 ml Coke]  (provisional)

User: "...no, I mean water."
UI:   [Hydration card: 200 ml Water]       (same card patched)
~~~

Do not append a second "Water" item merely because the input changed.

### 4. Multi-intent decomposition

One utterance can create several independent structured items.

Example:

~~~text
"I drank 200 ml water,
 pick up my parcel from Australia Post at 2pm,
 remind me to take my medicine,
 and today is the happiest day of my life...
 but I'm sad about letting go of my old car."
~~~

Possible UI/state:

- hydration event;
- parcel task;
- medication reminder candidate;
- journal/emotion entry.

These can have different completion and commit rules.

### 5. Correction and continuation

The runtime must distinguish:

- new intent;
- continuation of current intent;
- correction of an existing field/event;
- cancellation;
- replacement;
- unrelated aside/noise.

Corrections should patch or merge state where appropriate.

### 6. Deterministic execution

JEV interprets meaning and supplies typed decisions.

Application code owns:

- validation;
- permissions;
- thresholds;
- approvals;
- state mutation;
- tool execution;
- idempotency;
- hard business rules.

### 7. Model routing

The application may route a semantic task to:

- no LLM;
- a fast/cheap model;
- a reasoning model;
- a domain-specific workflow/agent.

Model routing is distinct from voice-provider/session selection.

### 8. Tool governance

Every consequential external action passes through a Tool Gateway.

The gateway owns:

- schema validation;
- identity/permission checks;
- JEV risk/intent/completeness signals where useful;
- deterministic policy;
- human approval;
- execution;
- result validation;
- audit evidence.

### 9. Memory and retrospective signals

The runtime can classify events or windows into:

- ephemeral;
- short-term/task state;
- retrospective/lesson signal;
- long-term reusable memory candidate;
- discard.

Memory write policy remains deterministic and reviewable.

### 10. Purpose-built generated interaction

Longer term, the same runtime can project typed state into purpose-built interfaces:

- comparisons;
- calculators;
- negotiations;
- rules;
- scenario explorers;
- state machines;
- payment journeys;
- editable plans.

The UI is generated from a controlled registry of typed components rather than arbitrary model-generated HTML.

## Primary user journey: live mixed-intent workspace

### Start

The user presses the microphone or begins typing.

The primary UI is quiet:

~~~text
+--------------------------------------------+
|  What do you want to do?          mic      |
+--------------------------------------------+
~~~

### While speaking

The UI may project provisional cards:

~~~text
Hydration
200 ml Coke
draft

Parcel
Pick up Australia Post parcel, 2:00 pm
draft
~~~

### Correction

When the user says "no, water", the hydration card morphs:

~~~text
200 ml Coke  ->  200 ml Water
~~~

The event identity is retained.

### Commit

Safe, complete events can become stable.

Actions with side effects move to confirmation/approval according to policy.

## User journey: family approval demo

This is a simple, ownable demonstration of JEV + policy + workflow.

Roles:

- Kid — requester;
- Dad — normal approver;
- Mum / "Supreme Leader" — escalation approver.

Flow:

~~~text
Kid natural-language request
      |
      v
JEV interpretation
      |
      v
typed Request { actor, action, amount/duration/... }
      |
      v
deterministic policy
      |
      +--> routine -> Dad approval
      |
      +--> exception/high impact -> Mum escalation
      |
      v
state mutation + audit
~~~

The demo shows:

- RBAC/ABAC-like policy;
- probabilistic interpretation;
- deterministic policy;
- human-in-the-loop;
- escalation;
- durable workflow state;
- memory/precedent as an optional later signal.

## User journey: API Journey Compiler

The user points the system at an API specification/documentation set and describes a business outcome.

Example:

> "For physical goods, authorize payment at checkout, capture after stock is confirmed, support authentication, allow partial refunds, and make sure retries cannot double-charge."

The product produces an editable integration view:

- business state machine;
- provider state machine;
- API call sequence;
- webhook/event path;
- state mapping;
- idempotency/retry rules;
- compensating/failure paths;
- ambiguity/evidence markers;
- generated implementation/test plan.

The LLM reasons over open-ended API documentation; JEV answers bounded decisions; deterministic code validates operations against the API/OpenAPI contract.

See docs/examples/02-api-journey-compiler.md.

## User journey: session retrospective

After an agent/session completes, the runtime can inspect episodes rather than only the whole transcript.

Possible signals:

- accepted decision;
- rejected approach;
- repeated failed attempt;
- user correction;
- new project constraint;
- stable preference;
- unresolved task;
- reusable lesson.

JEV classifies the signal. Code decides whether/where it is persisted.

## UI architecture direction

Initial UI:

- React;
- application-owned component system;
- ordinary typed components first;
- App/Inspector toggle.

AG-UI is a useful **event boundary** if/when we need interoperable agent UI events.

CopilotKit can be used selectively later for useful primitives such as human-in-the-loop or generative UI, but it is not foundational to the POC.

The application should own the semantic event model regardless of UI framework.

## UX principles

1. **Morph, don't spam.** Patch an existing card when meaning changes.
2. **Provisional is visible.** Show uncertainty without pretending it is committed.
3. **One input, many intents.** Do not force the user into an app catalogue.
4. **Structured when useful.** Use cards/forms/choices only when they reduce ambiguity.
5. **Quiet by default.** Do not surface internal machinery in App mode.
6. **Inspectable on demand.** Inspector mode should make every important control decision explainable.
7. **No accidental action.** Final transcript or model confidence is never itself permission to execute.
