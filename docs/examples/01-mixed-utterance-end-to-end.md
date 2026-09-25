# Example: mixed voice utterance end to end

> **Status:** Reference scenario / eval seed  
> **Purpose:** Make the abstract JEV + voice architecture concrete.

## Scenario

The user speaks naturally, changes their mind, mixes tasks and emotions, and does not wait for the system between intents.

Illustrative utterance:

> "Ahh today... I drank 200 ml Coke... ah no, no, I mean water, and I need to pick up my parcel from Australia Post at 2 pm, remind me to take my medicine, by the way today is the happiest day of my life... really, I got my dream car delivered, I need to pinch myself, but I'm also very sad because I have to let go of my previous car..."

We do **not** want to send the entire final paragraph to one LLM and hope it produces the right actions.

We also do **not** want one JEV call per token.

## Desired final semantic state

Possible end state:

~~~json
{
  "events": [
    {
      "id": "evt_hydration_1",
      "type": "hydration",
      "status": "sealed",
      "quantityMl": 200,
      "drink": "water"
    },
    {
      "id": "evt_parcel_1",
      "type": "task",
      "status": "soft_committed",
      "title": "Pick up Australia Post parcel",
      "time": "14:00"
    },
    {
      "id": "evt_medicine_1",
      "type": "reminder",
      "status": "draft",
      "title": "Take medicine",
      "time": null
    },
    {
      "id": "evt_journal_1",
      "type": "journal",
      "status": "soft_committed",
      "facts": [
        "Dream car delivered",
        "Happy about new car",
        "Sad about letting previous car go"
      ]
    }
  ]
}
~~~

Notice that the medicine reminder is incomplete if no time/default policy is available.

## Timeline

### T0 — speech starts

Voice adapter emits:

~~~text
speech.started
~~~

No semantic action yet.

### T1 — "today I drank 200 ml Coke"

Transcript Ledger:

~~~text
r1: "today I drank 200 ml Coke"
~~~

A semantic checkpoint occurs because there is a stable phrase boundary.

JEV state:

~~~json
{
  "request": {
    "text": "today I drank 200 ml Coke",
    "source": "voice"
  },
  "activeEvents": [],
  "runtime": {
    "stage": "semantic_update"
  }
}
~~~

Possible JEV questions:

- Is this a new event, continuation, correction, aside?
- Which domain best fits: hydration/food/task/reminder/journal/other?
- Is the information complete enough to materialize a provisional event?
- Draft / soft-commit / wait?

Policy result:

~~~text
CREATE evt_hydration_1 as draft
~~~

The UI shows:

~~~text
Hydration
200 ml Coke
draft
~~~

No external tool is needed.

### T2 — "ah no, no, I mean water"

The transcript may be represented as a provider revision, a new final segment, or both.

The important application evidence is:

~~~text
new speech: "ah no, no, I mean water"
active event: evt_hydration_1 = 200 ml Coke
~~~

JEV questions:

- semantic relationship;
- target active event;
- correction confidence;
- stability.

Expected semantic decision:

~~~text
relation = correction
target = evt_hydration_1
~~~

Deterministic state mutation:

~~~text
PATCH evt_hydration_1
  drink: Coke -> water
~~~

Do **not** create a second hydration event.

The UI morphs in place.

### T3 — "and I need to pick up my parcel from Australia Post at 2 pm"

A new intent begins.

JEV:

~~~text
relation = new_event
domain = task
complete = likely yes
~~~

Deterministic/domain parsing extracts:

- title;
- 14:00 local time.

State:

~~~text
CREATE evt_parcel_1
~~~

Whether this immediately creates a system reminder/calendar item is a separate policy/tool step.

The semantic event can exist without executing a tool.

### T4 — "remind me to take my medicine"

JEV:

~~~text
new_event
domain = reminder
~~~

But a required time may be absent.

Question:

"Is there enough stable information to execute a reminder under current reminder policy?"

If no default exists:

~~~text
actionable_complete = low
commit_state = draft
~~~

The UI can show:

~~~text
Reminder
Take medicine
Needs a time
~~~

The application can wait until the user pauses/finishes before asking one concise clarification.

### T5 — "today is the happiest day of my life... I got my dream car delivered"

New journal/emotion event.

This may not require a tool.

JEV can classify:

- new event;
- journal/reflection domain;
- emotional significance if the product needs it;
- stable enough for provisional state.

An LLM might later be used to create a polished journal summary, but it does not need to be on the hot path to determine that this is a reflection event.

### T6 — "but I'm also very sad because I have to let go of my previous car"

This is probably a continuation of the same journal event, not a contradictory replacement.

JEV sees:

- active journal event;
- new text;
- recent transcript.

Decision:

~~~text
relation = continuation
target = evt_journal_1
~~~

State is patched with mixed emotion/fact.

## End of turn

At speech end, run completion checks per active event.

### Hydration

Stable and self-contained.

Seal.

### Parcel task

Semantic event is complete.

If there is an external reminder/task side effect, tool policy decides whether to execute or confirm.

### Medicine reminder

Incomplete.

Ask for time or apply a preconfigured default only if a deterministic product rule permits it.

### Journal

Stable.

Persist according to user/product settings.

## Where an LLM is needed

Potentially:

- phrase a friendly clarification;
- produce a polished journal narrative;
- answer an open-ended question if the user asks one.

Not needed merely to:

- recognize correction;
- distinguish new event vs continuation;
- choose active event;
- classify reminder/task/journal;
- decide whether required data is present.

## Inspector timeline

A useful Inspector view:

~~~text
00:00.000 speech.started

00:00.820 transcript.partial
           "today I drank 200 ml..."

00:01.450 transcript.final
           "today I drank 200 ml Coke"

00:01.470 semantic_checkpoint #1

00:01.560 jev.semantic_update
           relation: new_event
           domain: hydration
           commit: draft

00:01.580 state.create
           evt_hydration_1

00:02.200 transcript.partial
           "ah no no..."

00:02.830 transcript.final
           "ah no no I mean water"

00:02.850 semantic_checkpoint #2

00:02.930 jev.semantic_update
           relation: correction
           target: evt_hydration_1

00:02.950 state.patch
           drink Coke -> water
~~~

This scenario should become an eval/fixture when implementation starts.
