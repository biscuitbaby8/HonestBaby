-- push_subscriptions: ユーザーのWeb Push購読情報を保管
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,        -- Supabase auth.uid()
  endpoint    TEXT NOT NULL UNIQUE, -- Push Service のエンドポイントURL
  p256dh      TEXT NOT NULL,        -- Push Subscription Keys
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid()::text);

GRANT SELECT, INSERT, DELETE ON push_subscriptions TO anon, authenticated;
GRANT SELECT, DELETE ON push_subscriptions TO service_role;
