-- Mux Live columns (safe if re-run)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mux_live_stream_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mux_playback_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mux_stream_key text;

ALTER TABLE streams ADD COLUMN IF NOT EXISTS mux_live_stream_id text;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS mux_playback_id text;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS mux_stream_key text;
