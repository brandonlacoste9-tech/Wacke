# Kick-style Emotes & Badges (Wacké)

Place transparent 1:1 PNGs here for custom emotes.

## Workflow (from the spec)
1. Use Grok (or any AI) with this exact ending:
   "Twitch emote style, flat vector illustration, thick outlines, solid white background, 1:1 aspect ratio."
   (or "Chat badge style" for badges)

2. Keep concept dead simple: one subject + one emotion.

3. Save the result → go to remove.bg (or built-in remover) → transparent PNG.

4. Name it e.g. my-hype.png and reference in code or upload via future dashboard.

Examples generated for you:
- raccoon-hype.jpg (before)
- gold-skull.jpg (before)

Replace with your processed transparent versions, then add entries in apps/web/lib/emotes.ts under CHANNEL_EMOTES or SUBSCRIBER_EMOTES using imageUrl: "/emotes/xxx.png"

Shortcodes like :raccoon: will render the graphic in chat + picker.

Global = platform defaults (memes)
Channel = per-streamer (60 max)
Subscriber = for paying fans, usable everywhere (24 max)

Badges evolve with sub months (see lib/emotes.ts tiers).
