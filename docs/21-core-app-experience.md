# Core app experience and progressive disclosure

> **Status:** Normative product/UX direction
> **Purpose:** Clarify the difference between the actual end-user app and developer/debug views.

## Product hierarchy

The application is **not** primarily:

- a trace viewer;
- a transcript viewer;
- a JEV dashboard;
- a developer console.

Those are support layers.

The core product is:

~~~text
VOICE / TEXT INPUT
      |
      v
LIVE INTENT WORKSPACE
      |
      v
CARDS / ACTIONS / STATE
~~~

The primary visual language is:

1. **Voice orb / composer**
2. **Live intent cards**
3. **Optional transcript**
4. **Optional processing details**
5. **Optional developer trace**

The farther down this list, the less visible it should be by default.

## Default app experience

The normal user should mainly see:

~~~text
            VOICE ORB
                |
                v

       "Listening..." / text input

        [ Hydration card ]
        [ Parcel card    ]
        [ Reminder card  ]
        [ Journal card   ]
~~~

The product should feel closer to:

- ChatGPT voice;
- Apple system surfaces;
- Notion;
- a clean personal workspace;

than to an observability dashboard.

The UI should use generous spacing, subtle motion, neutral surfaces and very little persistent chrome.

## Voice is permanent / primary

Voice is not hidden behind a settings screen.

On desktop and mobile, the orb should always have a clear, primary affordance.

Possible states:

~~~text
idle
listening
hearing speech
processing
speaking
interrupted
error
~~~

The orb is provider-neutral and represents **the app**, not OpenAI/Gemini/Grok.

Text remains available as a secondary path.

## Intent cards are the main output

The user does not need to read a transcript to know what the system understood.

The main proof of understanding is the **state/cards**:

~~~text
Hydration
200 ml Water
Corrected

Parcel
Pick up at 2:00 PM

Reminder
Take medicine
Needs time

Journal
Dream car arrived
happy + sad
~~~

Cards keep stable SemanticEvent IDs and update in place.

## Transcript is optional / contextual

The transcript is useful, but it should not permanently dominate the screen.

### Default behavior

Show a compact live transcript ribbon or 1-3 recent lines near the orb.

Example:

~~~text
today I drank 200 ml Coke...
no, make that water...
pick up my parcel at 2...
~~~

### Expanded behavior

Tap/click the transcript to reveal:

- full streaming text;
- revisions;
- timestamps;
- raw provider metadata only in developer mode.

### Hide behavior

The transcript can be collapsed completely.

The app should still make sense from cards alone.

## Processed-text visualization

For the POC, processed text can visually show progress.

Suggested semantics:

~~~text
unprocessed / still streaming
  -> neutral grey

checkpoint created / being interpreted
  -> subtle blue/purple

successfully mapped into state
  -> soft green

superseded by correction
  -> muted / struck-through / replaced

needs clarification
  -> soft amber underline/chip
~~~

Example:

~~~text
today I drank 200 ml Coke
~~~~~~~~~~~~~~~~~~~~~~~~ neutral while streaming

today I drank 200 ml Coke
^^^^^^^^^^^^^^^^^^^^^^^^ mapped / green

no, I mean water
^^^^^^^^^^^^^^^^ green after PATCH

Coke
~~~~ muted / superseded
~~~

Do not make the entire interface look like a syntax highlighter.

The effect should be subtle and temporary.

## Processing details are optional

Most users do not need to see:

~~~text
Checkpoint #12
JEV relation: correction 0.95
target: evt_hydration_1
policy: PATCH
LLM: skipped
~~~

Therefore processing should be:

- hidden in App mode;
- available as a compact expandable panel;
- automatically visible in development/demo mode if desired.

The processing panel can sit between transcript and cards only when expanded.

## Developer trace is a feature toggle

Trace/Inspector is **not a separate product area**.

It is a developer/debug overlay inside the same app.

Recommended control:

~~~text
Settings / toolbar
  Developer details [ off | on ]
~~~

or:

~~~text
⌘⇧D / Inspect
~~~

When off:

- no raw trace timeline;
- no JEV probabilities;
- no provider metadata;
- no token/cost details.

When on:

- the same screen expands with processing/trace details;
- no context/session reset;
- no separate app navigation is required.

The user remains in the same workspace.

## Progressive disclosure model

Use four disclosure levels:

### Level 0 — Pure app

~~~text
orb + cards
~~~

### Level 1 — Live transcript

~~~text
orb + compact transcript + cards
~~~

### Level 2 — Processing

~~~text
orb + transcript + checkpoint/JEV summary + cards
~~~

### Level 3 — Developer details

