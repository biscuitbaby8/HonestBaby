import { createClient } from '@supabase/supabase-js';
import { sendPushNotification, isPushConfigured } from '@/lib/webPush';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder_key'
);

// 月齢マイルストーン（ハーフバースデー・誕生日）の月にギフト提案Pushを送る
const MILESTONES = [
  { key: 'half', months: 6,  label: 'ハーフバースデー' },
  { key: '1y',   months: 12, label: '1歳のお誕生日' },
  { key: '2y',   months: 24, label: '2歳のお誕生日' },
  { key: '3y',   months: 36, label: '3歳のお誕生日' },
];

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return Response.json({ ok: false, reason: 'VAPID keys not configured' }, { status: 200 });
  }

  const { data: babies } = await supabase
    .from('baby_profiles')
    .select('id, user_id, name, birth_year, birth_month, last_milestone_sent_tag');

  if (!babies || babies.length === 0) {
    return Response.json({ ok: true, sent: 0 }, { status: 200 });
  }

  const now = new Date();
  let sent = 0;
  const expired = [];

  for (const baby of babies) {
    const ageMonths = (now.getFullYear() - baby.birth_year) * 12 + (now.getMonth() + 1 - baby.birth_month);
    const milestone = MILESTONES.find((m) => m.months === ageMonths);
    if (!milestone) continue;

    const sentTags = (baby.last_milestone_sent_tag || '').split(',').filter(Boolean);
    if (sentTags.includes(milestone.key)) continue;

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', baby.user_id);

    // 購読者がいない場合はまだ「送信済み」にしない（後で購読されたら送れるようにする）
    if (!subs || subs.length === 0) continue;

    for (const sub of subs) {
      const result = await sendPushNotification(sub, {
        title: `🎉 ${baby.name || 'お子さま'}の${milestone.label}`,
        body: `${milestone.label}にぴったりのギフトをチェックしませんか？`,
        icon: '/favicon.png',
        url: 'https://honestbaby-care.com/?tab=gift',
        tag: `baby-milestone-${baby.id}-${milestone.key}`,
      });

      if (result.ok) {
        sent++;
      } else if (result.statusCode === 410 || result.statusCode === 404) {
        expired.push(sub.endpoint);
      }
    }

    // user_id ではなく id（ベビー単位）で更新。兄弟・双子が同じ user_id を共有しても
    // それぞれ独立してマイルストーン送信済みを管理できるようにする。
    await supabase
      .from('baby_profiles')
      .update({ last_milestone_sent_tag: [...sentTags, milestone.key].join(',') })
      .eq('id', baby.id);
  }

  for (const endpoint of expired) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }

  return Response.json({ ok: true, sent }, { status: 200 });
}
