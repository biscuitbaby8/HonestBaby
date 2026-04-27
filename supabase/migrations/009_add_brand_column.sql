-- products テーブルに brand カラムを追加
-- （存在しない場合のみ追加するので、2回実行してもエラーになりません）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE products ADD COLUMN brand TEXT DEFAULT '';
  END IF;
END $$;
