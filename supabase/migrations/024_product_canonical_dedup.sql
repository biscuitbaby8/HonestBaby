-- 重複商品ページの正規化（Search Console「重複・Googleが別の正規ページを選択」対策）。
-- 同一商品が別IDで複数の /product/[id] ページになっているため、代表ページへ集約する。

-- 1) 代表(正規)ページID。自分が代表/単独ならNULL。非代表は代表IDを持ち、
--    /product/[id] は代表へ 308(恒久)リダイレクトする。
ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_id uuid REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_canonical_id ON products(canonical_id);
COMMENT ON COLUMN products.canonical_id IS '重複商品の代表(正規)ページID。自分が代表/単独ならNULL。';

-- 2) 重複判定用の正規化名キー（空白除去→先頭30文字・小文字）。アプリの productNameKey と一致。
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_key text
  GENERATED ALWAYS AS (left(lower(regexp_replace(coalesce(name,''), '[\s　]', '', 'g')), 30)) STORED;
CREATE INDEX IF NOT EXISTS idx_products_name_key ON products(name_key);
COMMENT ON COLUMN products.name_key IS '重複判定用の正規化名キー（空白除去→先頭30文字・小文字）。';

-- 3) 既存の重複に canonical_id を割り当てる（代表＝非ブロック→出品ショップ最多→最古）。
WITH meta AS (
  SELECT p.id, p.created_at, coalesce(p.is_blocked, false) AS blocked, p.name_key,
    (SELECT count(*) FROM shops_prices sp WHERE sp.product_id = p.id) AS shop_count
  FROM products p
),
grp AS (
  SELECT name_key FROM meta WHERE name_key <> '' GROUP BY name_key HAVING count(*) > 1
),
rep AS (
  SELECT DISTINCT ON (name_key) name_key, id AS rep_id
  FROM meta
  WHERE name_key IN (SELECT name_key FROM grp)
  ORDER BY name_key, blocked ASC, shop_count DESC, created_at ASC NULLS LAST, id ASC
)
UPDATE products p
SET canonical_id = r.rep_id
FROM meta m
JOIN rep r ON r.name_key = m.name_key
WHERE p.id = m.id AND m.id <> r.rep_id;

-- 4) 新規INSERT時、同一name_keyの既存代表があれば canonical_id を自動設定する。
--    取り込み/日次sync/手動 いずれの経路で増えても重複ページが即リダイレクト対象になる。
CREATE OR REPLACE FUNCTION set_product_canonical() RETURNS trigger AS $$
DECLARE rep uuid;
BEGIN
  IF NEW.canonical_id IS NULL AND NEW.name IS NOT NULL THEN
    SELECT id INTO rep
    FROM products
    WHERE name_key = left(lower(regexp_replace(coalesce(NEW.name,''), '[\s　]', '', 'g')), 30)
      AND canonical_id IS NULL
      AND id <> NEW.id
    ORDER BY (CASE WHEN coalesce(is_blocked, false) THEN 1 ELSE 0 END) ASC, created_at ASC NULLS LAST, id ASC
    LIMIT 1;
    IF rep IS NOT NULL THEN
      NEW.canonical_id := rep;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_product_canonical ON products;
CREATE TRIGGER trg_set_product_canonical
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION set_product_canonical();
