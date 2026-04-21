-- =============================================
-- reviews テーブル（ネイティブ口コミ / Honestレビュー）
-- ユーザーがアプリ内で投稿する口コミを保存
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID,             -- 認証ユーザーID（NULL可: 匿名投稿対応）
  user_name   TEXT NOT NULL DEFAULT 'ゲスト',
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content     TEXT NOT NULL,
  image_url   TEXT,             -- ユーザーアップロード画像（NULL可）
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- RLS (Row Level Security) 
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能
CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT USING (true);

-- 誰でも挿入可能（匿名投稿対応）
CREATE POLICY "reviews_insert_all" ON reviews
  FOR INSERT WITH CHECK (true);
