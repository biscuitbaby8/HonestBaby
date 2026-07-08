-- =============================================
-- 価格履歴（Keepa風の価格推移チャート用）。
-- 日次のsync-products cronが shops_prices を更新するタイミングで
-- 「1商品×1ショップ×1日=1行」のスナップショットを記録する。
-- 同日の再同期は最新値で上書き（UNIQUE制約 + upsert）。
-- 読み取りは公開（チャート表示）、書き込みは service_role のみ。
-- =============================================
CREATE TABLE IF NOT EXISTS price_history (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_name   TEXT NOT NULL,     -- '楽天市場' / 'Yahoo!ショッピング'
  price       INTEGER NOT NULL CHECK (price > 0),
  recorded_on DATE NOT NULL,     -- JST基準の日付
  UNIQUE (product_id, shop_name, recorded_on)
);

CREATE INDEX IF NOT EXISTS idx_price_history_product
  ON price_history(product_id, recorded_on DESC);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_history_select_all" ON price_history FOR SELECT USING (true);
GRANT SELECT ON price_history TO anon, authenticated;
