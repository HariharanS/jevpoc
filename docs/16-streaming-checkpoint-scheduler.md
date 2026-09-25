# Streaming input and semantic checkpoint scheduler

> **Status:** Normative runtime design  
> **Purpose:** Explain how continuous voice/"yapping" becomes useful JEV decisions without calling JEV or an LLM on every transcript token.

## The important clarification

The stage previously called **deterministic normalization** is not meant to understand what the user means.

It is only **input/event bookkeeping**.

A clearer name is:

> **Input Event Envelope / Event Normalization**

The first semantic intelligence in the control-first path is JEV.

The runtime should therefore be understood as:

~~~text
CONTINUOUS VOICE / TEXT
        |
        v
STT / input source
        |
        v
INPUT EVENT ENVELOPE
  - sessionId
  - utteranceId
  - transcript revision
  - timestamp
  - source
  - known permissions
  - available tools
  - active state ids
        |
        v
TRANSCRIPT / INPUT LEDGER
        |
        v
SEMANTIC CHECKPOINT SCHEDULER
        |
        | "is it worth asking JEV now?"
        v
       JEV
  semantic decision
        |
  +-----+-------------------+
  |                         |
  v                         v
WAIT / MUTATE STATE     ROUTE TO LLM
                            |
                            v
                    open-ended reasoning
~~~

## What is deterministic before JEV?

Only facts the application already knows exactly.

Examples:

- session ID;
- user/actor ID;
- input source = voice/text/UI;
- utterance ID;
- transcript revision number;
- timestamp;
- whether the provider marked a segment partial/final;
- known permission/role information;
- registered tools;
- current active SemanticEvent IDs;
- workflow state IDs;
- correlation/trace IDs.

Example event:

~~~json
{
  "sessionId": "s123",
  "utteranceId": "u8",
  "source": "voice",
  "revision": 17,
  "text": "today I drank 200 ml coke",
  "isFinal": false,
  "timestamp": 1790300000000,
  "knownPermissions": ["create_reminder"],
  "availableTools": ["create_reminder", "create_task"],
  "activeEventIds": ["evt_parcel_123"]
}
~~~

Nothing in that envelope says what the sentence **means**.

Do not ask JEV to rediscover facts that code already knows.

## STT is already an AI component

The control-first pipeline is not:

~~~text
voice -> dumb code -> JEV
~~~

It is more accurately:

~~~text
voice
  |
  v
STT model
  |
  | partial / revised / final transcript evidence
  v
cheap deterministic coordination
  |
  v
JEV
  |
  | bounded semantic intelligence
  v
policy
  |
  +--> deterministic state/action
  |
  +--> LLM when open-ended reasoning/generation is needed
~~~

The architecture intentionally uses different amounts of intelligence at different stages.

## Why we need a checkpoint scheduler

If the user speaks for 60–90 seconds continuously, two naive designs are both bad.

### Bad option A — process every transcript delta

~~~text
"today"
   -> JEV/agent

"today I"
   -> JEV/agent

"today I drank"
   -> JEV/agent

...
~~~

Problems:

- high call volume;
- unstable interpretations;
- UI flapping;
- unnecessary latency/cost;
- repeated state mutations;
- hard-to-debug traces.

### Bad option B — wait for the entire final utterance

~~~text
90 seconds of speech
       |
       v
one giant final transcript
       |
       v
first semantic processing
~~~

Problems:

- no live/morphing UI;
- corrections cannot update provisional state as they happen;
- action candidates arrive too late;
- long turns become harder to decompose;
- the user receives no useful feedback while speaking.

## Scheduler responsibility

The **Semantic Checkpoint Scheduler** answers only:

> Has enough potentially useful new evidence accumulated that it is worth asking JEV?

It does **not** decide:

- what the user means;
- whether this is a correction;
- which event is affected;
- whether an action is complete;
- which tool should execute.

Those are JEV/policy responsibilities.

## Hybrid checkpoint strategy

For the POC, use a hybrid of cheap mechanical signals.

A checkpoint can be created when **any** useful trigger fires:

- provider marks a segment stable/final;
- meaningful pause/VAD boundary;
- enough new words/chars/tokens have accumulated;
- maximum time since the last checkpoint is reached;
- an explicit correction *hint* appears;
- speech ends;
- user performs an explicit UI commit/submit.

But suppress the checkpoint if:

- almost nothing has changed;
- this exact transcript revision was already processed;
- the change is only provider formatting/punctuation noise;
- a previous checkpoint is still in flight and coalescing is safer.

Illustrative policy only:

~~~text
checkpoint when:
  stable segment
  OR pause >= ~400-800ms
  OR >= ~15-30 useful new words
  OR >= ~1.5-2.5s since last checkpoint
  OR correction hint
  OR speech ended

