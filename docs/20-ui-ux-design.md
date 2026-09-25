# UI / UX design for the JEV POC

> **Status:** Normative product design for the first implementation
> **Purpose:** Give coding agents a concrete developer/Lab screen model rather than leaving "the UI" as an unspecified React app.

> **Important:** This document describes the expanded Lab/developer presentation. It is **not** the default end-user screen. Read [21 — Core app experience](21-core-app-experience.md) first.

## Visual references

Preferred product/taste reference:

[docs/ui/taste-reference-v2.svg](ui/taste-reference-v2.svg)

Expanded developer/Lab reference:

[docs/ui/lab-layout.svg](ui/lab-layout.svg)

Read [22 — Visual design system and taste](22-visual-design-system-and-taste.md) before styling the implementation.

These are direction references, not pixel-perfect design systems.

## Role of this view

The three-column layout is an **expanded development/demo state inside the app**.

It appears when Processing/Developer details are enabled.

The normal product remains voice orb + intent cards, with transcript/processing progressively disclosed.

See [21-core-app-experience.md](21-core-app-experience.md).

## Design goal

When expanded, the UI should make the core idea visible:

> **raw language becomes interpreted state, then typed cards/events.**

The normal experience should still feel calm and conversational.

The lab experience should make the transformation inspectable.

## Two modes, one runtime

### App mode

A clean end-user experience:

- text input;
- voice orb;
- live transcript;
- semantic cards/events;
- clarification/approval UI;
- assistant responses where needed.

No developer telemetry clutter.

### Developer details enabled

Same session and same runtime, toggled within the app, exposes:

- raw streaming transcript;
- revisions;
- checkpoint triggers;
- Jev questions/answers;
- policy decisions;
- model/tool calls;
- event mutations;
- latency/cost;
- trace timeline.

The user can toggle developer details without restarting or navigating away from the session. The trace is a feature toggle/overlay, not a separate core product destination.

## Desktop layout

The first useful lab layout is a **three-column semantic pipeline plus a collapsible Inspector drawer**.

~~~text
+--------------------------------------------------------------------------------------+
| JEV POC   Session: demo-01     [ Text ] [ Voice ]       [ App | Lab ]   Settings     |
+--------------------------------------------------------------------------------------+
|                    |                            |                                     |
|  INPUT STREAM      |  PROCESSING / CONTROL      |  INTENT CANVAS                     |
|                    |                            |                                     |
|     (voice orb)    |  Checkpoint #12            |  Hydration                         |
|       ◉            |  reason: stable segment    |  +-----------------------------+  |
|                    |                            |  | 200 ml Water              ✓  |  |
|  live transcript   |  Jev                      |  +-----------------------------+  |
|  ----------------  |  relation: correction     |                                     |
|  today I drank...  |  target: hydration_1      |  Parcel                             |
|  200 ml Coke       |  complete: 0.94           |  +-----------------------------+  |
|  no I mean water   |                            |  | Pick up parcel             |  |
|                    |  Policy                    |  | 2:00 PM                     |  |
|  revisions         |  PATCH evt_hydration_1     |  +-----------------------------+  |
|  r17 Coke          |                            |                                     |
|  r18 Coke... no    |  LLM                      |  Reminder                           |
|  r19 Water         |  skipped                   |  +-----------------------------+  |
|                    |                            |  | Take medicine               |  |
|                    |                            |  | Needs a time          DRAFT |  |
|                    |                            |  +-----------------------------+  |
+--------------------+----------------------------+-------------------------------------+
| INSPECTOR TIMELINE / TRACE (collapsible)                                               |
|  12:01.120 transcript.final  -> 12:01.140 checkpoint -> 12:01.206 Jev -> 12:01.212 PATCH|
+--------------------------------------------------------------------------------------+
|  Type or speak...                                                     [ mic ] [ send ] |
+--------------------------------------------------------------------------------------+
~~~

This is the primary desktop implementation target.

## Why three columns

The three columns correspond to the mental model:

~~~text
WHAT ARRIVED
     |
     v
WHAT THE SYSTEM DECIDED
     |
     v
WHAT THE APPLICATION NOW BELIEVES / SHOWS
~~~

That is more useful for this POC than a conventional chat transcript with invisible orchestration.

## Column 1 — Input Stream

### Purpose

Show evidence, not interpretation.

### Components

#### Voice orb

A central orb/globe inspired by modern realtime voice interfaces.

States:

