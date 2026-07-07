import { supabaseServer } from '@/src/lib/supabaseServer';
import { checkRateLimit } from '@/lib/rateLimit';

const SHOPS = ['amazon', 'rakuten', 'yahoo'];

// 管理者用: 不定期セール（sales テーブル）の一覧・登録・削除。
// ADMIN_PASSWORD で保護（admin-article と同じ認証パターン）。
export async function POST(request) {
  const limited = checkRateLimit(request, { limit: 20, windowMs: 5 * 60 * 1000, prefix: 'admin-sales' });
  if (limited) return limited;

  let body = {};
  try { body = await request.json(); } catch { body = {}; }
  const { action, password, ...params } = body || {};

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return Response.json({ error: 'パスワードが正しくありません' }, { status: 401 });
  }

  try {
    if (action === 'list') {
      const { data, error } = await supabaseServer
        .from('sales')
        .select('*')
        .order('start_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return Response.json({ sales: data || [] }, { status: 200 });
    }

    if (action === 'save') {
      const { id, shop, name, short_name, start_at, main_start_at, end_at, period_label } = params;
      if (!SHOPS.includes(shop)) return Response.json({ error: 'shopはamazon/rakuten/yahooのいずれか' }, { status: 400 });
      if (!name || !start_at || !end_at) return Response.json({ error: 'name・start_at・end_atは必須です' }, { status: 400 });
      const start = Date.parse(start_at);
      const end = Date.parse(end_at);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return Response.json({ error: '期間が不正です（終了は開始より後）' }, { status: 400 });
      }
      const row = {
        shop,
        name,
        short_name: short_name || null,
        start_at,
        main_start_at: main_start_at || null,
        end_at,
        period_label: period_label || null,
      };
      const query = id
        ? supabaseServer.from('sales').update(row).eq('id', id).select().single()
        : supabaseServer.from('sales').insert(row).select().single();
      const { data, error } = await query;
      if (error) throw error;
      return Response.json({ sale: data }, { status: 200 });
    }

    if (action === 'delete') {
      const { id } = params;
      if (!id) return Response.json({ error: 'idは必須です' }, { status: 400 });
      const { error } = await supabaseServer.from('sales').delete().eq('id', id);
      if (error) throw error;
      return Response.json({ ok: true }, { status: 200 });
    }

    return Response.json({ error: '不明なaction' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
