# Research: voice API capability matrix

> **Status:** Research snapshot — not an implementation mandate
> **Snapshot date:** 2026-09-25
> **Purpose:** Preserve current provider research so coding agents do not restart voice discovery from scratch.

Provider APIs change quickly. Re-check the linked official documentation when implementing an adapter.

## What matters for this project

We care about two very different jobs:

### A. Control-first transcription

~~~text
microphone
  -> streaming STT
  -> transcript/revision/turn events
  -> Transcript Ledger
  -> checkpoint scheduler
  -> Jev
  -> policy / optional LLM
~~~

The important capabilities are:

- interim/partial text;
- final/chunk-final text;
- transcript revision behavior;
- pause/end-of-turn signals;
- end-of-turn confidence;
- word timestamps where useful;
- manual turn control;
- client authentication;
- predictable event correlation.

### B. Native realtime conversation

~~~text
microphone
  -> realtime speech-to-speech agent/model
  -> spoken reply
            |
            +--> tool proposal
                    |
                    v
               Tool Gateway
~~~

The important capabilities are:

- natural full-duplex audio;
- barge-in/interruption;
- tool calling;
- input/output transcription;
- browser-safe authentication;
- session resumption;
- sideband/server control;
- event observability.

Do not compare these providers as if "voice" were one feature.

## High-level matrix

| Provider / surface | Mode | Transport | Partial/final transcript | Turn / interruption | Tools | Client auth | Best fit here |
|---|---|---|---|---|---|---|---|
| OpenAI Realtime | native speech-to-speech | WebRTC browser, WebSocket server | transcription/events available; separate transcription path also exists | realtime VAD / barge-in | functions + MCP | ephemeral client secret | native realtime comparison |
| OpenAI Realtime Transcription | control-first STT | WebRTC / WebSocket | transcript deltas + final | configurable realtime audio turn handling | N/A as transcription service | ephemeral browser flow supported | control-first candidate |
| Gemini Live Agent | native realtime | WebSocket | input + output transcription | VAD, interruption, cancel; session resumption | function calling / search depending model | ephemeral tokens for client flow | native realtime comparison |
| Gemini Live Transcription | control-first STT | WebSocket | interim + finalized | auto/manual VAD | transcription only | ephemeral tokens | strong control-first candidate |
| xAI Speech-to-Speech | native realtime | WebSocket | realtime audio/text events | server-side realtime conversation | functions, search, remote MCP | ephemeral token | native realtime comparison |
| xAI Streaming STT | control-first STT | WebSocket | interim, chunk-final, utterance-final | endpointing + smart-turn confidence | N/A | docs say proxy standard API key | strong control-first candidate |
| Deepgram Flux | conversational STT | WebSocket | streaming turn transcripts | model-integrated EOT, eager EOT, TurnResumed, barge-in | N/A | server API auth | particularly relevant to checkpoint scheduler |
| Deepgram Voice Agent | managed STT+LLM+TTS | WebSocket | transcript/agent events | barge-in | function calling | server-side integration / browser SDK options | managed-pipeline benchmark |
| ElevenLabs Agents | managed realtime agent | WebSocket / SDK | user transcript + agent text/audio events | VAD + interruption controls | client/webhook/code/MCP/system tools | signed URL for private browser sessions | polished managed-agent comparison |
| Azure Voice Live | managed native voice platform | WebSocket / SDK | speech + realtime events | realtime bidirectional voice | function/tool integration | Azure/Entra/service auth | enterprise/Azure comparison |

The matrix is intentionally qualitative. Run our own benchmark before picking a provider.

---

# OpenAI

## Realtime API

Current official documentation describes a speech-to-speech realtime model that:

- works directly with audio;
- maintains conversation state;
- can call tools;
- supports browser WebRTC;
- supports server WebSocket;
- supports barge-in / natural turn-taking;
- supports ephemeral client credentials.

Browser architecture can use:

~~~text
browser -> developer server -> Realtime unified WebRTC setup
~~~

or:

~~~text
browser -> developer server mints ephemeral secret
        -> browser connects directly to OpenAI
~~~

Official docs:
- https://developers.openai.com/api/docs/guides/realtime
- https://developers.openai.com/api/docs/guides/voice-webrtc
- https://developers.openai.com/api/docs/guides/realtime-mcp

### Project implication

Good native-realtime candidate.

For consequential tools, use function calls executed by our application so Tool Gateway remains authoritative.

Do not use provider-direct MCP for actions that must pass our policy unless the MCP endpoint itself delegates to the Tool Gateway.

## Realtime transcription

OpenAI exposes a dedicated transcription session for live audio.

Current docs describe:

- transcript deltas as speech arrives;
- final transcript when a turn is committed;
- WebSocket for server pipelines;
- WebRTC for browser audio.

Official:
https://developers.openai.com/api/docs/guides/realtime-transcription

### Project implication

This is a reasonable control-first STT candidate.

It keeps conversational reasoning out of the hot path and lets our Transcript Ledger/Jev runtime own semantics.

---

# Gemini

