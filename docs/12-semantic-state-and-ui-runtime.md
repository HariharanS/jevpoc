# Semantic state and UI runtime

> **Status:** Normative architecture  
> **Purpose:** Explain how language becomes evolving state and then UI without turning every change into a chat message.

## Core idea

The application is an **incremental semantic runtime**.

~~~text
input evidence
    |
    v
semantic decision
    |
    v
state mutation
    |
    v
UI projection
~~~

JEV does not render UI and does not directly mutate state.

JEV answers bounded semantic questions. Deterministic application code applies a small mutation vocabulary.

## Mutation vocabulary

The runtime should begin with only a few operations:

- CREATE — create a new event candidate;
- PATCH — modify fields on an existing event;
- MERGE — combine candidates that represent the same underlying intent/event;
- CLOSE — mark an active event/topic complete/closed;
- CANCEL — withdraw an event/action;
- IGNORE — retain evidence but do not create application state;
- WAIT — make no semantic mutation yet.

This is easier to reason about than letting an LLM emit arbitrary state patches.

## Event lifecycle

A semantic event moves through:

~~~text
draft
  |
  v
soft_committed
  |
  +--> patch/merge during correction horizon
  |
  v
sealed
  |
  v
optional action/tool execution
~~~

### Draft

Useful provisional interpretation.

Can be shown in UI.

Not safe to execute.

### Soft committed

Stable enough to be a real pending item, but still easy to patch as the user continues.

### Sealed

Semantic meaning is stable enough for durable state.

Sealing does not bypass tool/action policy.

## Suggested event shape

~~~ts
type SemanticEvent = {
  id: string;
  type: string;
  status: "draft" | "soft_committed" | "sealed" | "closed" | "cancelled";

  fields: Record<string, unknown>;

  source: {
    sessionId: string;
    utteranceIds?: string[];
    transcriptRevisions?: number[];
  };

  confidence?: {
    semanticRelation?: number;
    completeness?: number;
  };

  version: number;
  createdAt: number;
  updatedAt: number;
};
~~~

Keep the first implementation flexible. Do not over-normalize event fields until real use cases stabilize.

## Evidence vs state

Do not conflate:

### Evidence

- user text;
- transcript segment;
- STT hypothesis;
- tool result;
- API document snippet;
- UI form submission.

### Semantic state

- hydration event;
- reminder;
- pending payment journey edge;
- approval request;
- accepted project constraint.

Evidence may change or be superseded.

Semantic state has identity and a mutation history.

## Semantic-change request

A useful JEV state for incremental input is:

~~~text
CURRENT WORLD/ACTIVE STATE
+
NEW INPUT
+
RECENT INPUT WINDOW
+
RELEVANT EVIDENCE/METADATA
~~~

Question family:

- new event vs continuation vs correction vs cancel vs aside?
- which active event is the target?
- complete enough?
- stable enough for draft/soft-commit/seal?

## Example: correction

Current state:

~~~json
{
  "id": "evt_1",
  "type": "hydration",
  "fields": {
    "amountMl": 200,
    "drink": "Coke"
  },
  "status": "draft"
}
~~~

New speech:

~~~text
"ah no, I mean water"
~~~

JEV supplies:

~~~text
relation = correction
target = evt_1
~~~

Application code performs:

~~~text
PATCH evt_1
drink: Coke -> water
version: 1 -> 2
~~~

The UI uses the same event ID, so the same card updates in place.

## Example: new event while another remains active

Current events:

- evt_1 hydration;
- evt_2 parcel task.

New speech:

> "also remind me about my medicine"

JEV can select new_event.

The runtime creates evt_3 without closing evt_1 or evt_2 unless separate completion logic says they should close.

This is how one input supports many simultaneous intents.

## Hysteresis

Streaming input is noisy.

Without hysteresis:

~~~text
task -> reminder -> task -> journal -> task
~~~

could cause cards to flicker.

Policy can require:

- confidence margin over current interpretation;
- repeated wins;
- stable transcript boundary;
- explicit correction phrase;
- final segment.

Do not make these thresholds part of the JEV instructions. Keep them in application policy.

## Correction horizon

A soft-committed event may remain patchable for a short semantic horizon.

The horizon is not necessarily a fixed number of seconds.

It can be bounded by:

- subsequent topic change;
- event sealing;
- external execution;
- explicit confirmation;
- end-of-turn plus grace window.

Once a consequential action has executed, a later correction must become a **new corrective action**, not a silent historical rewrite.

## UI projection

The UI should be a projection of typed semantic state.

Example registry:

~~~ts
type CardRenderer = {
  supports(event: SemanticEvent): boolean;
  render(event: SemanticEvent): UiNode;
};

const cardRegistry = [
  hydrationCard,
  taskCard,
  reminderCard,
  approvalCard,
  journalCard,
  genericEventCard,
];
~~~

The model/JEV selects meaning, not arbitrary frontend code.

## Controlled generative UI

Later, JEV/LLM output can choose among typed UI primitives:

- card;
- comparison;
- table;
- form;
- timeline;
- state graph;
- approval;
- progress;
- evidence drawer.

The generated output should reference schemas/components, not executable HTML/JS.

## AG-UI boundary

AG-UI can be useful as an event protocol between backend runtime and frontend.

Potential events:

- transcript.changed;
- semantic.event.created;
- semantic.event.patched;
- approval.requested;
- tool.started;
- tool.completed;
- ui.proposal;
- response.delta.

But AG-UI should carry our domain events; it should not become the domain model.

## CopilotKit position

CopilotKit may later help with:

- typed actions;
- human-in-the-loop UI;
- generative UI;
- agent-state rendering.

Do not add it until these primitives demonstrably reduce implementation effort.

The first POC should keep the event/state model visible and application-owned.

## Persistence

We do not need a full event-sourcing framework.

Initially persist:

- current event JSON;
- event version;
- meaningful mutation records in trace_events;
- source/correlation IDs.

If replay/rebuild becomes a real requirement, we can promote mutation history into a first-class event store later.

## Inspector projection

Inspector mode should show state evolution:

~~~text
evt_hydration_1

v1 CREATE
   drink = Coke
   amountMl = 200

v2 PATCH
   reason = semantic correction
   drink = water

v3 SEAL
   completion probability = ...
   policy = seal
~~~

This is more useful than dumping model prompts or chain-of-thought.
