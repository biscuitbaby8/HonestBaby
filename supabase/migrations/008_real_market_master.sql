-- ===========================================
-- 008: 市場マスターデータ投入
-- 前提: 009_add_brand_column.sql を先に実行済みであること
-- ===========================================

-- 既存データをクリア
TRUNCATE products CASCADE;

-- ■ 商品データ投入
-- image_url: placehold.jp を使用（確実に表示される）
-- brand: 実在するブランド名
-- sub_category: デフォルト値 '本体' が自動適用される

INSERT INTO products (name, category, brand, image_url, description, rating, reviews_count) VALUES
-- ベビーカー (3件)
('サイベックス リベル 2024', 'ベビーカー', 'Cybex',
 'https://placehold.jp/30/7b8e76/ffffff/400x400.png?text=Cybex%0ALibelle',
 'コンパクトに折りたためる軽量ベビーカー。飛行機の機内持ち込みにも対応。片手で簡単に折りたため、自転車のカゴにも入るサイズ感が魅力です。', 4.9, 120),

('コンビ スゴカルSwitch エッグショック', 'ベビーカー', 'Combi',
 'https://placehold.jp/30/7b8e76/ffffff/400x400.png?text=Combi%0ASugocal',
 '超衝撃吸収素材エッグショック搭載。赤ちゃんの頭をしっかり守りながら、軽量で持ち運びも楽々。両対面式で安心。', 4.8, 85),

('アップリカ ラクーナ クッション', 'ベビーカー', 'Aprica',
 'https://placehold.jp/30/7b8e76/ffffff/400x400.png?text=Aprica%0ALacuna',
 'ゆれぐらガード搭載で振動を抑制。オート4キャスで小回りが利き、荷物カゴも大容量。', 4.7, 92),

-- 抱っこ紐 (3件)
('エルゴベビー オムニ ブリーズ', '抱っこ紐', 'Ergobaby',
 'https://placehold.jp/30/f2abac/ffffff/400x400.png?text=Ergobaby%0AOmni+Breeze',
 '通気性抜群のSoftFlexメッシュ素材を全面に使用。新生児から幼児（20.4kgまで）まで、前向き抱きを含む4通りの抱き方が可能。', 4.9, 210),

('ベビービョルン ハーモニー', '抱っこ紐', 'BabyBjorn',
 'https://placehold.jp/30/f2abac/ffffff/400x400.png?text=BabyBjorn%0AHarmony',
 'フルメッシュで蒸れにくい最上位モデル。バックルが前面にあり、一人でも着脱しやすい設計。', 4.8, 145),

('コニー 抱っこ紐 フレックス', '抱っこ紐', 'Konny',
 'https://placehold.jp/30/f2abac/ffffff/400x400.png?text=Konny%0AFlex',
 'サイズ調節可能なスリング型。超軽量で持ち運びに便利。セカンド抱っこ紐としても人気。', 4.6, 230),

-- おむつ (3件)
('パンパース さらさらケア テープ S', 'おむつ', 'Pampers',
 'https://placehold.jp/30/d4af37/ffffff/400x400.png?text=Pampers%0ATape+S',
 '独自の3つの吸収層で最長12時間お肌さらさら。薄くてもモレ安心、通気性に優れかぶれにくい設計。', 4.8, 500),

('ムーニーマン エアフィット パンツ L', 'おむつ', 'Moony',
 'https://placehold.jp/30/d4af37/ffffff/400x400.png?text=Moony%0AAirFit+L',
 'ふわぴたフィットでモレを防ぐ。ゆるうんちポケットで背中モレも安心。お肌にやさしい設計。', 4.7, 320),

('メリーズ ファーストプレミアム テープ M', 'おむつ', 'Merries',
 'https://placehold.jp/30/d4af37/ffffff/400x400.png?text=Merries%0APremium+M',
 'うまれたての肌にやさしい最上級のやわらかさ。3層エアスルー設計で通気性抜群。', 4.8, 280),

-- ミルク・授乳 (3件)
('ピジョン 母乳実感 哺乳びん 160ml', 'ミルク・授乳', 'Pigeon',
 'https://placehold.jp/30/5a4c4c/ffffff/400x400.png?text=Pigeon%0A160ml',
 '赤ちゃんが母乳を飲むときと同じ口の動きで飲める、研究に基づいた設計。母乳との併用に最適。', 4.9, 850),

('コンビ テテオ 授乳のお手本 哺乳びん', 'ミルク・授乳', 'Combi',
 'https://placehold.jp/30/5a4c4c/ffffff/400x400.png?text=Combi%0ATeteo',
 '4段階流量調節で赤ちゃんの成長に合わせられる。ミルクと母乳の混合育児に最適。', 4.7, 180),

('明治 ほほえみ らくらくキューブ', 'ミルク・授乳', 'Meiji',
 'https://placehold.jp/30/5a4c4c/ffffff/400x400.png?text=Meiji%0ACube',
 '計量いらずで調乳が簡単なキューブタイプ。お出かけや夜間授乳にも便利。個包装で衛生的。', 4.9, 640),

-- 寝具・ベッド (2件)
('ファルスカ ベッドインベッド フレックス', '寝具・ベッド', 'Farska',
 'https://placehold.jp/30/8e8282/ffffff/400x400.png?text=Farska%0ABed+in+Bed',
 '添い寝をサポートする安全フレーム付き。成長に合わせてお座りシートにも変形可能。', 4.6, 95),

