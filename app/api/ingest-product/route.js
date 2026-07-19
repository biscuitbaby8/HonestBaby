import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimit';
import { categorizeByName } from '@/src/lib/products';

// =============================================
// 検索でヒットした商品をDBへ取り込むAPI
// 楽天/Yahoo検索の結果（本体＋ショップURL）をproducts/shops_pricesに保存し、
// 自サイトの商品ページ(/product/[rakuten_item_code])を持たせる。
//
// セキュリティ:
//  - shops_pricesはRLSで匿名INSERT不可のため、本ルートでサービスロールを使う
//    （クライアントから直接は書けない）。
//  - 公開APIなのでレート制限＋入力検証＋件数/文字数の上限でスパム投入を防ぐ。
//  - 重複は rakuten_item_code → name の順で既存を探し、無ければ作成。
// =============================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'placeholder_key'
);

const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

// ショップURLは既知の通販/アフィリエイトドメインのみ許可（公開APIなので
// 悪意あるリンク=フィッシング等の混入を防ぐ）。検索結果は楽天/Yahooの
// アフィリエイトURLのため、それらのホストを許可する。
const ALLOWED_SHOP_HOST_RE = [
  /(^|\.)rakuten\.co\.jp$/i,
  /(^|\.)rakuten\.ne\.jp$/i,
  /(^|\.)r10\.to$/i,
  /(^|\.)yahoo\.co\.jp$/i,
  /(^|\.)valuecommerce\.com$/i,
  /(^|\.)amazon\.co\.jp$/i,
];
const isAllowedShopUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && ALLOWED_SHOP_HOST_RE.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
};

export async function POST(request) {
  const headers = { 'Cache-Control': 'no-store' };
  const limited = checkRateLimit(request, { limit: 40, windowMs: 60 * 1000, prefix: 'ingest', headers });
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400, headers });
  }

  const items = Array.isArray(body?.products) ? body.products.slice(0, 12) : [];
  if (items.length === 0) return Response.json({ ingested: [] }, { status: 200, headers });

  const ingested = [];

  for (const it of items) {
    try {
      const name = str(it?.name, 200).trim();
      if (!name) continue;

      // カテゴリは商品名からサーバー側で判定する（クライアント値を信頼しない）。
      // 判定できない商品は取り込まない＝カテゴリ一致した商品だけを保存する。
      const category = categorizeByName(name);
      if (!category) continue;

      // 取得元の安定コードを正規化（rakuten- 接頭辞は除去して同期データと揃える。yahoo- は維持）。
      let code = str(it?.rakuten_item_code, 120).trim();
      if (code.startsWith('rakuten-')) code = code.slice('rakuten-'.length);

      const image_url = str(it?.image_url, 600) || null;
      const sub_category = str(it?.sub_category, 60) || '本体';
      const brand = str(it?.brand, 80) || null;
      const rating = Math.max(0, Math.min(5, Number(it?.rating) || 0));
      const reviews_count = Math.max(0, parseInt(it?.reviews_count) || 0);
      const ai_analysis = it?.ai_analysis ? str(it.ai_analysis, 600) : null;

      // 既存商品を探す（コード → 完全名 → 正規化名キー の順）。重複作成を避ける。
      let productId = null;
      if (code) {
        const { data } = await supabase
          .from('products').select('id').eq('rakuten_item_code', code).limit(1).maybeSingle();
        productId = data?.id || null;
      }
      if (!productId) {
        const { data } = await supabase
          .from('products').select('id').eq('name', name).limit(1).maybeSingle();
        productId = data?.id || null;
      }
      if (!productId) {
        // 別ショップの微妙に異なる名前でも、正規化名キーが一致すれば同一商品として扱う
        // （重複ページの量産を防ぐ）。key はアプリの productNameKey と同一定義。
        const key = name.replace(/[\s　]/g, '').toLowerCase().slice(0, 30);
        if (key) {
          const { data } = await supabase
            .from('products').select('id').eq('name_key', key).limit(1);
          productId = data?.[0]?.id || null;
        }
      }
      // 見つかった商品が重複の非代表なら、代表に寄せて価格を集約する（新たな重複を作らない）
      if (productId) {
        const { data } = await supabase
          .from('products').select('canonical_id').eq('id', productId).limit(1);
        if (data?.[0]?.canonical_id) productId = data[0].canonical_id;
      }

      if (!productId) {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name, category, sub_category, brand, image_url,
            rating, reviews_count, ai_analysis,
            rakuten_item_code: code || null,
            is_market_wide: true,
            last_synced_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error || !data) continue;
        productId = data.id;
      }

      // ショップ（価格・URL）を保存。URLは sellers(jsonb) に格納（shops_pricesにurl列は無い）。
      const shops = Array.isArray(it?.shops) ? it.shops.slice(0, 8) : [];
      for (const s of shops) {
        const shop_name = str(s?.shop_name || s?.name, 100).trim();
        const url = str(s?.url, 1000);
        const price = Math.max(0, parseInt(s?.lowest_price ?? s?.price) || 0);
        if (!shop_name || !isAllowedShopUrl(url)) continue;
        const sellers = [{ name: shop_name, price, url, shipping: 0, points: 0 }];
        await supabase
          .from('shops_prices')
          .upsert(
            {
              product_id: productId,
              shop_name,
              shop_type: str(s?.shop_type, 20) || 'mall',
              lowest_price: price,
              sellers,
              source: str(s?.source, 20) || null,
              last_updated: new Date().toISOString(),
            },
            { onConflict: 'product_id,shop_name' }
          );
      }

      ingested.push({ rakuten_item_code: code || null, name, id: productId });
    } catch {
      // 1件の失敗で全体を止めない
    }
  }

  return Response.json({ ingested }, { status: 200, headers });
}
