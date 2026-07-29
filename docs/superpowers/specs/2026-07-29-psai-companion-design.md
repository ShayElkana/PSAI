# PSAI — Voice Companion Design

## Purpose

PSAI is a web-based AI companion with a soft glowing-orb presence. It talks
naturally by voice (and text) with one person, acts as a warm, supportive
psychologist-style presence, and helps the person work through rough patches
in their life while keeping them company day to day.

## Scope decisions

- **User scope:** single user (the owner), no accounts/auth for v1.
- **Platform:** web app, run locally for now (deploy later if desired).
- **Input:** voice + text, either can be used any time.
- **Memory:** persistent across sessions — PSAI remembers recurring issues,
  preferences, and history to sustain an ongoing relationship.
- **Safety:** built-in crisis-language detection and response is required
  (mental-health-adjacent product), not optional.
- **Avatar:** abstract glowing orb — no literal face. Pulses/shifts color and
  shape with PSAI's emotion and with live audio, rather than rendering eyes/
  mouth. Calmer, avoids uncanny-valley risk, simpler to build well.

## Architecture

**Stack:** Next.js + React (frontend + backend in one project), Gemini Live
API (voice-to-voice LLM), SQLite for local persistent memory.

**Approach:** the Next.js backend actively relays audio between the browser
and Gemini Live, rather than the browser connecting to Gemini directly. A
WebSocket API route sits in the middle of every conversation turn. This
costs a small amount of latency versus a direct browser-to-Gemini connection,
in exchange for a single choke point where the app can:

- inject the persona + safety system prompt and long-term memory profile
  into each new Gemini Live session,
- inspect transcript deltas in real time for crisis language as the
  conversation happens (not just after the fact),
- persist transcripts and update the long-term memory profile.

This was chosen over two alternatives: a fully split Next.js-frontend /
separate-Node-backend design (more processes to run for a single-user local
app, unnecessary for v1), and a direct browser-to-Gemini-Live connection with
only token-minting on the server (lower latency, but the server never sees
raw conversation content in real time, weakening the safety layer).

## Components

- **Orb** (`components/orb/Orb.tsx`) — client-side canvas/WebGL. Glow and
  pulse are driven by outgoing audio amplitude; color and motion shift based
  on an emotion tag carried in PSAI's replies.
- **ChatPanel** (`components/chat/ChatPanel.tsx`) — scrolling transcript of
  both sides of the conversation, text input box, works standalone if voice
  is unavailable.
- **VoiceControls** (`components/chat/VoiceControls.tsx`) — mic button,
  session state indicator (idle / listening / speaking / reconnecting).
- **Voice Relay** (`app/api/relay/route.ts`) — WebSocket route. Bridges
  browser audio and Gemini Live audio in both directions. Owns the Gemini
  Live session lifecycle, including reconnect-with-backoff on drop.
- **Crisis Detector** (`lib/safety/crisisDetector.ts`) — runs inside the
  relay, scans transcript deltas as they arrive. On a trigger, injects a
  system-level nudge into the live Gemini session to surface a hotline/
  resource, and logs the flag locally. This is a backup/logging layer, not
  the primary safety mechanism — the system prompt itself instructs Gemini
  to handle crisis language directly and consistently on every turn.
- **Memory Store** (`lib/memory/store.ts`, `lib/memory/summarizer.ts`) —
  SQLite-backed. Persists full transcripts; a summarizer periodically
  condenses sessions into a long-term profile (recurring issues,
  preferences) that gets injected into the system prompt for future
  sessions.

## Data flow

1. Browser opens the app, opens a WebSocket connection to the relay
   (`app/api/relay`).
2. Relay starts a Gemini Live session, injecting the persona/safety system
   prompt plus the current long-term memory profile from SQLite.
3. Audio streams both directions through the relay. The relay also receives
   text transcript deltas from Gemini Live alongside the audio.
4. The crisis detector scans each transcript delta. On a flag: injects a
   resource-surfacing instruction into the live session, writes the flag to
   SQLite.
5. On turn/session end, the relay writes the transcript to SQLite; the
   summarizer asynchronously updates the long-term memory profile.
6. Orb and ChatPanel render live off the WebSocket stream (audio out +
   transcript text in).

## Error handling

- **Gemini Live session drops mid-conversation:** relay reconnects with
  backoff, re-injects persona + memory context into the new session. Client
  shows a "reconnecting" state (dimmed orb pulse) instead of failing
  silently.
- **Relay WebSocket itself drops** (e.g. server restart): client retries
  with backoff; after repeated failure, falls back to text-only mode via a
  plain Gemini text completion call.
- **No mic permission:** client falls back to text input. PSAI still
  replies with voice if TTS output is available, otherwise text-only.
- **SQLite write failure** (memory/transcript save): logged, never blocks
  the live conversation — memory persistence is best-effort and off the
  critical path.
- **Crisis detector false negatives:** mitigated by not relying on the
  detector alone — the system prompt directs Gemini to handle crisis
  language on every turn regardless of detector state. The detector adds
  real-time reinforcement plus a local audit log.

## Testing

- Crisis detector: unit tests against known trigger phrases and known-safe
  phrases (sanity check, not a claim of clinical accuracy).
- Memory summarizer: unit tests on transcript-to-profile-summary shape.
- Relay reconnect logic: tests with simulated Gemini Live disconnects.
- Orb: component tests for state transitions (idle / listening / speaking /
  reconnecting).
- Manual: real voice round-trip latency and quality — not meaningfully
  automatable, requires real browser mic/speaker testing.

## File structure

```
PSAI/
  app/
    layout.tsx
    page.tsx                    # main orb + chat screen
    api/
      relay/route.ts            # WebSocket relay: browser <-> Gemini Live
      memory/route.ts           # REST for history/profile (read-only for UI)
  components/
    orb/
      Orb.tsx                   # canvas/WebGL, audio-amplitude + emotion-driven
      orb-animation.ts
    chat/
      ChatPanel.tsx             # transcript view
      VoiceControls.tsx         # mic button, session state indicator
  lib/
    gemini/
      liveSession.ts            # server-side Gemini Live session wrapper (used by relay)
      systemPrompt.ts           # PSAI persona + safety instructions + memory injection
    memory/
      store.ts                  # SQLite access (better-sqlite3)
      summarizer.ts             # session transcript -> long-term profile
    safety/
      crisisDetector.ts         # transcript delta scan, trigger phrases
      resources.ts              # hotline/resource content, region-agnostic disclaimer
  data/
    psai.db                     # local SQLite, gitignored
  types/
    conversation.ts
    memory.ts
  .env.local                    # GEMINI_API_KEY, gitignored
  package.json
  next.config.js
```
