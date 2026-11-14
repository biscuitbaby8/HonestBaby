-- =============================================
-- 定番消耗品（おむつ）の出品と単価の履歴。
-- 定番そのもの（銘柄×タイプ×サイズ）は src/lib/staples.js で定義し、
-- ここには楽天・Yahooから突合できた出品と、日ごとの最安単価だけを持つ。
-- 読み取りは公開、書き込みは service_role（/api/cron/sync-staples）のみ。
-- =============================================
CREATE TABLE IF NOT EXISTS staple_offers (
  id          BIGSERIAL PRIMARY KEY,
  staple_id   TEXT NOT NULL,
  mall        TEXT NOT NULL CHECK (mall IN ('rakuten', 'yahoo')),
  item_code   TEXT NOT NULL,
  shop_name   TEXT NOT NULL,
  item_name   TEXT NOT NULL,
  url         TEXT NOT NULL,
  image_url   TEXT,
  price       INTEGER NOT NULL CHECK (price > 0),
  qty         INTEGER NOT NULL CHECK (qty > 0),
  unit_price  NUMERIC(8,2) NOT NULL CHECK (unit_price > 0),
  -- 'free' 送料無料 / 'cond' 条件付き送料無料 / 'paid' 送料別
  shipping    TEXT NOT NULL DEFAULT 'paid' CHECK (shipping IN ('free', 'cond', 'paid')),
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staple_id, mall, item_code)
);
CREATE INDEX IF NOT EXISTS idx_staple_offers_staple ON staple_offers (staple_id, unit_price);

CREATE TABLE IF NOT EXISTS staple_history (
  staple_id    TEXT NOT NULL,
  mall         TEXT NOT NULL CHECK (mall IN ('rakuten', 'yahoo')),
  recorded_on  DATE NOT NULL,
  unit_price   NUMERIC(8,2) NOT NULL,
  price        INTEGER NOT NULL,
  qty          INTEGER NOT NULL,
  PRIMARY KEY (staple_id, mall, recorded_on)
);

ALTER TABLE staple_offers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staple_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staple_offers_select_all"  ON staple_offers  FOR SELECT USING (true);
CREATE POLICY "staple_history_select_all" ON staple_history FOR SELECT USING (true);
GRANT SELECT ON staple_offers, staple_history TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staple_offers, staple_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE staple_offers_id_seq TO service_role;
