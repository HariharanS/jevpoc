# ADR 0004: Voice uses a Transcript Ledger and two explicit execution modes

- Status: Accepted
- Date: 2026-09-25

## Context

The POC needs natural voice interaction, but the architectural value of JEV depends on being able to observe and reason over evolving input before committing actions.

Realtime voice providers increasingly offer native audio-to-audio conversation, tool calls, VAD and interruption handling. In those systems the voice model can consume audio before an external JEV layer sees a transcript.

A single "VoiceProvider -> transcript" abstraction would hide this important difference.

## Decision

Support two explicit voice modes.

### Control-first mode

Streaming STT produces normalized partial/revised/final transcript events.

A Transcript Ledger preserves revisions.

JEV runs at semantic checkpoints and produces interpretation/control signals.

Deterministic policy owns commit and tool execution.

This is the first voice mode to implement.

### Native realtime mode

A provider such as OpenAI Realtime, Gemini Live or xAI/Grok Voice owns the low-latency speech-to-speech loop.

Provider events are normalized for observability and state.

JEV still participates in semantic classification, but the hard control boundary is tool execution, approval, durable mutation and persistence.

## Additional rules

- transcript finality is not execution permission;
- do not run a full agent turn for every partial transcript;
- distinguish STT corrections from user semantic corrections;
- support barge-in and response cancellation as first-class events;
- voice-session model/provider selection is separate from per-task reasoning-model routing;
- provider-specific realtime objects stay inside adapters;
- raw audio is not required for durable traces.

## Consequences

Positive:

- the POC can demonstrate early semantic control instead of becoming a thin wrapper around a realtime voice API;
- native realtime models remain usable when conversational quality is the priority;
- OpenAI, Gemini, Grok and future providers can be swapped without moving policy/tool ownership;
- voice events become inspectable and replayable.

Trade-offs:

- two modes require slightly different adapter contracts;
- the control-first mode adds STT/TTS pipeline latency relative to a native speech-to-speech loop;
- native realtime mode cannot guarantee JEV sees user intent before the realtime model itself reasons about the audio.

This difference is intentional and must remain visible in the design.
