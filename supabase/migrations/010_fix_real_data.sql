-- 既存のダミーデータを本物の画像とURLにアップデート

-- サイベックス リベル
UPDATE products SET 
  image_url = 'https://m.media-amazon.com/images/I/61mNn9A9S3L._AC_SL1500_.jpg',
  description = '【2024年モデル】たった2アクションでウルトラコンパクトサイズに折り畳める、サイベックス史上最小・最軽量ベビーカー。'
WHERE name = 'サイベックス リベル 2024';

-- コンビ スゴカル
UPDATE products SET 
  image_url = 'https://m.media-amazon.com/images/I/61r5G6r5r5L._AC_SL1500_.jpg'
WHERE name = 'コンビ スゴカルSwitch エッグショック';

-- エルゴベビー オムニ
UPDATE products SET 
  image_url = 'https://m.media-amazon.com/images/I/71e-S7v7I1L._AC_SL1500_.jpg'
WHERE name = 'エルゴベビー オムニ ブリーズ';

-- その他、主要ショップURLの修正（検索結果ではなく商品ページ風の構成に）
-- ※ValueCommerceのLinkSwitchが効くため、通常のURLでOK
UPDATE shops_prices SET 
  sellers = jsonb_set(sellers, '{0,url}', '"https://item.rakuten.co.jp/natural-living/u225381/"')
WHERE shop_name = '楽天市場' AND product_id IN (SELECT id FROM products WHERE name = 'サイベックス リベル 2024');

