import { createClient } from '@supabase/supabase-js';
import { sendPushNotification, isPushConfigured } from '@/lib/webPush';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder_key'
);

// 今週の人気ランキング上位3件を取得してPush通知を全購読者に送る
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return Response.json({ ok: false, reason: 'VAPID keys not configured' }, { status: 200 });
  }

  const { data: topProducts } = await supabase
    .from('products')
    .select('id, name, image_url, price')
    .or('is_blocked.is.null,is_blocked.eq.false')
    .order('popularity_rank', { ascending: true })
    .limit(3);

  if (!topProducts || topProducts.length === 0) {
    return Response.json({ ok: false, reason: 'no products' }, { status: 200 });
  }

  const top = topProducts[0];
  const others = topProducts.slice(1).map((p) => p.name).join('・');
  const body = others ? `1位: ${top.name}、他にも${others}など` : `1位: ${top.name}`;

  const { data: subs } = await supabase.from('push_subscriptions').select('*');

  if (!subs || subs.length === 0) {
    return Response.json({ ok: true, sent: 0 }, { status: 200 });
  }

  let sent = 0;
  const expired = [];

  for (const sub of subs) {
    const result = await sendPushNotification(sub, {
      title: '今週の人気ランキング更新',
      body,
      icon: top.image_url || '/favicon.png',
      image: top.image_url,
      url: `https://honestbaby-care.com/product/${top.id}`,
      tag: `weekly-ranking-${new Date().toISOString().slice(0, 10)}`,
    });

    if (result.ok) {
      sent++;
    } else if (result.statusCode === 410 || result.statusCode === 404) {
      expired.push(sub.endpoint);
    }
  }

  for (const endpoint of expired) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }

  return Response.json({ ok: true, sent, expired: expired.length }, { status: 200 });
}
