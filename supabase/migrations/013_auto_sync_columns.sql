-- =============================================
-- 013: 自動同期システム用カラム追加
-- products に自動収集フラグ・楽天コード・人気順位を追加
-- shops_prices にデータソース識別子を追加
-- =============================================

-- products テーブル拡張
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_market_wide') THEN
    ALTER TABLE products ADD COLUMN is_market_wide BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='rakuten_item_code') THEN
    ALTER TABLE products ADD COLUMN rakuten_item_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='popularity_rank') THEN
    ALTER TABLE products ADD COLUMN popularity_rank INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_synced_at') THEN
    ALTER TABLE products ADD COLUMN last_synced_at TIMESTAMPTZ;
  END IF;
END $$;

-- shops_prices テーブル拡張
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops_prices' AND column_name='source') THEN
    ALTER TABLE shops_prices ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
END $$;

-- 楽天コードでの高速検索用インデックス
CREATE INDEX IF NOT EXISTS idx_products_rakuten_item_code ON products(rakuten_item_code);
CREATE INDEX IF NOT EXISTS idx_products_popularity_rank ON products(popularity_rank);
CREATE INDEX IF NOT EXISTS idx_products_is_market_wide ON products(is_market_wide);
CREATE INDEX IF NOT EXISTS idx_shops_prices_source ON shops_prices(source);

-- shops_prices の upsert 用ユニーク制約
-- （同じ商品×同じショップ名の組み合わせで重複を防ぐ）
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_prices_product_shop
  ON shops_prices(product_id, shop_name);

-- Cronバッチ（service_role）からの書き込みを許可するRLSポリシー
DO $$
BEGIN
  -- products: INSERT/UPDATE を全員に許可（service_role key 使用時に必要）
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'products_insert_all' AND tablename = 'products') THEN
    CREATE POLICY "products_insert_all" ON products FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'products_update_all' AND tablename = 'products') THEN
    CREATE POLICY "products_update_all" ON products FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  -- shops_prices: INSERT/UPDATE を全員に許可
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shops_prices_insert_all' AND tablename = 'shops_prices') THEN
    CREATE POLICY "shops_prices_insert_all" ON shops_prices FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shops_prices_update_all' AND tablename = 'shops_prices') THEN
    CREATE POLICY "shops_prices_update_all" ON shops_prices FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
