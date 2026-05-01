-- 非表示（ブロック）商品リスト
-- 管理者が「× 非表示」ボタンを押した商品の楽天itemCodeを保存する
create table if not exists product_blocklist (
  item_code text primary key,
  blocked_at timestamptz default now()
);

-- 匿名ユーザーは読み取りのみ、書き込みは全員許可（管理者パスワードなしの簡易運用）
alter table product_blocklist enable row level security;
create policy "allow read" on product_blocklist for select using (true);
create policy "allow insert" on product_blocklist for insert with check (true);
create policy "allow delete" on product_blocklist for delete using (true);