~~~text
idle
listening
speech_detected
processing
speaking
interrupted
error
~~~

Do not make the orb provider-specific.

The orb is driven by canonical runtime state.

Suggested behavior:

- idle: subtle breathing animation;
- listening: expands/reacts to microphone level;
- speech_detected: stronger pulse;
- processing: slower rotating/glowing state;
- speaking: output audio-reactive animation;
- interrupted: rapid contraction/fade;
- error: static state + concise message.

Avoid excessive particle effects. The POC should feel polished but readable.

#### Input mode switch

~~~text
[ Text ] [ Voice ]
~~~

Text mode:
- ordinary expanding composer;
- submit button.

Voice mode:
- click orb/mic to start;
- click to stop;
- optionally push-to-talk later.

#### Raw transcript lane

Show the current materialized transcript.

Partial text can use reduced opacity.

Example:

~~~text
today I drank 200 ml Coke...
ah no, I mean water...
and I need to pick up my parcel...
~~~

#### Revision lane

Lab mode only.

Compact timeline:

~~~text
r17  200 ml Coke
r18  200 ml Coke ... no
r19  200 ml Water
~~~

Provider raw events are hidden behind an expandable details control.

## Column 2 — Processing / Control Plane

### Purpose

Make the semantic pipeline understandable without dumping raw logs.

Each semantic checkpoint becomes a compact block.

Example:

~~~text
Checkpoint #12
Stable segment · 6 new words · 720 ms since previous

JEV
relation
  correction        95%
  continuation       3%
  new event          1%
  aside              1%

target
  evt_hydration_1   98%

complete
  P(true)            94%

POLICY
PATCH evt_hydration_1

LLM
skipped
~~~

### Default view

Show only:

- checkpoint reason;
- Jev top answer(s);
- resulting policy action;
- LLM/tool route.

### Expanded view

Show:

- full Jev state snapshot;
- question set/version;
- all probabilities;
- model version;
- latency;
- usage/cost;
- threshold/hysteresis calculation.

Do not display private model chain-of-thought.

## Column 3 — Intent Canvas

### Purpose

Show the application state the user actually cares about.

Cards are keyed by SemanticEventId and update in place.

### Initial card types

For the first demo only:

- Hydration;
- Task;
- Reminder;
- Journal / Reflection;
- Generic Event fallback.

Do not build a universal card framework first.

### Card states

Use small state badges:

~~~text
DRAFT
PENDING
SEALED
NEEDS INFO
AWAITING APPROVAL
DONE
CANCELLED
~~~

### Correction animation

When Coke -> Water changes:

- keep the same card position and ID;
- briefly highlight changed field;
- optionally show a small "corrected" history affordance;
- do not animate in a brand-new card.

### Missing-information card

Example:

~~~text
Reminder                           DRAFT
Take medicine

Needs:
[ time ]

[ Add time ]
~~~

This gives the user a direct UI path instead of requiring another chat turn.

## Inspector drawer

The bottom drawer is a **timeline**, not another giant log panel.

Default collapsed height:
- 48-64 px.

Expanded:
- ~35-45% viewport height.

### Timeline rows

~~~text
input
STT
checkpoint
Jev
policy
state mutation
LLM
tool
approval
memory
response
~~~

Use icons/labels and timing.

Example:

~~~text
0ms     transcript.final
14ms    checkpoint.created
83ms    jev.completed
90ms    policy.decided
94ms    state.patched
~~~

Clicking a timeline item opens a detail side sheet.

## Detail side sheet

Use for deep debugging:

~~~text
Event: jev.completed
Question set: voice_semantic_update_v1
Jev model: jev-1.13.0
Latency: 69 ms

State
{ ... }

Questions
{ ... }

Answers
{ ... }

Policy inputs
{ ... }
~~~

This prevents the center Processing column from becoming unreadable.

## Top bar

Keep it functional:

~~~text
JEV POC
Session
Demo scenario selector
Provider status
App / Lab toggle
Reset
Settings
~~~

Provider status can be compact:

~~~text
Jev: connected
STT: simulated
LLM: disabled
~~~

Later:

~~~text
STT: Deepgram Flux
Voice: OpenAI Realtime
LLM: OpenAI
~~~

## Demo scenario selector

For agent development and presentations, include:

~~~text
Demo:
- Mixed intent + correction
- Long yapping monologue
- Incomplete reminder
- Open-ended reasoning route
- Jev unavailable fallback
~~~

Selecting a demo can:

