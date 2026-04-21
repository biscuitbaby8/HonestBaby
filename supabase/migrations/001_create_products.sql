-- =============================================
-- products テーブル（商品マスタ）
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  sub_category TEXT NOT NULL DEFAULT '本体',
  description TEXT,
  image_url   TEXT,
  rating      NUMERIC(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  unit_count  INTEGER,          -- 消耗品の入数（NULL可）
  unit_name   TEXT,             -- 単位名（NULL可）
  used_price_estimate TEXT,     -- 中古相場テキスト（NULL可）
  ai_analysis TEXT,             -- AI分析コメント
  gift_tags   TEXT[] DEFAULT '{}', -- ギフトタグ配列
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- インデックス
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sub_category ON products(sub_category);
CREATE INDEX idx_products_rating ON products(rating DESC);
