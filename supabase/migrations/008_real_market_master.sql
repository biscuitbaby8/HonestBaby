-- 既存のテストデータを完全にクリア
TRUNCATE products CASCADE;

-- 主要カテゴリーの「種」となるマスターデータを投入 (初期100点程度)
-- これにより、APIが動く前からサイトの「型」ができあがります

INSERT INTO products (name, category, brand, image_url, description, rating, review_count) VALUES
('サイベックス リベル 2024', 'ベビーカー', 'Cybex', 'https://m.media-amazon.com/images/I/61eL-S1l3LL._AC_SL1500_.jpg', '世界中で大人気の軽量・コンパクトベビーカー。自転車のカゴにも入るサイズ感が魅力です。', 4.9, 120),
('コンビ スゴカル Switch', 'ベビーカー', 'Combi', 'https://m.media-amazon.com/images/I/61jP7o-hVfL._AC_SL1500_.jpg', '独自の振動吸収構造で、赤ちゃんも快適。軽量で持ち運びも楽々です。', 4.8, 85),
('アップリカ マジカルエアー', 'ベビーカー', 'Aprica', 'https://m.media-amazon.com/images/I/61mNnO+k-WL._AC_SL1200_.jpg', '超軽量なB型ベビーカー。ワンタッチ開閉で電車やバスの移動もスムーズ。', 4.7, 92),
('エルゴベビー オムニ ブリーズ', '抱っこ紐', 'Ergobaby', 'https://m.media-amazon.com/images/I/61Y0+3mE3zL._AC_SL1500_.jpg', '通気性抜群のメッシュ素材。新生児から4歳頃まで長く使えます。', 4.9, 210),
('ベビービョルン ハーモニー', '抱っこ紐', 'BabyBjorn', 'https://m.media-amazon.com/images/I/61S-T+X8mRL._AC_SL1500_.jpg', '最上級の快適さを追求したモデル。首すわり前から使えてサポート力も抜群。', 4.8, 145),
('パンパース さらさらケア テープ S', 'おむつ', 'Pampers', 'https://m.media-amazon.com/images/I/71Yv8UfE+6L._AC_SL1500_.jpg', '最長12時間お肌さらさら。通気性に優れ、かぶれにくい設計です。', 4.8, 500),
('ムーニーマン 汗スッキリ パンツ L', 'おむつ', 'Moony', 'https://m.media-amazon.com/images/I/81x-M+3mE3L._AC_SL1500_.jpg', '背中の汗をしっかり吸収。暑い時期でも蒸れにくく快適。', 4.7, 320),
('ピジョン 母乳実感 哺乳びん', 'ミルク・授乳', 'Pigeon', 'https://m.media-amazon.com/images/I/51p-M+3mE3L._AC_SL1500_.jpg', '赤ちゃんが母乳を飲む時と同じ口の動きができる、研究に基づいた哺乳瓶。', 4.9, 850),
('明治 ほほえみ らくらくキューブ', 'ミルク・授乳', 'Meiji', 'https://m.media-amazon.com/images/I/71X-M+3mE3L._AC_SL1500_.jpg', '計量いらずで調乳が簡単なキューブタイプ。お出かけにも便利。', 4.9, 640);

-- 価格データの紐付け（目安）
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, url)
SELECT id, '楽天市場', 'rakuten', 27500, 'https://item.rakuten.co.jp/common-url/' FROM products WHERE brand = 'Cybex';
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, url)
SELECT id, 'Yahoo!ショッピング', 'yahoo', 27000, 'https://shopping.yahoo.co.jp/common-url/' FROM products WHERE brand = 'Cybex';
