-- =============================================
-- 不定期セール（プライムデー・楽天スーパーセール等）の管理テーブル。
-- 公式APIが存在しないため、管理画面（?admin=1 → セール管理）から
-- 手動登録する。登録すると全バッジ・バナー・/saleページに即時反映される。
-- 読み取りは公開、書き込みは service_role（/api/admin-sales）のみ。
-- =============================================
CREATE TABLE IF NOT EXISTS sales (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop          TEXT NOT NULL CHECK (shop IN ('amazon', 'rakuten', 'yahoo')),
  name          TEXT NOT NULL,          -- 例: Amazonプライムデー
  short_name    TEXT,                   -- バッジ用短縮名 例: プライムデー
  start_at      TIMESTAMPTZ NOT NULL,   -- 先行セール含む開始
  main_start_at TIMESTAMPTZ,            -- 本セール開始（先行が無ければNULL）
  end_at        TIMESTAMPTZ NOT NULL,   -- 終了（排他的）
  period_label  TEXT,                   -- 表示用期間 例: 7/7(火)〜7/13(月)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_select_all" ON sales FOR SELECT USING (true);
GRANT SELECT ON sales TO anon, authenticated;