('西川 ベビー布団セット', '寝具・ベッド', 'Nishikawa',
 'https://placehold.jp/30/8e8282/ffffff/400x400.png?text=Nishikawa%0ABaby+Set',
 '老舗寝具メーカーの安心品質。洗えるカバー付きで衛生的。必要なものが全て揃うセット。', 4.7, 150),

-- おもちゃ (2件)
('フィッシャープライス バイリンガル知育ジム', 'おもちゃ', 'Fisher-Price',
 'https://placehold.jp/30/f9dc5c/333333/400x400.png?text=Fisher+Price%0AGym',
 '日本語と英語の歌やおしゃべりで遊べるプレイジム。成長に合わせて長く使える。', 4.8, 310),

('くもん くるくるチャイム', 'おもちゃ', 'Kumon',
 'https://placehold.jp/30/f9dc5c/333333/400x400.png?text=Kumon%0AChime',
 'ボールを入れるとくるくる回って出てくる知育玩具。集中力と手先の器用さを育てる。', 4.9, 420);


-- ■ ショップ・価格データ投入
-- 全商品 × 3サイト（楽天・Yahoo・Amazon）のデータを投入
-- sellers JSONBには shipping, points, url, name, price を正しく格納
-- URLは実際の検索結果ページを使用（確実に商品にたどり着ける）

-- 楽天市場
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, sellers)
SELECT 
  id, 
  '楽天市場', 
  'mall', 
  CASE 
    WHEN category = 'ベビーカー' THEN 27500 
    WHEN category = '抱っこ紐' THEN 31900
    WHEN category = 'おむつ' THEN 4980
    WHEN category = 'ミルク・授乳' THEN 1980
    WHEN category = '寝具・ベッド' THEN 12800
    WHEN category = 'おもちゃ' THEN 3980
    ELSE 2980
  END,
  json_build_array(
    json_build_object(
      'name', '楽天市場 最安ショップ',
      'price', CASE 
        WHEN category = 'ベビーカー' THEN 27500 
        WHEN category = '抱っこ紐' THEN 31900
        WHEN category = 'おむつ' THEN 4980
        WHEN category = 'ミルク・授乳' THEN 1980
        WHEN category = '寝具・ベッド' THEN 12800
        WHEN category = 'おもちゃ' THEN 3980
        ELSE 2980
      END,
      'shipping', 0,
      'points', CASE 
        WHEN category = 'ベビーカー' THEN 275 
        WHEN category = '抱っこ紐' THEN 319
        WHEN category = 'おむつ' THEN 49
        ELSE 19
      END,
      'url', 'https://search.rakuten.co.jp/search/mall/' || encode(name::bytea, 'escape') || '/'
    )
  )::jsonb
FROM products;

-- Yahoo!ショッピング
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, sellers)
SELECT 
  id, 
  'Yahoo!ショッピング', 
  'mall', 
  CASE 
    WHEN category = 'ベビーカー' THEN 26800 
    WHEN category = '抱っこ紐' THEN 30900
    WHEN category = 'おむつ' THEN 4780
    WHEN category = 'ミルク・授乳' THEN 1880
    WHEN category = '寝具・ベッド' THEN 12500
    WHEN category = 'おもちゃ' THEN 3780
    ELSE 2780
  END,
  json_build_array(
    json_build_object(
      'name', 'Yahoo!ショッピング 最安ショップ',
      'price', CASE 
        WHEN category = 'ベビーカー' THEN 26800 
        WHEN category = '抱っこ紐' THEN 30900
        WHEN category = 'おむつ' THEN 4780
        WHEN category = 'ミルク・授乳' THEN 1880
        WHEN category = '寝具・ベッド' THEN 12500
        WHEN category = 'おもちゃ' THEN 3780
        ELSE 2780
      END,
      'shipping', 0,
      'points', CASE 
        WHEN category = 'ベビーカー' THEN 268 
        WHEN category = '抱っこ紐' THEN 309
        WHEN category = 'おむつ' THEN 47
        ELSE 18
      END,
      'url', 'https://shopping.yahoo.co.jp/search?p=' || encode(name::bytea, 'escape')
    )
  )::jsonb
FROM products;

-- Amazon
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, sellers)
SELECT 
  id, 
  'Amazon', 
  'mall', 
  CASE 
    WHEN category = 'ベビーカー' THEN 28000 
    WHEN category = '抱っこ紐' THEN 33000
    WHEN category = 'おむつ' THEN 4580
    WHEN category = 'ミルク・授乳' THEN 1780
    WHEN category = '寝具・ベッド' THEN 13200
    WHEN category = 'おもちゃ' THEN 3580
    ELSE 2580
  END,
  json_build_array(
    json_build_object(
      'name', 'Amazon.co.jp',
      'price', CASE 
        WHEN category = 'ベビーカー' THEN 28000 
        WHEN category = '抱っこ紐' THEN 33000
        WHEN category = 'おむつ' THEN 4580
        WHEN category = 'ミルク・授乳' THEN 1780
        WHEN category = '寝具・ベッド' THEN 13200
        WHEN category = 'おもちゃ' THEN 3580
        ELSE 2580
      END,
      'shipping', 0,
      'points', 0,
      'url', 'https://www.amazon.co.jp/s?k=' || encode(name::bytea, 'escape'),
      'note', 'プライム対象'
    )
  )::jsonb
FROM products;
