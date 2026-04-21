-- =============================================
-- sns_reviews テーブル（SNS口コミ管理）
-- 定期バッチで収集・更新する外部SNSの口コミ
-- =============================================
CREATE TABLE IF NOT EXISTS sns_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL CHECK (platform IN ('instagram', 'twitter', 'tiktok')),
  user_handle TEXT NOT NULL,
  content     TEXT NOT NULL,
  likes       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_sns_reviews_product_id ON sns_reviews(product_id);
CREATE INDEX idx_sns_reviews_platform ON sns_reviews(platform);

-- RLS
ALTER TABLE sns_reviews ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能
CREATE POLICY "sns_reviews_select_all" ON sns_reviews
  FOR SELECT USING (true);
