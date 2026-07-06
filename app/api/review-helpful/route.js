import { supabaseServer } from '@/src/lib/supabaseServer';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendPushNotification, isPushConfigured } from '@/lib/webPush';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 口コミへの「役に立った」投票。
// helpful_count の加算は service_role のこのAPI経由のみ（RLSでUPDATE非公開）。
// 二重投票の抑止はクライアント側 localStorage + レート制限で行う軽量設計。
// 投稿者（user_id あり）がPush購読していれば通知を送る。
export async function POST(request) {
  const limited = checkRateLimit(request, { limit: 30, windowMs: 5 * 60 * 1000, prefix: 'review-helpful' });
  if (limited) return limited;

  let body = {};
  try { body = await request.json(); } catch { body = {}; }
  const reviewId = body?.reviewId;
  if (!reviewId || !UUID_RE.test(reviewId)) {
    return Response.json({ error: 'invalid reviewId' }, { status: 400 });
  }

  try {
    const { data: review, error } = await supabaseServer
      .from('reviews')
      .select('id, user_id, product_id, helpful_count')
      .eq('id', reviewId)
      .maybeSingle();
    if (error || !review) {
      return Response.json({ error: 'review not found' }, { status: 404 });
    }

    const newCount = (Number(review.helpful_count) || 0) + 1;
    const { error: upErr } = await supabaseServer
      .from('reviews')
      .update({ helpful_count: newCount })
      .eq('id', reviewId);
    if (upErr) throw upErr;

    // 投稿者へPush通知（購読していれば）。通知失敗は投票成功に影響させない
    if (review.user_id && isPushConfigured()) {
      try {
        const [{ data: subs }, { data: product }] = await Promise.all([
          supabaseServer.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', review.user_id).limit(5),
          supabaseServer.from('products').select('name').eq('id', review.product_id).maybeSingle(),
        ]);
        const productName = product?.name ? `「${String(product.name).slice(0, 30)}…」` : '';
        await Promise.all((subs || []).map((sub) =>
          sendPushNotification(sub, {
            title: 'あなたの口コミが役に立ちました 🎉',
            body: `${productName}の口コミに「役に立った」が付きました（計${newCount}件）`,
            url: `/product/${review.product_id}`,
            tag: `helpful-${reviewId}`,
          })
        ));
      } catch { /* 通知はベストエフォート */ }
    }

    return Response.json({ ok: true, helpfulCount: newCount }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
