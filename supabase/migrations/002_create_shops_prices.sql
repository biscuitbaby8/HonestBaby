-- =============================================
-- shops_prices テーブル（ショップ・価格情報）
-- 1商品に対する複数ショップの価格とアフィリエイトリンクを管理
-- =============================================
CREATE TABLE IF NOT EXISTS shops_prices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_name   TEXT NOT NULL,
  shop_type   TEXT NOT NULL CHECK (shop_type IN ('official', 'mall', 'specialty')),
  lowest_price INTEGER NOT NULL,
  benefits    TEXT[],           -- 公式ストア独自の特典（NULL可）
  sellers     JSONB NOT NULL DEFAULT '[]',
  -- sellers の想定構造:
  -- [
  --   {
  --     "name": "セレクトベビー (Amazon)",
  --     "price": 3800,
  --     "shipping": 0,
  --     "points": 38,
  --     "url": "https://...",
  --     "note": "定期購入"  -- optional
  --   }
  -- ]
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_shops_prices_updated_at
  BEFORE UPDATE ON shops_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- インデックス
CREATE INDEX idx_shops_prices_product_id ON shops_prices(product_id);
CREATE INDEX idx_shops_prices_shop_type ON shops_prices(shop_type);
CREATE INDEX idx_shops_prices_lowest_price ON shops_prices(lowest_price);
