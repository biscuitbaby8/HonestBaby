-- iHerb特集(/iherb)専用の商品テーブル。
-- productsテーブルには入れない: iHerbには検索/価格取得APIが無く手動投入した
-- 価格は自動更新されないため、通常のカテゴリ一覧・商品詳細ページ・ランキング・
-- サイトマップにiHerb商品が紛れ込むと、価格ズレや比較不能な商品詳細ページの
-- 原因になる。/iherb特集ページからのみ参照する独立テーブルとして分離する。
create table if not exists iherb_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  brand text,
  iherb_url text not null,
  image_url text,
  rating numeric,
  reviews_count integer,
  is_blocked boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table iherb_products enable row level security;

create policy "Allow public read access" on iherb_products
  for select using (true);