## Gemini Live Agent

Current Live API provides:

- persistent bidirectional WebSocket sessions;
- audio/video/text input;
- native audio output;
- input/output audio transcription;
- function calling;
- VAD;
- interruption events;
- session resumption;
- client ephemeral tokens in preview.

Official:
- https://ai.google.dev/gemini-api/docs/live-api/get-started-sdk
- https://ai.google.dev/gemini-api/docs/live-api/capabilities
- https://ai.google.dev/gemini-api/docs/live-api/tools
- https://ai.google.dev/gemini-api/docs/live-api/session-management
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens

### Important tool nuance

Live model versions differ in synchronous/asynchronous tool behavior. Treat tool concurrency as a provider capability, not a universal contract.

Our Tool Gateway remains serializable and provider-neutral.

## Gemini Live Transcription

Current dedicated transcription surface is especially relevant to this POC.

It provides:

- interim_input_transcription;
- finalized input_transcription;
- automatic language detection;
- custom vocabulary;
- automatic or manual VAD;
- VERBATIM mode;
- SMART mode.

Official:
https://ai.google.dev/gemini-api/docs/live-api/live-transcribe

### Important project insight: use VERBATIM first

SMART mode can remove filler words and resolve spoken self-corrections into cleaner text.

That is helpful for ordinary transcription but **bad for our correction experiment**, because we explicitly want evidence such as:

~~~text
Coke ... no, I mean water
~~~

to remain observable.

For the first control-first voice spike, prefer VERBATIM so the Transcript Ledger/Jev layer gets the raw semantic correction evidence.

Later compare SMART mode as an optimization.

### Session limitation

The current Live Transcription docs state continuous transcription sessions support up to 10 minutes. Re-check before implementation.

---

# xAI / Grok

## Speech-to-Speech

Current xAI docs describe realtime voice over WebSocket with:

- bidirectional text/audio;
- function calling;
- web/X/collections search;
- remote MCP;
- ephemeral tokens for browser/mobile;
- current model alias grok-voice-latest.

The current model page lists:

- audio pricing: $0.08/minute;
- text input: $0.004/message;
- 10 concurrent sessions/team;
- max session duration: 120 minutes.

These values are dated and must be re-checked before benchmarking.

Official:
- https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech
- https://docs.x.ai/developers/model-capabilities/audio/ephemeral-tokens
- https://docs.x.ai/developers/models/speech-to-speech

### Project implication

Strong native-realtime comparison because it exposes tools and a relatively direct WebSocket event model.

## Streaming Speech-to-Text

Current xAI STT supports:

- WebSocket streaming;
- interim results approximately every ~500ms when enabled;
- transcript.partial events;
- is_final;
- speech_final;
- configurable endpointing;
- smart_turn;
- end_of_turn_confidence;
- word-level timestamps;
- multichannel transcription;
- manual Finalize message.

Official:
https://docs.x.ai/developers/model-capabilities/audio/speech-to-text

### Project implication

Very interesting for our scheduler because it exposes three useful states:

~~~text
interim
chunk final
utterance final
~~~

and smart-turn confidence.

These signals can become **checkpoint triggers**, not semantic decisions.

### Client-auth nuance

The current STT page warns not to expose the standard API key and recommends proxying WebSocket connections through the backend.

Do not assume xAI STT has the same client-direct ephemeral-token flow as xAI speech-to-speech unless the implementation docs confirm it.

---

# Deepgram

## Flux conversational STT

Flux is especially relevant to the "yapping" problem.

Current official docs describe:

- conversational speech recognition;
- model-integrated end-of-turn detection;
- configurable eot_threshold;
- configurable eager_eot_threshold;
- EagerEndOfTurn;
- TurnResumed if the speaker continues;
- EndOfTurn;
- StartOfTurn for barge-in;
- word-level timestamps;
- ForceEndTurn;
- approximately 260ms end-of-turn detection in Deepgram's current product documentation.

Official:
- https://developers.deepgram.com/docs/flux/quickstart
- https://developers.deepgram.com/docs/flux/configuration
- https://developers.deepgram.com/docs/flux/state
- https://developers.deepgram.com/docs/flux/force-end-turn

### Why Flux is particularly interesting

Our scheduler currently uses cheap heuristics such as:

~~~text
pause
time since checkpoint
new word count
stable segment
~~~

Flux can provide a richer provider signal:

~~~text
EagerEndOfTurn
  -> maybe prepare semantic work

TurnResumed
  -> cancel/discard speculative work

EndOfTurn
  -> strong checkpoint
~~~

This maps extremely well to our checkpoint architecture.

We should still retain our scheduler abstraction because another STT provider may not have these events.

## Nova streaming STT

Deepgram's ordinary streaming STT provides:

- interim results;
- is_final;
- speech_final;
- configurable endpointing;
- utterance-end events.

Official:
- https://developers.deepgram.com/docs/understand-endpointing-interim-results
- https://developers.deepgram.com/docs/interim-results
- https://developers.deepgram.com/docs/endpointing

## Voice Agent API

