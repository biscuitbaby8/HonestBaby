import { supabaseServer } from '@/src/lib/supabaseServer';
import { checkRateLimit } from '@/lib/rateLimit';

// 管理者用: セール特集の「注目商品」(sale_picks テーブル)の一覧・登録・削除。
// ADMIN_PASSWORD で保護（admin-sales と同じ認証パターン）。
// Amazonは価格を自動取得できないため、管理者が自サイト既存の商品(product_id)に
// Amazonの現在価格・URLを手動で紐付けて登録する運用。
export async function POST(request) {
  const limited = checkRateLimit(request, { limit: 30, windowMs: 5 * 60 * 1000, prefix: 'admin-sale-picks' });
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
      const { sale_id } = params;
      if (!sale_id) return Response.json({ error: 'sale_idは必須です' }, { status: 400 });
      const { data, error } = await supabaseServer
        .from('sale_picks')
        .select('*, product:products(id, name, category, image_url)')
        .eq('sale_id', sale_id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return Response.json({ picks: data || [] }, { status: 200 });
    }

    if (action === 'save') {
      const { id, sale_id, product_id, amazon_url, amazon_price, display_order, amazon_qty, other_qty, unit_label } = params;
      if (!sale_id || !product_id) return Response.json({ error: 'sale_id・product_idは必須です' }, { status: 400 });
      if (!amazon_url || !/^https:\/\//.test(amazon_url)) {
        return Response.json({ error: 'amazon_urlが不正です' }, { status: 400 });
      }
      const price = Number(amazon_price);
      if (!(price > 0)) return Response.json({ error: 'amazon_priceは正の数で指定してください' }, { status: 400 });

      const row = {
        sale_id,
        product_id,
        amazon_url,
        amazon_price: Math.round(price),
        display_order: Number(display_order) || 0,
        // 消耗品のパック数量（例: Amazon 5ロール vs 楽天 1ロール）。
        // 3つとも指定された時だけ単価比較を表示する（/sale側のロジックと対応）。
        amazon_qty: Number(amazon_qty) > 0 ? Number(amazon_qty) : null,
        other_qty: Number(other_qty) > 0 ? Number(other_qty) : null,
        unit_label: unit_label || null,
      };
      const query = id
        ? supabaseServer.from('sale_picks').update(row).eq('id', id).select().single()
        : supabaseServer.from('sale_picks').upsert(row, { onConflict: 'sale_id,product_id' }).select().single();
      const { data, error } = await query;
      if (error) throw error;
      return Response.json({ pick: data }, { status: 200 });
    }

    if (action === 'delete') {
      const { id } = params;
      if (!id) return Response.json({ error: 'idは必須です' }, { status: 400 });
      const { error } = await supabaseServer.from('sale_picks').delete().eq('id', id);
      if (error) throw error;
      return Response.json({ ok: true }, { status: 200 });
    }

    return Response.json({ error: '不明なaction' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
