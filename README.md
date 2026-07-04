# Wacké Monorepo

> Le streaming québécois. Raw, wacké, 100% culture de rue. Kick meets dépanneur drama. 🏪🔥

## Architecture

This is a **Turborepo monorepo** powering the Wacké live streaming platform — Québec's answer to Twitch and Kick.

**POWERED BY GROK xAI** 🔥

This version is fully Grok xAI powered:
- 🤖 Groké — the official Grok xAI personality in chat ( /grok commands + dedicated panel )
- Live Grok title generator, instant polls, random events, and profile roasts
- Grok mini-games and challenges for tokens
- Grok xAI branding throughout (header, OBS, streams, profiles)
- Richer Québec + maximalist humor

Go wild. Maximum truth. Maximum wacké.

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

## Deployment (Netlify)

Uses Netlify + @netlify/plugin-nextjs. 

1. Connect the repo in Netlify.
2. Set **Environment variables** (Site configuration → Environment variables). Add for Production + Deploy Previews:
   - `NEXT_PUBLIC_SUPABASE_URL` = https://ulbfaxhsbbckotcbmslk.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase → Project Settings → API → anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (service_role key - secret)
   - `DATABASE_URL` = (Supabase connection string, e.g. postgresql://postgres:[PASS]@db.ulbfaxhsbbckotcbmslk.supabase.co:5432/postgres)
   - `XAI_API_KEY` = your xAI key (for Grok features)
   - Other: KICK_*, TWITCH_*, STRIPE_*, MUX_* as needed

3. **Critical for login to work**:
   - In Supabase Dashboard → Authentication → URL Configuration:
     - Site URL: `https://wacke.live`
     - Add Redirect URLs: `https://wacke.live`, `https://wacke.live/**`, `https://wacke.live/auth/callback`
   - Redeploy after changing envs (Netlify builds bake NEXT_PUBLIC_* at build time).

Build command in netlify.toml: `pnpm install --no-frozen-lockfile && pnpm turbo run build --filter=@wacke/web`

```bash
# Local equivalent
cp .env.example apps/web/.env.local
# fill real keys, then pnpm dev
```
