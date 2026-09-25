# Current UI and interaction direction

**Current product direction; prototype pixels remain reviewable.** This incorporates the later preference for a warm brown surface, selective monospaced detail, visible listening bars, scrolling evidence and in-place cards. It supersedes the earlier light SaaS/orb-first SVG and permanent Lab dashboard instructions.

## Hierarchy

Input/listening state and useful cards come first. Transcript is secondary. Selected-card explanation is on demand. Processing/timeline is developer disclosure. Changing disclosure does not reset the workspace or replace the session.

Use a warm ink/cocoa background, parchment text, quiet bordered surfaces and restrained sage/amber accents. Monospace is for live transcript, timestamps and small operational labels; cards remain easily readable. No neon terminal, green-screen cosplay, particles, giant gradient orb or decorative dashboard statistics. These are product choices, not requirements to reproduce a vendor's interface.

## Stream to state

Listening bars represent input activity. A small interpretation marker can turn while actual work is pending. They are separate states: listening may continue while interpretation runs. In the scripted prototype both are explicitly labelled simulated.

Show recent transcript lines moving through a bounded evidence area. When sufficient information is available, briefly connect/highlight its destination card, then remove the connector. Never keep spaghetti arrows between independent scrolling panes. Do not make text disappear before it remains inspectable as evidence.

The first implementation can use CSS/SVG. No Three.js, custom font, animation platform or additional UI framework is required. System monospace + system sans are sufficient. Motion should not delay a committed card update. Keep reduced-motion behavior equivalent.

## Cards

Keep stable keyed DOM nodes, identity, order and keyboard focus. Corrected fields highlight briefly; do not recreate the whole card grid on every partial. Coke to water changes one value, not the quantity or card identity. Journal continuation preserves both feelings.

Use truthful labels: Captured, Draft, Updated, Needs time/date. Green indicates mapped/updated, not factual truth or authorization. Do not show Scheduled/Sent/Done for a captured draft. Missing fields have explicit edit actions; form values follow runtime validation and provenance.

## Selected-card explanation

Show the selected item/version, exact source quotes, interpreted fields, amendment history, and only that item's missing information. A hydration explanation must not display a reminder's missing time. Bind source links to immutable input revisions and UTF-16 ranges. If a source is superseded or unavailable, label it rather than highlighting the wrong current offset.

Clicking/tapping a card exposes evidence. Keyboard activation works too. Closing a sheet returns focus to its trigger. Transcript selection can highlight corresponding cards without hover. A source may support several fields/cards.

## Scrolling and disclosure

The input stays reachable. Cards keep their order during speech. Manual transcript scrolling suspends live-follow; show Jump to live. Use a compact evidence ribbon by default; fuller history and processing details are optional. Mobile uses one primary card flow and sheets, not compulsory Input/State/Inspector tabs.

## State honesty

The prototype uses a fixed script. No microphone is opened, no provider is connected, and animation timing is not model latency. There is no real scheduling. Keep that disclosure visible and close to replay controls. A prototype choice is not a measured UX result.

The production UI is server-state-driven. Browser-only prototype state is a documented exception, not an instruction to move business truth into React.

## Acceptance

Test 360, 768 and 1440 px; keyboard/focus; reduced motion; long titles; rapid corrections; interruption/reset; source selection; missing information; stream failure. Do not announce every transcript token to a screen reader. Use restrained status updates and color-independent labels.

A still image should communicate input, useful captured items, one correction and one missing field without suggesting an analytics console. The developer must still be able to reach evidence, questions, policy, mutation and timing. The interactive reference is [../prototypes/workspace/index.html](../prototypes/workspace/index.html); run it using the documented local server, not GitHub's source viewer.
