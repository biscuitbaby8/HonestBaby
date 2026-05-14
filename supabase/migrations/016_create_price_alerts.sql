-- price_alerts: ユーザーが設定した価格アラート
CREATE TABLE IF NOT EXISTS price_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,            -- Supabase auth.uid()
  product_code  TEXT NOT NULL,            -- rakuten_item_code or product UUID (文字列で保持)
  product_name  TEXT NOT NULL,
  image_url     TEXT,
  target_price  INTEGER NOT NULL,         -- この価格以下になったら通知
  current_price INTEGER,
  affiliate_url TEXT,
  triggered_at  TIMESTAMPTZ,             -- トリガー済みの日時（NULLは未トリガー）
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product_code ON price_alerts(product_code);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON price_alerts FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own alerts"
  ON price_alerts FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own alerts"
  ON price_alerts FOR DELETE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own alerts"
  ON price_alerts FOR UPDATE
  USING (user_id = auth.uid()::text);

GRANT SELECT, INSERT, DELETE, UPDATE ON price_alerts TO anon, authenticated;
