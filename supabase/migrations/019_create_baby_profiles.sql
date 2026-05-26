-- baby_profiles: ユーザーの赤ちゃん情報（デバイス間同期用）
CREATE TABLE IF NOT EXISTS baby_profiles (
  user_id      TEXT PRIMARY KEY,         -- Supabase auth.uid() (1ユーザー1プロフィール)
  name         TEXT,
  birth_year   INTEGER NOT NULL,
  birth_month  INTEGER NOT NULL,
  gender       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE baby_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baby profile"
  ON baby_profiles FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own baby profile"
  ON baby_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own baby profile"
  ON baby_profiles FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own baby profile"
  ON baby_profiles FOR DELETE
  USING (user_id = auth.uid()::text);

GRANT SELECT, INSERT, UPDATE, DELETE ON baby_profiles TO anon, authenticated;
