-- Enable Row Level Security on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "streams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "token_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reactions" ENABLE ROW LEVEL SECURITY;

-- users table policies
CREATE POLICY "Public profiles are viewable by everyone" ON "users"
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON "users"
FOR INSERT WITH CHECK (auth.uid() = supabase_id);

CREATE POLICY "Users can update own profile" ON "users"
FOR UPDATE USING (auth.uid() = supabase_id);

-- streams table policies
CREATE POLICY "Streams are viewable by everyone" ON "streams"
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own streams" ON "streams"
FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
);

CREATE POLICY "Users can update their own streams" ON "streams"
FOR UPDATE USING (
  user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
);

CREATE POLICY "Users can delete their own streams" ON "streams"
FOR DELETE USING (
  user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
);

-- messages table policies
CREATE POLICY "Messages are viewable by everyone" ON "messages"
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON "messages"
FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
);

-- Note: We only allow insertion of messages from the frontend. 
-- Updates/Deletes should be handled by the backend (service_role) or moderators.

-- token_transactions table policies
-- We ONLY want users to see their own transactions, and we NEVER want users to insert transactions directly from the frontend (only the secure backend should do this).
CREATE POLICY "Users can view their own transactions" ON "token_transactions"
FOR SELECT USING (
  from_user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
  OR to_user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
);

-- follows table policies
CREATE POLICY "Follows are viewable by everyone" ON "follows"
FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON "follows"
FOR INSERT WITH CHECK (
  follower_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
);

CREATE POLICY "Users can unfollow" ON "follows"
FOR DELETE USING (
  follower_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
);

-- reactions table policies
CREATE POLICY "Reactions are viewable by everyone" ON "reactions"
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reactions" ON "reactions"
FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
);
