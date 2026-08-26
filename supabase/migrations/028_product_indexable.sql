-- 検索エンジンに見せる商品ページを絞る（SEO改善 02）
--
-- 背景: sitemap 3,986件のうち 3,863件(97%)が商品ページで、実際に検索結果へ
-- 表示されたのは全体で55ページ（登録の1.4%）だけだった。開設4.5ヶ月・被リンク
-- ほぼゼロのドメインに価格比較だけの類似ページが3,863枚ある状態で、
-- クロール予算が薄く広く配られ、勝てるページまで埋もれている。
--
-- 掲載自体はやめない。ユーザーはこれまで通り閲覧でき、アプリ内の一覧にも残る。
-- 「検索エンジンに見せる分」だけを絞る。
--
-- 基準（/api/cron/rebuild-home-score が毎晩判定）:
--   レビュー200件以上 かつ 価格履歴7日以上 かつ 画像・有効価格あり
--   → 実測で 3,863件 → 716件
-- 基準を満たす商品には価格推移グラフという他所に無い中身がある。
--
-- 閾値は src/lib/seo.js の定数ひとつで変更でき、いつでも戻せる。

alter table products add column if not exists is_indexable boolean not null default false;

-- sitemap は is_indexable=true のみを引くため部分インデックスで足りる
create index if not exists idx_products_indexable
  on products (id)
  where is_indexable = true;

comment on column products.is_indexable is
  '検索エンジンに見せてよい商品ページか。/api/cron/rebuild-home-score が毎晩判定する。false のページは noindex,follow を返し sitemap からも外す（ユーザーは閲覧可能）。';
