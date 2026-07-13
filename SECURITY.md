# Wacke security notes

## 2026-07 hardening

### Fixed
- **Signed platform sessions** (`wacke1.…`) for Kick/Twitch OAuth — forgeable `mock-session:` tokens rejected in production
- **Mock token checkout** disabled in production (`/api/tokens/checkout/mock-success`)
- **Betting** disabled in production unless `BETTING_ENABLED=true`; server-side odds only
- **Debug auth** endpoint gated (404 in production without `DEBUG_AUTH_SECRET`)
- API routes use `resolveAuthUserId` (no unsigned JWT payload decode)

### Ops checklist
1. Set `WACKE_SESSION_SECRET` (or rely on `SUPABASE_SERVICE_ROLE_KEY`) on Netlify/Vercel  
2. Do **not** set `ALLOW_LEGACY_MOCK_AUTH` or `ALLOW_TOKEN_MOCK_CHECKOUT` in production  
3. Users must **re-login via Kick/Twitch/Supabase** after deploy (old cookies invalid)  
4. Enable betting only when economy is ready: `BETTING_ENABLED=true`  

### Rate limits + moderation (added)
- In-memory sliding window: chat, costly chat (TTS/spray/sound/sacré), AI, claim, watch-reward, bet  
- Expanded FR/EN hard blocks (hate/scams/threats), spam (caps, URLs, repeats)  
- Chaos/sacré vocabulary still allowed only when stream mode is on  

### Native live video
- **Primary studio: Cloudflare Stream WHIP** (`/api/stream/cloudflare`) — browser go-live  
- Env: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`  
- Player prefers Mux playback id if set, else Cloudflare  
- **Optional Mux OBS path** still available (`/api/stream/mux`) if you set Mux keys later

### Still recommended
- Redis rate limits for multi-instance  
- Stripe live webhook for token packs only (no mock)  
- Expand blocklist from real reports  


