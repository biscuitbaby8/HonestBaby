-- ===========================================
-- 012: エアラブ (airluv.) 全モデル追加
-- ブランド: Poled（ポレッド）
-- カテゴリ: ベビーカー > 周辺グッズ
-- ===========================================

INSERT INTO products (name, category, sub_category, brand, image_url, description, rating, reviews_count) VALUES

('エアラブ3 ファン付きベビーカーシート', 'ベビーカー', '周辺グッズ', 'Poled',
 'https://placehold.jp/30/7b8e76/ffffff/400x400.png?text=airluv3%0APoled',
 'Poled（ポレッド）のファン付きベビーカーシート。シート内の空気孔を通じて赤ちゃんの全身に風を届ける独自設計。ほぼ全メーカーのベビーカー・チャイルドシートに対応。手洗い可能。モバイルバッテリーで外出先でも使用可能。',
 4.6, 180),

('エアラブ4 ファン付きベビーカーシート', 'ベビーカー', '周辺グッズ', 'Poled',
 'https://placehold.jp/30/7b8e76/ffffff/400x400.png?text=airluv4%0APoled',
 '【2023年モデル】エアラブ3から吸気性能と内部構造を改良。ベビーカー・チャイルドシート・バウンサーなど多用途対応。メッシュ素材で汗と刺激を最小限に抑え、快適な夏のお出かけをサポート。',
 4.7, 310),

('エアラブ4プラス ファン付きベビーカーシート', 'ベビーカー', '周辺グッズ', 'Poled',
 'https://placehold.jp/30/7b8e76/ffffff/400x400.png?text=airluv4%2B%0APoled',
 '【エアラブ4の上位モデル】より強力な風量と静音設計を両立。シリコン素材で肌への刺激をさらに軽減。ハイローラック・バウンサーにも対応し、家でも外でも使えるオールラウンダーモデル。',
 4.7, 95),

('エアラブ5 ファン付きベビーカーシート', 'ベビーカー', '周辺グッズ', 'Poled',
 'https://placehold.jp/30/7b8e76/ffffff/400x400.png?text=airluv5%0APoled',
 '【2024年最新モデル】USB Type-C給電対応。消費電力はそのままに風量を大幅アップした最新設計。シート内の空気循環を最適化し、赤ちゃんの頭からお尻まで均一に冷却。ほぼ全ベビーカーブランドに対応。',
 4.8, 420);

-- =============================================
-- shops_prices: エアラブ各モデルの価格情報
-- =============================================

-- エアラブ3
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, 'Amazon', 'mall', 7980, NULL,
  '[{"name": "Amazon.co.jp", "price": 7980, "shipping": 0, "points": 79, "url": "https://www.amazon.co.jp/s?k=%E3%82%A8%E3%82%A2%E3%83%A9%E3%83%963+Poled"}]'::jsonb
FROM products WHERE name = 'エアラブ3 ファン付きベビーカーシート';

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, '楽天市場', 'mall', 8250, NULL,
  '[{"name": "楽天市場", "price": 8250, "shipping": 0, "points": 412, "url": "https://search.rakuten.co.jp/search/mall/%E3%82%A8%E3%82%A2%E3%83%A9%E3%83%963+Poled/"}]'::jsonb
FROM products WHERE name = 'エアラブ3 ファン付きベビーカーシート';

-- エアラブ4
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, 'Poled Japan 公式', 'official', 9900, ARRAY['公式保証付き', '送料無料'],
  '[{"name": "Poled Japan 公式ストア", "price": 9900, "shipping": 0, "points": 99, "url": "https://shop.poled.co.jp/en"}]'::jsonb
FROM products WHERE name = 'エアラブ4 ファン付きベビーカーシート';

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, 'Amazon', 'mall', 9680, NULL,
  '[{"name": "Amazon.co.jp", "price": 9680, "shipping": 0, "points": 96, "url": "https://www.amazon.co.jp/s?k=%E3%82%A8%E3%82%A2%E3%83%A9%E3%83%964+Poled"}]'::jsonb
FROM products WHERE name = 'エアラブ4 ファン付きベビーカーシート';

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, '楽天市場', 'mall', 9900, NULL,
  '[{"name": "楽天市場", "price": 9900, "shipping": 0, "points": 495, "url": "https://search.rakuten.co.jp/search/mall/%E3%82%A8%E3%82%A2%E3%83%A9%E3%83%964+Poled/"}]'::jsonb
FROM products WHERE name = 'エアラブ4 ファン付きベビーカーシート';

-- エアラブ4プラス
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, 'Poled Japan 公式', 'official', 11900, ARRAY['公式保証付き', '送料無料'],
  '[{"name": "Poled Japan 公式ストア", "price": 11900, "shipping": 0, "points": 119, "url": "https://shop.poled.co.jp/en"}]'::jsonb
FROM products WHERE name = 'エアラブ4プラス ファン付きベビーカーシート';

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, 'Amazon', 'mall', 11500, NULL,
  '[{"name": "Amazon.co.jp", "price": 11500, "shipping": 0, "points": 115, "url": "https://www.amazon.co.jp/s?k=%E3%82%A8%E3%82%A2%E3%83%A9%E3%83%964%2B+Poled"}]'::jsonb
FROM products WHERE name = 'エアラブ4プラス ファン付きベビーカーシート';

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, '楽天市場', 'mall', 11800, NULL,
  '[{"name": "楽天市場", "price": 11800, "shipping": 0, "points": 590, "url": "https://search.rakuten.co.jp/search/mall/%E3%82%A8%E3%82%A2%E3%83%A9%E3%83%964%E3%83%97%E3%83%A9%E3%82%B9+Poled/"}]'::jsonb
FROM products WHERE name = 'エアラブ4プラス ファン付きベビーカーシート';

-- エアラブ5（最新）
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, 'Poled Japan 公式', 'official', 11900, ARRAY['公式保証付き', '送料無料', 'USB Type-C対応'],
  '[{"name": "Poled Japan 公式ストア", "price": 11900, "shipping": 0, "points": 119, "url": "https://shop.poled.co.jp/en"}]'::jsonb
FROM products WHERE name = 'エアラブ5 ファン付きベビーカーシート';

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, 'Amazon', 'mall', 11480, NULL,
  '[{"name": "Amazon.co.jp", "price": 11480, "shipping": 0, "points": 114, "url": "https://www.amazon.co.jp/s?k=%E3%82%A8%E3%82%A2%E3%83%A9%E3%83%965+Poled"}]'::jsonb
FROM products WHERE name = 'エアラブ5 ファン付きベビーカーシート';

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, '楽天市場', 'mall', 11980, NULL,
  '[{"name": "楽天市場", "price": 11980, "shipping": 0, "points": 599, "url": "https://item.rakuten.co.jp/justrich/10000977/"}]'::jsonb
FROM products WHERE name = 'エアラブ5 ファン付きベビーカーシート';

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers)
SELECT id, 'ベビーザらス', 'specialty', 12000, ARRAY['店舗受け取り可'],
  '[{"name": "ベビーザらス", "price": 12000, "shipping": 0, "points": 120, "url": "https://www.babiesrus.co.jp/ja-jp/airluv/"}]'::jsonb
FROM products WHERE name = 'エアラブ5 ファン付きベビーカーシート';
