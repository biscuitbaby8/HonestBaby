-- baby_profiles: マタニティモード対応（出産予定日での先行登録を可能にする）
ALTER TABLE baby_profiles
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS last_milestone_sent_tag TEXT;

ALTER TABLE baby_profiles
  ALTER COLUMN birth_year DROP NOT NULL,
  ALTER COLUMN birth_month DROP NOT NULL;

-- どちらか一方は必須: 出産予定日（妊娠中） or 生年月（出産済み）
ALTER TABLE baby_profiles
  ADD CONSTRAINT baby_profiles_due_or_birth_chk
  CHECK (
    due_date IS NOT NULL
    OR (birth_year IS NOT NULL AND birth_month IS NOT NULL)
  );
