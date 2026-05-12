-- =============================================
-- 014: is_blocked カラム追加 + 楽天画像品質アップグレード
-- =============================================

-- products テーブルに is_blocked カラムを追加
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_products_is_blocked ON products(is_blocked);

-- 既存の楽天画像 URL を medium (_ex=128x128 or 640x640) から
-- large (_ex=800x800) に一括アップグレード
-- フロントエンドの getHighResImage がさらに _ex=1000x1000 にリライトする
UPDATE products
SET image_url = regexp_replace(image_url, '_ex=\d+x\d+', '_ex=800x800')
WHERE image_url LIKE '%thumbnail.image.rakuten%'
  AND image_url LIKE '%_ex=%';