Deepgram also offers a managed full pipeline:

~~~text
audio -> STT -> LLM -> TTS
~~~

over a single WebSocket, with function calling and barge-in.

One current integration guide describes approximately 425ms round-trip latency, but treat that as a provider/example claim, not our expected latency.

Official:
- https://developers.deepgram.com/docs/voice-agent
- https://developers.deepgram.com/docs/build-a-voice-agent
- https://developers.deepgram.com/docs/voice-agents-function-calling

### Project implication

Good benchmark for "how much code can a managed voice pipeline remove?"

Less suitable as the first architecture if we want Jev to operate before the reasoning model, because the platform bundles the LLM stage.

---

# ElevenLabs Agents

Current ElevenLabs Agents WebSocket surface provides events for:

- user audio chunks;
- VAD score;
- user transcript;
- agent response/text;
- audio response;
- interruption;
- client tool calls/results;
- MCP calls;
- guardrail events;
- contextual updates.

Private browser sessions can use server-minted signed URLs.

Official:
- https://elevenlabs.io/docs/eleven-agents/libraries/web-sockets
- https://elevenlabs.io/docs/eleven-agents/api-reference/eleven-agents/websocket
- https://elevenlabs.io/docs/eleven-agents/customization/tools
- https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp
- https://elevenlabs.io/docs/eleven-agents/customization/tools/tool-configuration/tool-interruptions

### Interesting capability

Tool interruption policy can be configured per tool:

~~~text
allow
disable during tool
disable during tool and turn
~~~

This is a useful reference for our own future tool/voice approval UX.

### Project implication

ElevenLabs is compelling for a polished managed voice experience and tool ecosystem.

It is not the best first proof of our Jev-before-reasoning architecture because it is a higher-level agent platform.

---

# Microsoft Azure Voice Live

Microsoft's current Voice Live platform provides a unified realtime voice service over WebSocket / SDK that can combine:

- speech recognition;
- generative AI;
- TTS;
- noise suppression / echo cancellation;
- multiple model choices;
- function/tool integration;
- Azure/OpenAI/custom/personal voices;
- avatar/animation features.

Official:
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-sdk
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-api-reference-2026-04-10
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-sdk

Azure also exposes dedicated speech/transcription SDKs separately.

### Project implication

Very strong enterprise/Azure option, especially if the final host/runtime moves toward Microsoft services.

But do not make Azure Voice Live a dependency of the core because:

- it couples more of the voice stack to Azure;
- we explicitly want direct OpenAI/Gemini/xAI experiments;
- TypeSafe/Jev and semantic-state architecture do not require Azure.

---

# Recommendation for implementation spikes

## Control-first STT shortlist

Do **not** integrate all of them.

Start with thin adapters/benchmarks for two or three:

### 1. Deepgram Flux

Why:
- end-of-turn confidence/events map directly to scheduler concepts;
- interesting EagerEndOfTurn / TurnResumed behavior.

### 2. Gemini Live Transcription

Why:
- explicit interim + final transcript events;
- VERBATIM vs SMART gives us an excellent correction experiment;
- manual/automatic VAD;
- ephemeral client tokens.

### 3. xAI Streaming STT or OpenAI Realtime Transcription

Choose one based on easiest credentials/SDK at implementation time.

xAI advantage:
- explicit interim/chunk-final/utterance-final states;
- smart turn confidence;
- word timestamps.

OpenAI advantage:
- WebRTC browser path;
- same vendor can later provide native realtime model.

## Native realtime shortlist

After control-first semantics work:

1. OpenAI Realtime;
2. Gemini Live;
3. xAI Speech-to-Speech.

Optional comparison:
- Azure Voice Live;
- ElevenLabs Agents;
- Deepgram Voice Agent.

## Benchmark script

Use the same utterances for every provider:

1. short command;
2. "Coke ... no, water";
3. mixed-intent utterance;
4. 60-90 second continuous yapping;
5. long pause mid-thought;
6. interruption during assistant output;
7. incomplete reminder;
8. proper noun / domain vocabulary;
9. open-ended reasoning request.

Measure:

~~~text
time to first partial
time to stable/final
number of transcript rewrites
end-of-turn false positives
end-of-turn false negatives
correction evidence preserved?
checkpoint count
Jev calls
LLM calls
barge-in stop latency
tool-call round trip
session recovery
implementation complexity
cost
~~~

## Important architecture rule

Provider-native turn detection can **inform** our checkpoint scheduler.

It must not become the only semantic control contract.

Example:

~~~text
Deepgram EndOfTurn
    |
    v
checkpoint trigger
    |
    v
Jev decides meaning
~~~

not:

~~~text
Deepgram EndOfTurn
    |
    v
automatically execute interpreted action
~~~

Turn boundaries and semantic meaning are different problems.

## Provider-selection principle

Choose the first provider by:

1. evidence preservation;
2. control points;
3. latency;
4. SDK simplicity;
5. cost;
6. browser/mobile deployment fit.

Do not choose based only on voice naturalness, because the first POC is testing the semantic control plane.
