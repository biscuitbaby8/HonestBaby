-- 複数ベビー（兄弟・双子）登録対応：PKを user_id から id(UUID) に変更し、
-- 1人のユーザーが複数のベビープロフィールを持てるようにする。
ALTER TABLE baby_profiles ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
UPDATE baby_profiles SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE baby_profiles ALTER COLUMN id SET NOT NULL;

ALTER TABLE baby_profiles ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE baby_profiles DROP CONSTRAINT IF EXISTS baby_profiles_pkey;
ALTER TABLE baby_profiles ADD PRIMARY KEY (id);
ALTER TABLE baby_profiles ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_baby_profiles_user_id ON baby_profiles(user_id);
