-- review-photos: レビュー写真用Supabase Storageバケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  true,
  5242880,   -- 5MB上限
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 誰でも閲覧可能
CREATE POLICY "Public read review photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

-- ログイン済みユーザーのみアップロード可
CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-photos'
    AND auth.role() = 'authenticated'
  );

-- 自分がアップした写真のみ削除可
CREATE POLICY "Users can delete own review photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- reviews テーブルに image_url が未存在の場合に備えて追加（既存なら無視）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;