~~~text
orb + transcript + processing + trace/timing/raw details + cards
~~~

The same runtime drives all four levels.

## Desktop layout direction

### Default app mode

Prefer a calm two-zone layout:

~~~text
+-----------------------------------------------------------+
|                       VOICE ORB                           |
|                 compact live transcript                   |
|                                                           |
|                Current intents / cards                    |
|                                                           |
|      Hydration     Parcel     Reminder      Journal       |
|                                                           |
|                    type or speak...                       |
+-----------------------------------------------------------+
~~~

or a split layout:

~~~text
+----------------------+------------------------------------+
|                      |                                    |
|      VOICE ORB       |        INTENT WORKSPACE            |
|                      |                                    |
|  compact transcript  |        cards / actions             |
|                      |                                    |
+----------------------+------------------------------------+
~~~

The default should **not** show a permanent Processing column.

### Developer details enabled

The same layout can expand:

~~~text
+-------------+-------------+-------------------------------+
| Input       | Processing  | Intent Workspace              |
|             |             |                               |
| transcript  | JEV/policy  | cards                         |
+-------------+-------------+-------------------------------+
| Inspector timeline / details drawer                       |
+-----------------------------------------------------------+
~~~

This is the earlier Lab layout, but now explicitly an **expanded developer view**, not the main product.

## Mobile layout direction

The mobile app should be voice-first.

Default:

~~~text
+-------------------------+
|       voice orb         |
|      Listening...       |
|                         |
| recent transcript       |
|                         |
| intent cards            |
| Hydration               |
| Parcel                  |
| Reminder                |
| Journal                 |
|                         |
|     type / mic          |
+-------------------------+
~~~

The orb stays visually prominent.

### Mobile transcript

Tap transcript area:

~~~text
collapsed -> expanded live transcript
~~~

### Mobile processing

Use a bottom sheet:

~~~text
Processing
Checkpoint
JEV summary
Policy result
~~~

### Mobile developer details

A second/deeper bottom sheet or "Inspect" screen inside the same session.

Do not force a permanent three-column mental model onto mobile.

## Core capabilities visible in the UI

The main app should communicate these product capabilities:

### Capture naturally

- speak continuously;
- type;
- mix multiple intents;
- correct yourself.

### Understand continuously

- detect new intent;
- continue existing intent;
- patch corrections;
- wait when unclear.

### Materialize useful state

- tasks;
- reminders;
- logs/facts;
- journal/reflection;
- generic structured events.

### Ask only when necessary

Missing fields become visible on the card.

Example:

~~~text
Reminder
Take medicine
Needs: time
[ Add time ]
~~~

Do not interrupt continuous speech immediately unless required.

### Act safely

When a real tool/action exists:

- pending action;
- approval;
- complete;
- failed.

### Remember selectively

Later:
- short-term session state;
- accepted long-term signals;
- user/project preferences.

These are product capabilities; traces are not.

## Prototype directions

The repository should explore at least three visual directions.

### Direction A — Voice-first minimal

Closest to ChatGPT Voice / Apple.

~~~text
large orb
small live transcript
cards appear below
almost no visible processing
developer details hidden
~~~

Best for:
- product vision;
- mobile;
- polished public demo.

### Direction B — Workspace split

Closest to Notion / clean productivity app.

~~~text
left: orb + input
right: cards/workspace
processing hidden behind "Details"
~~~

Best for:
- desktop use;
- persistent state;
- many active intents.

### Direction C — Streaming semantic demo

Optimized for showing the technology without becoming a debug console.

~~~text
orb
streaming transcript with processed segments subtly turning green
cards appear/morph alongside
small collapsible "How this was understood" strip
trace hidden behind developer toggle
~~~

Best for:
- Product Hunt demo;
- explaining JEV visually;
- investor/developer presentations.

## Recommended default

For this POC:

> **Direction C for the public demo, styled with the visual cleanliness of Direction A.**

That means:

- voice orb remains hero;
- intent cards are the primary output;
- transcript is visible but secondary;
- processed transcript segments briefly turn green;
- processing summary is compact/collapsible;
- trace is developer-toggle-only.

This gives us enough visibility to demonstrate the innovation without making the product look like an observability tool.

## Design principles

1. **Voice first.**
2. **Cards are the product state.**
3. **Transcript is evidence, not the main UI.**
4. **Processing is progressive disclosure.**
5. **Trace is developer-only by default.**
6. **Corrections morph existing state.**
7. **Use subtle animation, not dashboard noise.**
8. **Mobile should feel native and calm.**
9. **Do not permanently expose probabilities to normal users.**
10. **The user should understand the app without knowing what JEV is.**