- load text chunks;
- replay transcript fixture timing;
- avoid microphone/provider dependencies.

This makes the POC deterministic enough to demo and test.

## Voice-input visual direction

The orb should feel closer to a premium assistant than a debug waveform.

Possible first implementation:

~~~text
             .-~~~~~~~~~-.
          .-'             '-.
        .'       soft        '.
       /        moving         \
      |         glow /          |
      |          orb            |
       \                       /
        '.                   .'
          '-._____________.-'
~~~

Under it:

~~~text
Listening...
00:12

[ Stop ]
~~~

Use CSS/SVG/canvas before introducing Three.js.

Three.js is not needed for the first orb.

## App mode layout

Hide most lab detail.

~~~text
+------------------------------------------------------------+
|                         voice orb                          |
|                                                            |
|  "today I drank 200 ml ... no, water..."                  |
|                                                            |
|  + Hydration: 200 ml Water                                |
|  + Parcel: Pick up at 2pm                                 |
|  + Reminder: Take medicine — needs time                   |
|                                                            |
|                                    [ type or speak... ]    |
+------------------------------------------------------------+
~~~

The user should not need to understand Jev to use the app.

## Lab mode layout

Use the three-column design.

This is the mode we should optimize for the POC because it visually proves the architecture.

## Responsive behavior

### Wide desktop >= 1200px

Three columns + bottom Inspector.

Suggested widths:

~~~text
Input         26%
Processing    32%
Intent Canvas 42%
~~~

### Tablet / narrow desktop

Two panes with tabs:

~~~text
[ Input + Processing ] [ Intent Canvas ]

Inspector remains bottom drawer.
~~~

### Mobile

Do not attempt three simultaneous columns.

Use tabs:

~~~text
[ Input ] [ State ] [ Inspector ]
~~~

Voice orb is the default Input view.

## Component tree

Suggested React structure:

~~~text
AppShell
  TopBar
  Workspace
    InputPane
      VoiceOrb
      InputModeSwitch
      TranscriptView
      RevisionList
    ProcessingPane
      CheckpointList
        CheckpointCard
          JevDecisionSummary
          PolicyDecision
          RouteSummary
    IntentCanvas
      SemanticEventCard[]
  InspectorDrawer
    TraceTimeline
    TraceDetailSheet
  Composer
~~~

Keep state/data access outside visual components.

## Frontend state

Server/application state is authoritative.

Frontend may hold transient UI state:

- selected pane;
- Inspector open/closed;
- selected trace event;
- orb animation state;
- unsubmitted composer text.

SemanticEvent state comes from API/runtime events.

Do not let React component local state become a second semantic source of truth.

## Live update event shape

Frontend can consume canonical application events over SSE/WebSocket.

Examples:

~~~text
trace.appended
semantic_event.created
semantic_event.patched
semantic_event.sealed
approval.requested
run.completed
~~~

The first implementation can derive card updates from trace events or expose a small session-state stream; do not invent a second agent protocol yet.

## Color / visual semantics

Do not make confidence a red/green "truth meter".

Use neutral visual hierarchy.

Suggested semantic meanings:

- draft: muted/dotted;
- needs info: amber-style attention;
- sealed/done: normal solid;
- error/denied: error treatment;
- actively patched: brief highlight.

Exact brand colors are not an architecture decision.

## Important interaction: yapping without interruption

While the user talks continuously:

- transcript keeps streaming;
- provisional cards may appear;
- cards may PATCH;
- missing-information cards should not interrupt voice immediately;
- clarifications queue until a natural speech boundary/end of turn;
- Processing column can show WAIT decisions without speaking them.

This UI behavior is essential to making the checkpoint scheduler feel natural.

## First UI implementation scope

Build:

1. fixed desktop three-column shell;
2. text input;
3. simulated streaming fixture player;
4. raw transcript view;
5. checkpoint cards;
6. SemanticEvent cards;
7. bottom Inspector timeline;
8. App/Lab toggle;
9. placeholder animated orb with states;
10. real microphone only when the semantic UI works.

Do not start by polishing audio visualizations before the state flow is functional.

## POC visual acceptance criteria

A reviewer watching the mixed-intent demo should be able to understand, without reading code:

1. what the user said;
2. where the system chose to process it;
3. what Jev decided;
4. whether an LLM was called;
5. what typed event/card changed;
6. how a correction updated rather than duplicated state;
7. the latency/order of events.

If the screen cannot communicate those seven things, the POC is not visually proving its thesis.
