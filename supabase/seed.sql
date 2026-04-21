-- =============================================
-- Honest Baby シードデータ
-- honest-baby-app/App.jsx の PRODUCTS 配列を完全再現
-- =============================================

-- 固定UUIDで商品を投入（FK参照に使用）
-- 商品1: オーガニックコットン ロンパース
INSERT INTO products (id, name, category, sub_category, description, image_url, rating, reviews_count, unit_count, unit_name, used_price_estimate, ai_analysis, gift_tags)
VALUES (
  '11111111-1111-1111-1111-000000000001',
  'オーガニックコットン ロンパース',
  'ウェア', '本体',
  '肌に優しい100%オーガニックコットンを使用。出産祝いの定番です。',
  'https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&q=80&w=600',
  4.8, 125, NULL, NULL, NULL,
  '肌への優しさで高評価。ギフトの際は、名入れや専用ボックス対応の公式ストア経由が圧倒的に喜ばれます。',
  ARRAY['出産祝い', '3000円〜', '友人へ']
);

-- 商品2: エルゴノミック 抱っこ紐 360
INSERT INTO products (id, name, category, sub_category, description, image_url, rating, reviews_count, unit_count, unit_name, used_price_estimate, ai_analysis, gift_tags)
VALUES (
  '11111111-1111-1111-1111-000000000002',
  'エルゴノミック 抱っこ紐 360',
  '抱っこ紐', '本体',
  '圧倒的サポート力の定番モデル。前向き抱っこも可能。',
  'https://images.unsplash.com/photo-1602434228300-a645bce6891b?auto=format&fit=crop&q=80&w=600',
  4.9, 313, NULL, NULL, '15,000円〜20,000円',
  '腰痛対策ならこれ一択。偽物が多く出回っているため、安心の正規代理店か公式ショップでの購入を強く推奨します。',
  ARRAY['家族・親戚から', '10000円〜', '出産準備']
);

-- 商品3: 抱っこ紐用 今治よだれカバーセット
INSERT INTO products (id, name, category, sub_category, description, image_url, rating, reviews_count, unit_count, unit_name, used_price_estimate, ai_analysis, gift_tags)
VALUES (
  '11111111-1111-1111-1111-000000000003',
  '抱っこ紐用 今治よだれカバーセット',
  '抱っこ紐', '周辺グッズ',
  '今治タオルを使用した、吸水性抜群のカバー。洗い替えに便利。',
  'https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&q=80&w=600',
  4.6, 88, NULL, NULL, NULL,
  '肌触りが非常に良く、洗濯機で丸洗いしてもゴワつきにくいと高評価です。',
  ARRAY['友人へ', '3000円〜']
);

-- 商品4: 軽量アーバンベビーカー A型
INSERT INTO products (id, name, category, sub_category, description, image_url, rating, reviews_count, unit_count, unit_name, used_price_estimate, ai_analysis, gift_tags)
VALUES (
  '11111111-1111-1111-1111-000000000004',
  '軽量アーバンベビーカー A型',
  'ベビーカー', '本体',
  '片手で折りたためる超軽量モデル。都会の狭い道もスムーズ。',
  'https://images.unsplash.com/photo-1591084728795-1149fb3a288d?auto=format&fit=crop&q=80&w=600',
  4.7, 45, NULL, NULL, '12,000円〜18,000円',
  '軽さと走行性のバランスが最高。実物を見て買いたい人は店舗受け取りができる専門ショップが安心です。',
  ARRAY['家族・親戚から', '10000円〜', '出産準備']
);

-- 商品5: ベビーカー用ドリンクホルダー
INSERT INTO products (id, name, category, sub_category, description, image_url, rating, reviews_count, unit_count, unit_name, used_price_estimate, ai_analysis, gift_tags)
VALUES (
  '11111111-1111-1111-1111-000000000005',
  'ベビーカー用ドリンクホルダー',
  'ベビーカー', '周辺グッズ',
  'スマホと飲み物を同時にホールド。安定感抜群。',
  'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
  4.5, 156, NULL, NULL, NULL,
  '揺れに強く、ほとんどのベビーカーに装着可能な汎用性が魅力。',
  ARRAY[]::TEXT[]
);

