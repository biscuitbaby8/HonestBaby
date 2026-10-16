-- =============================================
-- セール特集の「注目商品」ピックアップ（プライム感謝祭等）。
-- Amazonは価格を自動取得できない（Creators API資格停止中）ため、
-- 管理者が商品(自サイト既存の商品)とAmazonの現在価格を手動で紐付けて登録する。
-- 楽天/Yahooの現在価格・90日価格推移は既存のshops_prices/price_historyを
-- そのまま使うため、ここにはAmazon分の価格だけを持たせればよい。
-- 読み取りは公開、書き込みは service_role（/api/admin-sale-picks）のみ。
-- =============================================
CREATE TABLE IF NOT EXISTS sale_picks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  amazon_url    TEXT NOT NULL,
  amazon_price  INTEGER NOT NULL CHECK (amazon_price > 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sale_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_sale_picks_sale ON sale_picks(sale_id, display_order);

ALTER TABLE sale_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_picks_select_all" ON sale_picks FOR SELECT USING (true);
GRANT SELECT ON sale_picks TO anon, authenticated;

-- 2026/10/30のSupabase仕様変更（新規テーブルはData APIへのデフォルト付与が
-- 廃止）に備え、service_role の読み書き権限も明示しておく。
GRANT SELECT, INSERT, UPDATE, DELETE ON sale_picks TO service_role;
