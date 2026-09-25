# Visual design system and taste reference

> **Status:** Normative visual direction for the POC
> **Purpose:** Preserve the intended product taste so implementation agents do not turn the app into a generic admin dashboard.

## Reference image

The current preferred concept is checked in as:

[ui/taste-reference-v2.svg](ui/taste-reference-v2.svg)

It captures the **direction**, not a pixel-perfect specification.

What matters most:

- voice is clearly primary, but the orb does not consume the whole product;
- intent cards are the main persistent state;
- transcript is useful but secondary;
- processed transcript segments become subtly green;
- corrections visibly replace prior meaning rather than add duplicate state;
- "How this was understood" is available on demand;
- developer telemetry stays one level deeper;
- generous whitespace and restrained surfaces;
- no permanent spaghetti arrows.

## Taste target

Aim for:

- **Apple** — spatial calm, motion restraint, premium voice affordance;
- **ChatGPT** — simple conversational entry point and low chrome;
- **Notion** — quiet information hierarchy and content-first layout;
- **Linear** — precision, polished micro-interactions and strong states.

Do **not** copy any one product literally.

The end result should feel like:

> **a calm personal operating surface where understanding materializes.**

Not:

> a monitoring dashboard for an AI pipeline.

## Visual hierarchy

Priority order:

1. current voice/input state;
2. useful semantic state/cards;
3. missing information / required action;
4. optional transcript;
5. optional explanation;
6. developer trace.

If a lower-priority layer visually competes with a higher one, reduce it.

## Layout rhythm

Use an 8px base spacing system.

Suggested tokens:

~~~text
4   micro gap
8   compact internal gap
12  dense component gap
16  standard component gap
24  card/content gap
32  section gap
48  major section gap
64  large spatial break
~~~

Prefer fewer, larger spacing jumps over lots of tiny arbitrary gaps.

## Typography

Use one clean sans-serif family.

First implementation:

~~~text
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif
~~~

Do not add a custom font dependency merely for branding.

Suggested hierarchy:

~~~text
Hero / listening state       28-36 px
Page / section title         24-28 px
Card primary value           18-22 px
Card title                   14-16 px semibold
Body                         14-16 px
Metadata                     12-13 px
Developer telemetry          12-13 px mono where useful
~~~

Use weight/spacing before adding more colors.

## Color philosophy

The interface should remain mostly neutral.

Use accent color for **meaning**, not decoration.

### Neutral

~~~text
page background     warm/cool near-white
surface             white
secondary surface   very light grey
primary text        near-black
secondary text      mid-grey
border              low-contrast grey
~~~

### Semantic accents

~~~text
blue/violet   active listening / current processing / primary action
green         understood / mapped / committed
amber         needs information / approval / caution
red           denied/error only
purple        journal/reflection / secondary semantic type
~~~

Avoid using red/green as a confidence meter.

## Surfaces

Default cards should be quiet.

Prefer:

- white surface;
- thin neutral border;
- soft shadow only where hierarchy requires;
- 14-20px radius;
- no heavy gradients inside every card.

Use elevated cards for:

- action required;
- selected item;
- explanation side sheet.

The screen should not look like a stack of floating SaaS widgets.

## Voice orb

The orb is the signature input element.

### Size

Adaptive rather than fixed.

~~~text
idle / empty state        larger hero
listening with no state   medium hero
cards exist               compact persistent orb
mobile                    medium, then shrink as cards accumulate
~~~

### Motion

Use motion to communicate state:

~~~text
idle          slow breathing
listening     audio-reactive surface
speech        stronger edge pulse
processing    subtle internal drift
speaking      output-audio reaction
interrupted   quick settle/collapse
error         static + concise message
~~~

Avoid excessive particles or gaming aesthetics.

## Transcript state styling

This is one of the product's signature interactions.

### Streaming / unprocessed

Neutral grey text.

### Current checkpoint

Subtle blue/violet wash or underline.

### Successfully mapped

Very soft green background/text emphasis.

### Corrected / superseded

Old value fades/strikes through briefly.

New value gains a subtle green transition.

### Needs information

Soft amber underline/chip.

Example:

~~~text
today I drank 200 ml Coke     neutral

today I drank 200 ml Coke     mapped -> soft green

Coke                          superseded -> muted strike
water                         corrected -> green

take my medicine              understood, amber "needs time"
~~~

The treatment should be light enough that the transcript remains readable as language, not code.

