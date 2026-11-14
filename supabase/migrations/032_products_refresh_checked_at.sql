-- 価格の取り直し（refresh-stale）の順番待ち用。
-- これまでは last_synced_at の古い順に並べていたが、取得できなかった商品は
-- last_synced_at が更新されず、毎回また先頭に並び直して列が進まなかった
-- （84%の商品が7日以上未更新、Yahooの価格記録は1日数件だった）。
-- 試みた時刻を別に持ち、成否にかかわらず更新して列を進める。
ALTER TABLE products ADD COLUMN IF NOT EXISTS refresh_checked_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_products_refresh_checked ON products (refresh_checked_at NULLS FIRST);
