# PSAI

A voice companion — a soft glowing orb you talk to, that remembers you and
helps you through rough patches. Local-first, single-user. See
`docs/superpowers/specs/2026-07-29-psai-companion-design.md` for the full
design.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and set `GEMINI_API_KEY`
   (get one at https://aistudio.google.com/apikey).
3. `npm run dev`
4. Open http://localhost:3000, allow microphone access, and talk.

Voice needs a real Gemini Live session and a live mic/speaker round trip in
a real browser — there's no way to fully verify that from the command line.
After setup, manually check: the orb responds when you speak, PSAI replies
by voice, and the transcript in the chat panel matches what was said.

## How it's wired

The Next.js app doesn't run under `next dev`/`next start` directly — it
runs under a custom Node server (`server.ts`, via `tsx`) so it can hold a
WebSocket connection open at `/api/relay`. That connection is the bridge
between your browser's mic/speaker and a Gemini Live session running
server-side; the server sees the live transcript as it streams, which is
what lets the crisis-language safety layer (`lib/safety/crisisDetector.ts`)
inspect conversations in real time instead of only after the fact.

Conversations and a running long-term memory profile are stored locally in
`data/psai.db` (SQLite, gitignored) — nothing leaves your machine except
what's sent to the Gemini API.

## Scripts

- `npm run dev` — start the app (custom server, with reload on change)
- `npm run build` — production Next.js build
- `npm start` — run the production build via the custom server
- `npm test` — unit tests (crisis detector, memory summarizer)
- `npm run lint` — eslint
