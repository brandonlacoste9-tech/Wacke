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

### Still recommended
- Rate-limit AI / chat / claim  
- Real moderation blocklist  
- Pick Mux **or** Cloudflare Stream and finish one path  
- Stripe live webhook for token packs only (no mock)  
