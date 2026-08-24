-- ホームの並び順をDB側で持つ（Phase 2）
--
-- これまでホームの並び順はブラウザ側だけで計算していた。そのため
--   1) SSRホーム（クローラーが最初に読むHTML）には一切効かない
--   2) 3,840件を全部読み込んでから並べ替えるのでスマホで重い
-- という問題があった。日次cronでスコアを計算して列に持たせる。
--
-- home_score : 需要スコア（L1）+ HonestBaby独自の加点（L2）
-- home_rank  : home_score の降順に振った順位（1が最上位）。NULLは未計算。

alter table products add column if not exists home_score numeric;
alter table products add column if not exists home_rank integer;

-- ホームは home_rank の昇順で上位N件だけを引くため、部分インデックスで足りる
create index if not exists idx_products_home_rank
  on products (home_rank)
  where home_rank is not null;

comment on column products.home_score is
  'ホームの並び順スコア。/api/cron/rebuild-home-score が日次で更新する。src/lib/products.js の demandScore と同じ計算に、価格由来の加点を足したもの。';
comment on column products.home_rank is
  'home_score の降順順位（1が最上位）。ホーム表示はこの列で order by する。';
