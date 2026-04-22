-- 既存のデータをクリア
TRUNCATE products CASCADE;

-- 主要カテゴリーのマスターデータ投入
INSERT INTO products (name, category, brand, image_url, description, rating, reviews_count) VALUES
('サイベックス リベル 2024', 'ベビーカー', 'Cybex', 'https://thumbnail.image.rakuten.co.jp/@0_mall/natural-living/cabinet/02/u955602_1.jpg', '世界中で大人気の軽量・コンパクトベビーカー。自転車のカゴにも入るサイズ感が魅力です。', 4.9, 120),
('コンビ スゴカル Switch', 'ベビーカー', 'Combi', 'https://thumbnail.image.rakuten.co.jp/@0_mall/netbaby/cabinet/818/a13818_1.jpg', '独自の振動吸収構造で、赤ちゃんも快適。軽量で持ち運びも楽々です。', 4.8, 85),
('アップリカ マジカルエアー', 'ベビーカー', 'Aprica', 'https://thumbnail.image.rakuten.co.jp/@0_mall/netbaby/cabinet/421/a22421_1.jpg', '超軽量なB型ベビーカー。ワンタッチ開閉で電車やバスの移動もスムーズ。', 4.7, 92),
('エルゴベビー オムニ ブリーズ', '抱っこ紐', 'Ergobaby', 'https://thumbnail.image.rakuten.co.jp/@0_mall/twinklefunny/cabinet/ergo/ergo-breeze_1.jpg', '通気性抜群のメッシュ素材。新生児から4歳頃まで長く使えます。', 4.9, 210),
('ベビービョルン ハーモニー', '抱っこ紐', 'BabyBjorn', 'https://thumbnail.image.rakuten.co.jp/@0_mall/twinklefunny/cabinet/babybjorn/bj-harmony_1.jpg', '最上級の快適さを追求したモデル。首すわり前から使えてサポート力も抜群。', 4.8, 145),
('パンパース さらさらケア テープ S', 'おむつ', 'Pampers', 'https://thumbnail.image.rakuten.co.jp/@0_mall/rakuten24/cabinet/841/4902430148841.jpg', '最長12時間お肌さらさら。通気性に優れ、かぶれにくい設計です。', 4.8, 500),
('ムーニーマン 汗スッキリ パンツ L', 'おむつ', 'Moony', 'https://thumbnail.image.rakuten.co.jp/@0_mall/rakuten24/cabinet/235/4903111248235.jpg', '背中の汗をしっかり吸収。暑い時期でも蒸れにくく快適。', 4.7, 320),
('ピジョン 母乳実感 哺乳びん', 'ミルク・授乳', 'Pigeon', 'https://thumbnail.image.rakuten.co.jp/@0_mall/pigeon-official/cabinet/02/1026750_1.jpg', '赤ちゃんが母乳を飲む時と同じ口の動きができる、研究に基づいた哺乳瓶。', 4.9, 850),
('明治 ほほえみ らくらくキューブ', 'ミルク・授乳', 'Meiji', 'https://thumbnail.image.rakuten.co.jp/@0_mall/rakuten24/cabinet/847/4902705116847.jpg', '計量いらずで調乳が簡単なキューブタイプ。お出かけにも便利。', 4.9, 640);

-- 全ての商品にショップデータを紐付け（これで価格と比較が表示されます）
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, sellers)
SELECT id, '楽天市場', 'mall', 
  CASE 
    WHEN category = 'ベビーカー' THEN 27500 
    WHEN category = '抱っこ紐' THEN 31900
    WHEN category = 'おむつ' THEN 4980
    ELSE 1980
  END, 
  '[{"name": "楽天市場", "price": 27000, "url": "https://www.rakuten.co.jp"}]'::jsonb 
FROM products;

INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, sellers)
SELECT id, 'Yahoo!ショッピング', 'mall', 
  CASE 
    WHEN category = 'ベビーカー' THEN 27000 
    WHEN category = '抱っこ紐' THEN 31000
    WHEN category = 'おむつ' THEN 4800
    ELSE 1800
  END, 
  '[{"name": "Yahoo!ショッピング", "price": 26500, "url": "https://shopping.yahoo.co.jp"}]'::jsonb 
FROM products;
