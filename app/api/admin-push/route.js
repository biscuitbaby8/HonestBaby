import { supabaseServer } from '@/src/lib/supabaseServer';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendPushNotification, isPushConfigured } from '@/lib/webPush';

// 管理者用: 全Push購読者への一斉配信（セール告知等）。
// ADMIN_PASSWORD で保護。既存の admin-article と同じ認証パターン。
export async function POST(request) {
  const limited = checkRateLimit(request, { limit: 5, windowMs: 5 * 60 * 1000, prefix: 'admin-push' });
  if (limited) return limited;

  let body = {};
  try { body = await request.json(); } catch { body = {}; }
  const { password, title, message, url } = body || {};

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return Response.json({ error: 'パスワードが正しくありません' }, { status: 401 });
  }
  if (!title || !message) {
    return Response.json({ error: 'title と message は必須です' }, { status: 400 });
  }
  if (!isPushConfigured()) {
    return Response.json({ error: 'VAPIDキーが未設定です' }, { status: 500 });
  }

  try {
    const { data: subs, error } = await supabaseServer
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .limit(2000);
    if (error) throw error;

    let sent = 0;
    let failed = 0;
    const gone = [];
    for (const sub of subs || []) {
      const res = await sendPushNotification(sub, {
        title,
        body: message,
        url: url || '/',
        tag: 'admin-broadcast',
      });
      if (res.ok) sent++;
      else {
        failed++;
        // 購読切れ（404/410）は掃除する
        if (res.statusCode === 404 || res.statusCode === 410) gone.push(sub.id);
      }
    }
    if (gone.length > 0) {
      await supabaseServer.from('push_subscriptions').delete().in('id', gone);
    }

    return Response.json({ ok: true, sent, failed, cleaned: gone.length }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
