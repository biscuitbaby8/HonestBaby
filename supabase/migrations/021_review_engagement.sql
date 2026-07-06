-- =============================================
-- 口コミ促進機能
--  - tags: 30秒レビュー用の選択チップ（「サイズ感ぴったり」等）
--  - helpful_count: 「役に立った」票数（加算は service_role のAPI経由のみ。
--    RLSでUPDATEを公開していないため匿名からの直接改ざんは不可）
--  - user_id: 投稿者のauth UID。「役に立った」が付いた際の
--    Push通知（push_subscriptions.user_id との突合）に使う
-- =============================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id TEXT;