-- 商品6: プレミアム オーガニックおむつ テープ新生児用 64枚入
INSERT INTO products (id, name, category, sub_category, description, image_url, rating, reviews_count, unit_count, unit_name, used_price_estimate, ai_analysis, gift_tags)
VALUES (
  '11111111-1111-1111-1111-000000000006',
  'プレミアム オーガニックおむつ テープ新生児用 64枚入',
  'おむつ・消耗品', '本体',
  '赤ちゃんの肌に最も優しい紙おむつ。実用性No.1。',
  'https://images.unsplash.com/photo-1517677129300-07b130802f46?auto=format&fit=crop&q=80&w=600',
  4.8, 890, 64, '枚', NULL,
  '実用的な贈り物を探している方に最適。おむつケーキのベースとしてもよく使われます。',
  ARRAY['出産祝い', '実用品']
);

-- 商品7: シリコン製ベビー食器＆ビブセット
INSERT INTO products (id, name, category, sub_category, description, image_url, rating, reviews_count, unit_count, unit_name, used_price_estimate, ai_analysis, gift_tags)
VALUES (
  '11111111-1111-1111-1111-000000000007',
  'シリコン製ベビー食器＆ビブセット',
  '食事用品', '本体',
  'ひっくり返らないお皿と、食べこぼしキャッチのスタイセット。離乳食デビューに。',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
  4.8, 215, NULL, NULL, NULL,
  '生後6ヶ月頃からの離乳食に必須。ハーフバースデーの贈り物として非常に人気が高いです。',
  ARRAY['ハーフバースデー', '3000円〜', '友人へ']
);


-- =============================================
-- shops_prices シードデータ
-- =============================================

-- 商品1: オーガニックコットン ロンパース
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers) VALUES
('11111111-1111-1111-1111-000000000001', 'Haruulala (公式ストア)', 'official', 4200,
 ARRAY['名入れ刺繍無料', '専用ギフトボックス', 'オリジナルメッセージカード'],
 '[{"name": "Haruulala Online", "price": 4200, "shipping": 0, "points": 42, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000001', 'Amazon', 'mall', 3800, NULL,
 '[{"name": "セレクトベビー (Amazon)", "price": 3800, "shipping": 0, "points": 38, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000001', '楽天市場', 'mall', 3980, NULL,
 '[{"name": "楽天ベビー館", "price": 3980, "shipping": 0, "points": 159, "url": "#"}]'::jsonb);

-- 商品2: エルゴノミック 抱っこ紐 360
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers) VALUES
('11111111-1111-1111-1111-000000000002', 'DADWAY (日本正規総代理店)', 'official', 35200,
 ARRAY['2年間の正規保証', 'よだれパッドプレゼント', 'ポイント10%還元'],
 '[{"name": "DADWAY 公式ストア", "price": 35200, "shipping": 0, "points": 3520, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000002', '楽天市場', 'mall', 35200, NULL,
 '[{"name": "NetBabyWorld", "price": 35200, "shipping": 0, "points": 1760, "url": "#"}, {"name": "ナチュラルリビング", "price": 35200, "shipping": 0, "points": 1760, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000002', 'Amazon', 'mall', 35200, NULL,
 '[{"name": "Amazon.co.jp (出品者確認必須)", "price": 35200, "shipping": 0, "points": 352, "url": "#"}]'::jsonb);

-- 商品3: 今治よだれカバーセット
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers) VALUES
('11111111-1111-1111-1111-000000000003', 'Amazon', 'mall', 1280, NULL,
 '[{"name": "Amazon.co.jp", "price": 1280, "shipping": 0, "points": 12, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000003', '楽天市場', 'mall', 1350, NULL,
 '[{"name": "タオル直販店", "price": 1350, "shipping": 250, "points": 65, "url": "#"}]'::jsonb);

-- 商品4: 軽量アーバンベビーカー A型
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers) VALUES
('11111111-1111-1111-1111-000000000004', 'アカチャンホンポ', 'specialty', 32000,
 ARRAY['店舗受け取りで送料無料', 'プレミアム補償対応'],
 '[{"name": "アカチャンホンポ Online", "price": 32000, "shipping": 0, "points": 160, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000004', '楽天市場', 'mall', 29800, NULL,
 '[{"name": "ベビザらス 楽天市場店", "price": 29800, "shipping": 0, "points": 2980, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000004', 'Amazon', 'mall', 31500, NULL,
 '[{"name": "Amazon.co.jp", "price": 31500, "shipping": 0, "points": 315, "url": "#"}]'::jsonb);

