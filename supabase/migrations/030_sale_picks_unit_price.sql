-- =============================================
-- sale_picks に「1単位あたりの数量」を追加する。
-- 消耗品（おむつ・おしりふき・クリーム等）はパック数量がAmazonと楽天/Yahooで
-- 異なることが多く、総額だけを比較すると誤った「お得」判定になる
-- （例: Amazon 5ロール ¥2952 vs 楽天 1ロール ¥1080 を単純比較すると
--  楽天の方が安く見えるが、実際は1ロールあたりAmazonの方が安い）。
-- amazon_qty / other_qty / unit_label が揃っている行だけ、1単位あたりの
-- 単価で比較する（揃っていない商品は従来どおり総額で比較）。
-- =============================================
ALTER TABLE sale_picks ADD COLUMN IF NOT EXISTS amazon_qty NUMERIC CHECK (amazon_qty IS NULL OR amazon_qty > 0);
ALTER TABLE sale_picks ADD COLUMN IF NOT EXISTS other_qty  NUMERIC CHECK (other_qty  IS NULL OR other_qty  > 0);
ALTER TABLE sale_picks ADD COLUMN IF NOT EXISTS unit_label TEXT;

COMMENT ON COLUMN sale_picks.amazon_qty IS 'Amazon出品の内容量（例: 5ロール入りなら5）。unit_labelとセットで使う';
COMMENT ON COLUMN sale_picks.other_qty  IS '楽天/Yahoo最安出品の内容量（例: 1ロールなら1）。unit_labelとセットで使う';
COMMENT ON COLUMN sale_picks.unit_label IS '単位表記（ロール/枚/個/g/mlなど）。NULLなら単価比較せず総額のみ表示';