## Mapping transcript to cards

Do not maintain permanent arrows.

Use three mechanisms:

### 1. Ephemeral connector

When a phrase first maps to a card:

- phrase highlights;
- a subtle curved connector draws toward the card;
- card materializes/highlights;
- connector fades within ~0.8-1.5 seconds.

### 2. Hover / tap reveal

Hover/tap transcript phrase:

- corresponding card highlights;
- scroll into view if needed;
- temporary connector may appear.

Hover/tap card:

- transcript evidence highlights;
- transcript pane scrolls source into view.

### 3. How this was understood

For durable explanation, open the card side sheet:

~~~text
HEARD
"200 ml Coke ... no, I mean water"

UNDERSTOOD AS
Hydration · 200 ml

UPDATED
Coke -> Water

NEEDS
nothing / or missing field
~~~

Developer-level Jev/policy/trace information sits behind one more disclosure.

## Scrolling

Desktop:

- orb/latest input header can remain sticky;
- transcript/evidence pane may scroll independently;
- intent workspace may scroll independently;
- cards should keep stable order during active speech;
- newly changed cards highlight rather than constantly reorder.

When the user manually scrolls transcript history, disable live-follow and show:

~~~text
↓ Jump to live
~~~

Do not draw persistent connectors across independently scrolling regions.

## Card behavior

Cards are the durable product state.

### Creation

Materialize softly from processed speech.

### Update

Patch in place.

Changed fields briefly highlight.

### Missing info

Show directly actionable missing fields:

~~~text
Reminder
Take medicine

Needs time
[ Add time ]
~~~

### Completion

Do not over-celebrate ordinary state transitions.

A subtle check/change of state is enough.

## Explanation hierarchy

Three levels:

### Normal user

~~~text
orb + cards
~~~

### Curious user

~~~text
How this was understood
~~~

### Developer

~~~text
Jev questions/probabilities
policy
trace
latency
tokens/cost
provider metadata
~~~

Developer internals are not a primary navigation destination.

## Motion tokens

Suggested starting values:

~~~text
micro hover/state change     120-180 ms
field correction morph       180-260 ms
card create/update            220-320 ms
ephemeral connector          800-1500 ms total
orb state transition         350-650 ms
panel/sheet                  220-300 ms
~~~

Prefer smooth/spring-like easing.

Avoid bounce.

Respect prefers-reduced-motion.

## Copy tone

Short, calm, non-technical.

Good:

- Listening…
- You can keep talking.
- Updated.
- Needs a time.
- Got a few things from that.
- How this was understood.
- Looks good.

Avoid in normal mode:

- semantic checkpoint;
- confidence threshold;
- classification;
- policy engine;
- JSON event;
- model route.

Those belong in developer details.

## Empty state

Do not show empty category cards by default.

Better:

~~~text
orb

Ready when you are.

Speak or type naturally.
I’ll organize the useful parts as they appear.
~~~

Then cards emerge only when state exists.

## Long-session behavior

As state grows:

- group cards by Today / Upcoming / Notes / etc only when helpful;
- avoid constant live reordering;
- use compact summaries for older items;
- allow filters/search later;
- keep the orb/input accessible.

The first POC does not need a full information architecture for months of data.

## Light vs dark

The current preferred **public/product** direction is light/neutral.

Dark mode can come later or exist as an alternate prototype.

Do not build both before the core interaction works.

## Accessibility

Must-have:

- sufficient text contrast;
- color is never the only state signal;
- keyboard access to cards/panels;
- visible focus states;
- reduced-motion support;
- transcript and card mapping works without hover;
- voice actions have text/button equivalents.

## Implementation priority

Build taste in this order:

1. spacing / hierarchy;
2. typography;
3. semantic card behavior;
4. transcript state styling;
5. orb state transitions;
6. explanation side sheet;
7. ephemeral connectors;
8. developer details;
9. decorative polish.

If the hierarchy is wrong, animation will not rescue it.

## Acceptance test

The interface should pass three quick tests.

### Screenshot test

In one still image, a viewer understands:

- voice/input is central;
- several useful things were captured;
- one item was corrected;
- one item needs input.

### Five-second test

After five seconds, a non-developer should **not** think this is:

- an analytics dashboard;
- a trace viewer;
- an AI admin console.

### Developer test

With details enabled, an engineer can still reach:

- transcript revisions;
- Jev decisions;
- policy;
- state mutation;
- trace/timing.

That is the balance we want.
