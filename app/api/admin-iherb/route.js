import { supabaseServer as supabase } from '@/src/lib/supabaseServer';
import { checkRateLimit } from '@/lib/rateLimit';
import { addIherbAffiliate } from '@/src/lib/affiliate';

// =============================================
// iHerb商品の手動投入API（管理者専用）
// iHerbには楽天/Yahooのような検索APIが無いため、選定した商品を
// パスワード保護のこのAPI経由で iherb_products に登録する。
// products/shops_pricesとは独立したテーブル
// （通常のカテゴリ一覧・商品詳細・サイトマップに混ざらないための分離。
// 詳細は supabase/migrations/025_iherb_products.sql 参照）。
// 価格は検索/価格取得APIが無く自動更新できないため保持しない
// （/iherbページはリンク先のiHerbで確認してもらう設計）。
// =============================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function auth(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

const isAllowedIherbUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && /(^|\.)iherb\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
};

export async function POST(request) {
  const headers = { 'Cache-Control': 'no-store' };
  const limited = checkRateLimit(request, { limit: 10, windowMs: 5 * 60 * 1000, prefix: 'admin-iherb', headers });
  if (limited) return limited;

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { password, products: items } = body || {};

  if (!auth(password)) {
    return Response.json({ error: 'パスワードが正しくありません' }, { status: 401, headers });
  }

  const list = Array.isArray(items) ? items.slice(0, 50) : [];
  if (list.length === 0) {
    return Response.json({ error: 'productsが必要です' }, { status: 400, headers });
  }

  const ingested = [];
  for (const it of list) {
    try {
      const name = str(it?.name, 200).trim();
      const rawUrl = str(it?.iherb_url, 1000);
      if (!name || !isAllowedIherbUrl(rawUrl)) continue;

      const category = str(it?.category, 40);
      const brand = str(it?.brand, 80) || 'iHerb';
      const image_url = str(it?.image_url, 600) || null;
      const rating = Math.max(0, Math.min(5, Number(it?.rating) || 0));
      const reviews_count = Math.max(0, parseInt(it?.reviews_count) || 0);
      const iherb_url = addIherbAffiliate(rawUrl);

      const row = { name, category, brand, iherb_url, image_url, rating, reviews_count };

      const { data: existing } = await supabase
        .from('iherb_products').select('id').eq('iherb_url', iherb_url).limit(1).maybeSingle();

      if (existing?.id) {
        await supabase.from('iherb_products').update(row).eq('id', existing.id);
        ingested.push({ id: existing.id, name, category });
      } else {
        const { data, error } = await supabase.from('iherb_products').insert(row).select('id').single();
        if (error || !data) continue;
        ingested.push({ id: data.id, name, category });
      }
    } catch {
      // 1件の失敗で全体を止めない
    }
  }

  return Response.json({ ingested }, { status: 200, headers });
}
