import { supabaseServer as supabase } from '@/src/lib/supabaseServer';
import { checkRateLimit } from '@/lib/rateLimit';
import { CATEGORIES } from '@/src/lib/products';
import { addIherbAffiliate } from '@/src/lib/affiliate';

// =============================================
// iHerb商品の手動投入API（管理者専用）
// iHerbには楽天/Yahooのような検索APIが無いため、選定した商品を
// パスワード保護のこのAPI経由でproducts/shops_pricesに登録する。
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
      const category = str(it?.category, 40);
      const iherb_url = str(it?.iherb_url, 1000);
      if (!name || !CATEGORIES.includes(category) || !isAllowedIherbUrl(iherb_url)) continue;

      const sub_category = str(it?.sub_category, 60) || '本体';
      const brand = str(it?.brand, 80) || 'iHerb';
      const image_url = str(it?.image_url, 600) || null;
      const price = Math.max(0, parseInt(it?.price) || 0);
      const rating = Math.max(0, Math.min(5, Number(it?.rating) || 0));
      const reviews_count = Math.max(0, parseInt(it?.reviews_count) || 0);
      const code = `iherb-${str(it?.code, 100).trim() || name}`;

      const { data: existing } = await supabase
        .from('products').select('id').eq('rakuten_item_code', code).limit(1).maybeSingle();
      let productId = existing?.id || null;

      if (!productId) {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name, category, sub_category, brand, image_url,
            rating, reviews_count,
            rakuten_item_code: code,
            is_market_wide: true,
            last_synced_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error || !data) continue;
        productId = data.id;
      } else {
        await supabase
          .from('products')
          .update({ name, category, sub_category, brand, image_url, rating, reviews_count, last_synced_at: new Date().toISOString() })
          .eq('id', productId);
      }

      const trackingUrl = addIherbAffiliate(iherb_url);
      const sellers = [{ name: 'iHerb', price, url: trackingUrl, shipping: 0, points: 0 }];
      await supabase
        .from('shops_prices')
        .upsert(
          {
            product_id: productId,
            shop_name: 'iHerb',
            shop_type: 'overseas',
            lowest_price: price,
            sellers,
            source: 'manual',
            last_updated: new Date().toISOString(),
          },
          { onConflict: 'product_id,shop_name' }
        );

      ingested.push({ id: productId, name, category });
    } catch {
      // 1件の失敗で全体を止めない
    }
  }

  return Response.json({ ingested }, { status: 200, headers });
}
