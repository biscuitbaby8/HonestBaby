-- =============================================
-- Trigger to update product rating and reviews_count
-- =============================================

-- 製品の rating と reviews_count を再計算する関数
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
BEGIN
  -- INSERT or UPDATE の場合は NEW、DELETE の場合は OLD を使用
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.product_id;
  ELSE
    target_id := NEW.product_id;
  END IF;

  -- products テーブルの該当商品の数値を一括更新
  UPDATE products
  SET 
    rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = target_id), 0.0),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = target_id)
  WHERE id = target_id;
  
  RETURN NULL; -- AFTER trigger なのでこれでOK
END;
$$ LANGUAGE plpgsql;

-- レビューの挿入・更新・削除時に発火するトリガー
DROP TRIGGER IF EXISTS trigger_update_product_rating ON reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();
