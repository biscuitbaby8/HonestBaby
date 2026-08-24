-- 商品の表示・クリックを自前で記録する（Phase 4）
--
-- ランキングの係数（満足度0.45 / レビュー数0.35 / モール人気順0.20、
-- カテゴリ重み、月齢ブースト）はすべて推測で置いた値で、
-- 「実際にどれがクリックされたか」で裏を取れていない。
-- GA4へは既に送っているが、GA4のデータはランキング計算から参照できない。
-- ここで自前DBに貯め、1ヶ月ぶん貯まったらCTRをスコアに混ぜる。
--
-- 個人情報は持たない。session_id は端末が生成する乱数で、
-- ログイン情報とも広告IDとも紐づかない。同じ人の重複表示を数えないためだけに使う。

create table if not exists product_events (
  id          bigserial primary key,
  product_id  uuid not null references products(id) on delete cascade,
  event_type  text not null check (event_type in ('impression', 'click', 'outbound')),
  -- 'home' / 'category' / 'search' など、どの画面での出来事か
  surface     text,
  -- 一覧内での表示位置（1始まり）。上位ほど押されやすい効果を補正するために使う
  position    integer,
  -- outbound のときだけ: rakuten / yahoo / amazon / iherb
  shop        text,
  -- 端末が生成する乱数。個人を特定しない
  session_id  text not null,
  created_at  timestamptz not null default now()
);

-- 同じ人・同じ商品・同じ種類は1回として数える。
-- 部分インデックス（where event_type='impression'）にすると
-- ON CONFLICT から推論できず挿入がエラーになるため event_type を含める。
-- これにより CTR が「表示した人のうち何人が押したか」になり、
-- 分子・分母の単位が揃う。
alter table product_events
  add constraint uq_product_events_session
  unique (product_id, session_id, event_type);

create index if not exists idx_product_events_product
  on product_events (product_id, event_type);
create index if not exists idx_product_events_created
  on product_events (created_at desc);

alter table product_events enable row level security;

-- 書き込みは /api/track（service_role）経由のみ。
-- 読み出しもクライアントには開かない（誰が何を見たかを外から集計させない）。
-- ポリシーを1つも作らないことで anon / authenticated は読み書きできない。

comment on table product_events is
  'ホーム等での商品の表示・クリック記録。ランキング係数を実データで調整するために使う。個人情報は持たない。';

-- CTR集計用のビュー。表示100回未満はノイズが大きいので除外する。
create or replace view product_ctr as
select
  product_id,
  count(*) filter (where event_type = 'impression') as impressions,
  count(*) filter (where event_type = 'click')      as clicks,
  count(*) filter (where event_type = 'outbound')   as outbounds,
  round(
    count(*) filter (where event_type = 'click')::numeric
    / nullif(count(*) filter (where event_type = 'impression'), 0),
    4
  ) as ctr
from product_events
where created_at > now() - interval '60 days'
group by product_id
having count(*) filter (where event_type = 'impression') >= 100;

-- 既定の SECURITY DEFINER のままだと、ビュー作成者の権限で実行されるため
-- product_events の RLS（ポリシー無し＝拒否）を迂回して匿名から読めてしまう。
-- security_invoker で「問い合わせた人の権限」で評価させる。
alter view product_ctr set (security_invoker = true);

comment on view product_ctr is
  '直近60日のCTR。表示100回以上の商品のみ。ランキングへの反映は十分な件数が貯まってから。';
