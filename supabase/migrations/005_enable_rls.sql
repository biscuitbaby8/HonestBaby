-- =============================================
-- RLS (Row Level Security) for products & shops_prices
-- =============================================

-- products: 誰でも読み取り可能
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_all" ON products
  FOR SELECT USING (true);

-- shops_prices: 誰でも読み取り可能
ALTER TABLE shops_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shops_prices_select_all" ON shops_prices
  FOR SELECT USING (true);