unless:
  semantic delta is trivial
  OR revision already processed
~~~

These values are **not final product constants**. They must be tuned from traces/evals.

## Correction hints are triggers, not semantic decisions

Cheap lexical hints can accelerate a checkpoint:

- "no";
- "actually";
- "I mean";
- "sorry";
- "scratch that";
- "instead".

But:

~~~text
hint detected
    |
    v
ASK JEV SOONER
~~~

not:

~~~text
hint detected
    |
    v
blindly PATCH previous event
~~~

Example:

> "No, actually my wife said it is fine."

The word "actually" does not prove a correction to a structured event. It only indicates potentially important new evidence.

JEV still decides the semantic relationship.

## Checkpoint coordinator pseudo-code

~~~ts
function shouldCheckpoint(
  event: SpeechEvent,
  ledger: TranscriptLedger,
  checkpointState: CheckpointState,
): CheckpointDecision {
  if (event.type === "speech.ended") {
    return { create: true, reason: "speech-ended" };
  }

  if (event.type === "transcript.final") {
    return { create: true, reason: "stable-segment" };
  }

  const delta = ledger.deltaSince(checkpointState.lastRevision);

  if (delta.isTrivial) {
    return { create: false };
  }

  if (delta.hasCorrectionHint) {
    return { create: true, reason: "correction-hint" };
  }

  if (delta.wordCount >= checkpointState.wordThreshold) {
    return { create: true, reason: "word-threshold" };
  }

  if (delta.elapsedMs >= checkpointState.maxCheckpointIntervalMs) {
    return { create: true, reason: "max-interval" };
  }

  return { create: false };
}
~~~

This scheduler is deliberately simple.

Do not introduce another LLM merely to decide when to call JEV.

## What JEV receives at a checkpoint

The scheduler creates a bounded **semantic checkpoint**, not a whole-session dump.

Example:

~~~text
NEW EVIDENCE
"ah no, I mean water"

ROLLING TRANSCRIPT TAIL
"today I drank 200 ml Coke ... ah no, I mean water"

ACTIVE STATE
evt_hydration_1
  domain = hydration
  drink = Coke
  amountMl = 200
  status = draft

RUNTIME METADATA
source = voice
utteranceId = u8
revision = 23
~~~

Then JEV can answer bounded questions such as:

~~~text
semantic_relation:
  new_event
  continuation
  correction
  cancel
  aside
  unclear

target_event:
  evt_hydration_1
  none

commit_state:
  draft
  soft_commit
  seal
  wait
~~~

Application code owns the resulting CREATE/PATCH/MERGE/SEAL mutation.

## Continuous-yapping walkthrough

### Speech fragment 1

User:

> "Today I drank..."

STT:

~~~text
today I drank
~~~

Scheduler:

~~~text
too little/still changing -> WAIT
~~~

No JEV call required.

### Speech fragment 2

User continues:

> "...200 ml Coke"

STT stabilizes:

~~~text
today I drank 200 ml Coke
~~~

Scheduler:

~~~text
stable segment -> checkpoint #1
~~~

JEV may decide:

~~~text
relation = new_event
domain = hydration
commit = draft
~~~

Application:

~~~text
CREATE evt_hydration_1
drink = Coke
amountMl = 200
status = draft
~~~

UI can already show a provisional card.

### Speech fragment 3

User:

> "...ah no, no, I mean water"

Scheduler may trigger early because of a correction hint or stable segment.

JEV sees active hydration state and may decide:

~~~text
relation = correction
target = evt_hydration_1
~~~

Application:

~~~text
PATCH evt_hydration_1
drink: Coke -> water
~~~

Same event ID; same UI card morphs.

### Speech fragment 4

User:

> "...and I need to pick up my parcel from Australia Post at 2pm"

Next checkpoint.

JEV:

~~~text
relation = new_event
domain = task
complete = high
~~~

Application:

~~~text
CREATE evt_parcel_1
~~~

The hydration event can remain active/sealed independently.

### Speech fragment 5

User:

> "...remind me about my medicine"

JEV can create a reminder candidate while still judging it incomplete if the product requires a time.

The runtime should **not interrupt the user immediately** just because one candidate is missing a field.

It can wait until:

- the user supplies the missing detail later;
- speech ends;
- a natural clarification point occurs.

This is important for conversational/yapping UX.

## Trade-offs

| Checkpoint strategy | Advantage | Cost / risk |
|---|---|---|
| Every STT partial | Fastest reaction | Too many calls, unstable, expensive/noisy |
| Final transcript only | Simplest/cheapest | High latency, no live state/UI |
| Pause/VAD only | Simple natural boundaries | Continuous speech may wait too long |
| Fixed timer | Predictable | Splits semantic units arbitrarily |
| Word/token threshold | Cheap/provider-neutral | Not semantically aware |
| Provider semantic endpointing | Better boundaries | Provider coupling/behavior differences |
| **Hybrid scheduler** | Best practical balance | Slightly more coordinator logic/tuning |

