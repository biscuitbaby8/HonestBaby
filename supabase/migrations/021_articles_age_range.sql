-- articles: 月齢・マタニティ向けタグ付け（ホームでのレコメンドに使用）
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS age_min_months INTEGER,
  ADD COLUMN IF NOT EXISTS age_max_months INTEGER,
  ADD COLUMN IF NOT EXISTS is_maternity BOOLEAN NOT NULL DEFAULT FALSE;
