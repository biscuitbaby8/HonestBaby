-- =============================================
-- 015: anon ロールに is_blocked の UPDATE 権限を付与
-- =============================================
-- migration 013 で products_update_all ポリシーを作ったが、
-- Postgres レベルの GRANT がないと anon ロールは UPDATE できない。
-- is_blocked カラムのみに限定して付与（他のカラムは変更不可）。
GRANT UPDATE (is_blocked) ON products TO anon, authenticated;