The hybrid scheduler is the current design direction.

## The alternative: LLM immediately after STT

A valid simpler architecture is:

~~~text
voice
  -> STT
  -> LLM
  -> structured output
  -> state/actions/UI
~~~

This must remain an explicit benchmark alternative.

### LLM-first strengths

- excellent open-ended understanding;
- very flexible;
- less up-front question design;
- new domains can work with fewer explicit classifiers.

### LLM-first weaknesses

- more expensive frequent streaming calls;
- higher latency;
- less predictable state mutation;
- harder to reason about incremental checkpoints;
- more temptation to let model output become business logic;
- less explicit observability/calibration.

### JEV control-plane strengths

- fast bounded decisions;
- explicit question/answer telemetry;
- lower-cost frequent semantic checks;
- deterministic state/action boundary;
- easier calibration around specific decisions.

### JEV control-plane weaknesses

- question families must be designed;
- new semantic categories require explicit modeling;
- too many JEV calls can still create latency/complexity;
- a badly designed checkpoint policy can feel either twitchy or sluggish.

The POC should **measure** this rather than assume JEV is always better.

## Recommended hybrid intelligence model

The most promising design is:

~~~text
                   STT
                    |
                    v
          checkpoint scheduler
                    |
        +-----------+------------+
        |                        |
        v                        v
known bounded decision     open-ended/unknown
        |                        |
        v                        v
       JEV                      LLM
        |                        |
        +-----------+------------+
                    |
                    v
              semantic state
                    |
                    v
             policy / tools / UI
~~~

JEV is used for questions it is naturally suited to:

- new vs continuation vs correction;
- target active event;
- completeness;
- risk/approval signal;
- model class;
- goal completion;
- memory scope.

An LLM is used for:

- open-ended reasoning;
- synthesis;
- novel intent that has no bounded decision model yet;
- prose/code generation;
- large-document candidate generation.

## Routing to the LLM

At a semantic checkpoint, JEV can include a bounded question such as:

~~~text
Does satisfying this semantic task require open-ended reasoning/generation
rather than a known deterministic/typed handler?
~~~

Policy can then route:

~~~text
JEV says bounded/known
  -> semantic state / deterministic handler

JEV says reasoning needed
  -> selected LLM/harness

JEV says unclear / user still speaking
  -> wait
~~~

This avoids forcing every utterance into a predefined event taxonomy.

## Observability requirements

Inspector mode should make checkpoint behavior visible.

For each checkpoint record:

- trigger reason;
- transcript revision range consumed;
- elapsed time since previous checkpoint;
- number of new words/chars;
- whether a correction hint was present;
- JEV latency;
- JEV questions/answers;
- resulting policy action;
- resulting state mutation;
- whether an LLM was routed.

Example:

~~~text
00:01.470 semantic_checkpoint #1
  reason: stable-segment
  revisions: 12..17
  newWords: 6

00:01.560 jev.semantic_update
  relation: new_event
  domain: hydration
  commit: draft

00:02.850 semantic_checkpoint #2
  reason: correction-hint
  revisions: 18..23
  newWords: 6

00:02.930 jev.semantic_update
  relation: correction
  target: evt_hydration_1
~~~

## Evals for checkpoint scheduling

Create a small recorded-transcript fixture suite.

Examples:

- short command;
- 60-second continuous monologue;
- rapid correction: "Coke ... no, water";
- several intents without long pauses;
- filler-heavy speech;
- provider transcript revisions;
- user pauses mid-thought;
- explicit cancellation;
- unrelated philosophical/open-ended question.

Measure:

- JEV calls per minute;
- checkpoint-to-useful-state latency;
- false/duplicate event creation;
- UI flapping;
- correction patch accuracy;
- missed intent boundaries;
- unnecessary LLM routes;
- end-to-end cost.

The scheduler is a **runtime tuning problem**, not a one-time architectural constant.

## Current decision

For the first control-first voice implementation:

1. keep event normalization dumb/deterministic;
2. maintain a revision-aware Transcript Ledger;
3. use a small hybrid checkpoint scheduler;
4. make JEV the first semantic decision layer;
5. route to an LLM only when JEV/policy determines open-ended reasoning is useful;
6. keep state mutation and action execution deterministic;
7. expose scheduler/JEV behavior in Inspector mode;
8. benchmark this against the simpler LLM-first alternative.

This preserves the main JEV hypothesis without pretending that heuristics alone can understand continuous natural speech.
