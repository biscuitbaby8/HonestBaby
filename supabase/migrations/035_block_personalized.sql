-- 名入れ・オーダーメイド等の一点物（他店で同じ商品を比べられないもの）を非表示にする。
-- 2026-11-15 に91件へ適用済み。削除ではなく is_blocked なので、戻すときは false にする。
-- 判定は src/lib/products.js の isPersonalizedItem と同じ。今後は同期時に取り込まない。
UPDATE products SET is_blocked = true, is_indexable = false, home_rank = null
WHERE NOT coalesce(is_blocked, false) AND canonical_id IS NULL AND (
  (name ~ '名入れ|名入り|名前入|ネーム入|お名前入|名前刺繍'
    AND name !~ '名入れ(無料|可|対応|OK|できる|サービス)|名入れ刻印可|名入れ刻印半額')
  OR name ~ 'オーダーメイド|セミオーダー|受注生産|受注製作|体重米|抱っこできるお米|ウェイトライス'
);
