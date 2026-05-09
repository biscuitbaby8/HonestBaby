create table if not exists inquiries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  category text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table inquiries enable row level security;

create policy "ログインユーザーは自分の問い合わせを送信できる"
  on inquiries for insert
  with check (auth.uid() = user_id);

create policy "管理者は全件参照できる"
  on inquiries for select
  using (true);
