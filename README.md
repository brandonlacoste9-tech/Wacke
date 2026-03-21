# Wacké Monorepo

> Le streaming québécois. Raw, wacké, 100% culture de rue. Kick meets dépanneur drama. 🏪🔥

## Architecture

This is a **Turborepo monorepo** powering the Wacké live streaming platform — Québec's answer to Twitch and Kick.

### Workspace Structure

```
wacke-monorepo/
├── apps/
│   ├── web/          # Next.js 14 App Router — main platform
│   └── admin/        # Admin dashboard (future)
└── packages/
    ├── db/           # @wacke/db — Drizzle ORM + Neon Postgres schemas & queries
    ├── ui/           # @wacke/ui — Shared React components
    └── config/       # Shared ESLint + TypeScript configs
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion, Permanent Marker font |
| Database | Neon Serverless Postgres + Drizzle ORM |
| Real-time Chat | Supabase Realtime (WebSocket / Postgres Changes) |
| Video Streaming | Mux (HLS ingest, low-latency playback, webhooks) |
| Auth | Supabase Auth |
| Monorepo | Turborepo |
| Deployment | Vercel (Edge Functions + CDN) |

### Database Schema

| Table | Description |
|---|---|
| `users` | Streamers and viewers, token balances, Mux credentials |
| `streams` | Live stream metadata, Mux playback IDs, viewer counts |
| `messages` | Graffiti Chat messages with Mode Sacré classification |
| `token_transactions` | Full ledger for Boum! reactions and token gifts |
| `follows` | Viewer → Streamer follow relationships |
| `reactions` | Boum! and other stream reactions |

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example apps/web/.env.local
# Fill in DATABASE_URL, Supabase keys, and Mux credentials
```

### 3. Run database migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Start development server

```bash
pnpm dev
```

The web app will be available at `http://localhost:3000`.

## Key Features

### Graffiti Chat
Real-time WebSocket chat powered by Supabase Realtime. **Mode Sacré** allows authentic Québécois sacres (religious swear words used as cultural expression) while hard-blocking actual hate speech. The moderation engine runs both client-side (for instant feedback) and server-side (for enforcement).

### Video Pipeline
Mux handles all video ingest and delivery. Streamers connect via RTMP (OBS, Streamlabs, etc.) and viewers receive low-latency HLS streams. Mux webhooks automatically update stream status in the database when a broadcaster goes live or offline.

### Token Economy
A platform token system for viewer engagement. Viewers earn tokens through daily logins and watching streams, then spend them on **Boum!** reactions (5 tokens) or direct gifts to streamers. All transactions are atomic database operations with a full audit ledger.

## Environment Variables

See `.env.example` for the full list of required environment variables.

## Deployment

Deploy to Vercel with zero configuration. The monorepo is pre-configured for Vercel's Turborepo integration. Set all environment variables in the Vercel project dashboard.

```bash
vercel deploy
```