-- 商品5: ベビーカー用ドリンクホルダー
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers) VALUES
('11111111-1111-1111-1111-000000000005', 'Amazon', 'mall', 1980, NULL,
 '[{"name": "Amazon", "price": 1980, "shipping": 0, "points": 20, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000005', 'Yahoo!ショッピング', 'mall', 1850, NULL,
 '[{"name": "ベビー用品館", "price": 1850, "shipping": 300, "points": 18, "url": "#"}]'::jsonb);

-- 商品6: プレミアム オーガニックおむつ
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers) VALUES
('11111111-1111-1111-1111-000000000006', '西松屋 (公式/専門)', 'specialty', 1540,
 ARRAY['店舗受け取り可', 'まとめ買い割引'],
 '[{"name": "西松屋 オンライン", "price": 1540, "shipping": 690, "points": 15, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000006', 'Amazon', 'mall', 1480, NULL,
 '[{"name": "Amazon.co.jp (定期おトク便)", "price": 1480, "shipping": 0, "points": 14, "note": "定期購入", "url": "#"}, {"name": "Amazon.co.jp", "price": 1741, "shipping": 0, "points": 17, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000006', '楽天市場', 'mall', 1650, NULL,
 '[{"name": "爽快ドラッグ", "price": 1650, "shipping": 600, "points": 49, "url": "#"}]'::jsonb);

-- 商品7: シリコン製ベビー食器＆ビブセット
INSERT INTO shops_prices (product_id, shop_name, shop_type, lowest_price, benefits, sellers) VALUES
('11111111-1111-1111-1111-000000000007', '楽天市場', 'mall', 3500, NULL,
 '[{"name": "キッズダイニング", "price": 3500, "shipping": 0, "points": 175, "url": "#"}]'::jsonb),
('11111111-1111-1111-1111-000000000007', 'Amazon', 'mall', 3500, NULL,
 '[{"name": "公式ストア", "price": 3500, "shipping": 0, "points": 35, "url": "#"}]'::jsonb);


-- =============================================
-- reviews シードデータ（Honestレビュー）
-- =============================================
INSERT INTO reviews (product_id, user_name, rating, content, created_at) VALUES
('11111111-1111-1111-1111-000000000001', 'ゆか', 5,
 '肌触りが最高で、何度洗濯してもへたりません。友人へのプレゼントにもリピート買いしました！',
 '2026-04-15'::timestamptz),
('11111111-1111-1111-1111-000000000002', 'S.T', 4,
 '少し装着に慣れが必要ですが、重さが分散されて本当に楽です。夏場は少し暑いかも。',
 '2026-03-20'::timestamptz),
('11111111-1111-1111-1111-000000000002', '新米パパ', 5,
 'パパの体型にもしっかりフィットします。休日の外出は常にこれです。',
 '2026-02-11'::timestamptz),
('11111111-1111-1111-1111-000000000006', '匿名希望', 5,
 '定期便でまとめ買いするのが一番安いです。肌荒れも全くありません。',
 '2026-01-05'::timestamptz);


-- =============================================
-- sns_reviews シードデータ（SNS口コミ）
-- =============================================
INSERT INTO sns_reviews (product_id, platform, user_handle, content, likes) VALUES
('11111111-1111-1111-1111-000000000001', 'instagram', 'baby_mama_life',
 '友人からの出産祝い！名入れの刺繍が可愛すぎて宝物です💕', 142),
('11111111-1111-1111-1111-000000000002', 'instagram', 'active_family',
 '長時間の抱っこでも腰が痛くならない。保証もついてるDADWAYで買って正解だった！', 450),
('11111111-1111-1111-1111-000000000004', 'instagram', 'tokyo_mama',
 '改札もスイスイ通れるのが本当に助かる！片手で畳めるからバスの時も焦りません✨', 210),
('11111111-1111-1111-1111-000000000005', 'twitter', 'stroller_style',
 'これ付けたらスマホどこいった？って探す手間がなくなった😂', 78),
('11111111-1111-1111-1111-000000000006', 'instagram', 'new_mama',
 '産院で使っていたのでそのまま継続。肌トラブルゼロです！', 320),
('11111111-1111-1111-1111-000000000007', 'instagram', 'mogu_mogu_baby',
 'お祝いでもらったコレ、吸盤強くて本当に助かってる😭✨', 234);
