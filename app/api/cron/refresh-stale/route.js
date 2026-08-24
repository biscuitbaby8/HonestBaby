import { createClient } from '@supabase/supabase-js';
import { searchUrl, withVersionFallback } from '@/src/lib/rakutenApi';
import { request as httpsRequest } from 'node:https';

// =============================================
// 陳腐化した商品の価格を再取得する（Vercel Cron）
//
// 通常の同期(sync-products)はカテゴリ検索の上位30件しか触らないため、
// 一度登録された後に検索上位から外れた商品は二度と更新されない。
// 実測で、価格を持つ公開商品3,830件のうち30日以上未更新が2,980件(78%)、
// 7日以内に更新できていたのは19.9%しかなかった。
//
// ここでは last_synced_at が古い商品から順に、キーワード検索ではなく
// 「商品コードの直接指定」で取り直す。検索を使わないので、
// 「200枚入り2個セット」の枠に1個入りが入るような別バリアントの
// 取り違えが原理的に起きない。
// =============================================

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'
);

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY || '';
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID || '';
const RAKUTEN_REFERER = process.env.RAKUTEN_REFERER || 'https://honestbaby-care.com';
const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID || process.env.VITE_YAHOO_CLIENT_ID;
const VC_SID = process.env.VITE_VC_SID || '3768537';

// 楽天APIは Referer/Origin が登録値と一致しないと403になるため node:https を使う
// （fetch はこれらを禁止ヘッダーとして送らない）。
function nodeHttpsGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: RAKUTEN_REFERER, Origin: RAKUTEN_REFERER },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ statusCode: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 価格履歴を記録（1商品×1ショップ×1日=1行）。同期本体は止めない。
async function recordPriceHistory(productId, shopName, price) {
  if (!productId || !(price > 0)) return;
  const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  try {
    await supabase.from('price_history').upsert([{
      product_id: productId, shop_name: shopName, price, recorded_on: jstDate,
    }], { onConflict: 'product_id,shop_name,recorded_on' });
  } catch { /* noop */ }
}

// --- 楽天: itemCode で1件だけ取り直す ---
// itemCode は keyword/shopCode/genreId と並ぶ検索条件のひとつで、
// 指定するとその商品だけが返る。返ってきた itemCode が一致することを
// 必ず確認してから採用する（保険）。
async function refetchRakuten(itemCode) {
  if (!RAKUTEN_APP_ID) return null;
  const params = `applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}`
    + `&itemCode=${encodeURIComponent(itemCode)}&hits=1`
    + `&affiliateId=${RAKUTEN_AFFILIATE_ID}`;
  try {
    // 楽天は旧APIバージョンを定期的に廃止するため、候補を順に試す
    const { statusCode, text } = await withVersionFallback(
      (v) => nodeHttpsGet(searchUrl(v, params))
    );
    if (statusCode !== 200) return null;
    const data = JSON.parse(text);
    const item = data?.Items?.[0]?.Item;
    if (!item || item.itemCode !== itemCode) return null;
    const price = parseInt(item.itemPrice, 10) || 0;
    if (!(price > 0)) return null;
    return {
      shop_name: item.shopName || '楽天市場',
      price,
      url: item.affiliateUrl || item.itemUrl,
      shipping: item.postageFlag === 1 ? 0 : null,
      points: item.pointRate || 0,
      rating: parseFloat(item.reviewAverage) || 0,
      reviews_count: parseInt(item.reviewCount, 10) || 0,
    };
  } catch {
    return null;
  }
}

// --- Yahoo: ストアID内を検索し、商品コードが完全一致するものだけ採用する ---
// Yahoo APIには商品コードの直接取得が無いため、コードの前半（ストアID）で
// 絞り込んでから code の完全一致で特定する。一致しなければ何も書かない
// （近い商品で代用すると、まさに直したばかりの別バリアント問題が再発するため）。
async function refetchYahoo(fullCode, productName) {
  if (!YAHOO_CLIENT_ID) return null;
  const sellerId = fullCode.split('_')[0];
  if (!sellerId) return null;
  const q = String(productName || '').split(/[\s　]+/).slice(0, 4).join(' ');
  const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch`
    + `?appid=${YAHOO_CLIENT_ID}&seller_id=${encodeURIComponent(sellerId)}`
    + `&query=${encodeURIComponent(q)}&results=50`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const hit = (data.hits || []).find((h) => h.code === fullCode);
    if (!hit) return null;
    const price = parseInt(hit.price, 10) || 0;
    if (!(price > 0)) return null;
    let rawUrl = hit.url || '';
    if (/yahoo\.co\.jp/.test(rawUrl)) {
      rawUrl += (rawUrl.includes('?') ? '&' : '?') + `sc_e=afvc_shp_${VC_SID}`;
    }
    return {
      shop_name: hit.seller?.name || 'Yahoo!ショッピング',
      price,
      url: rawUrl,
      shipping: hit.shipping?.code === 2 ? 0 : null,
      points: 0,
      rating: parseFloat(hit.review?.rate) || 0,
      reviews_count: parseInt(hit.review?.count, 10) || 0,
    };
  } catch {
    return null;
  }
}

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 80, 1), 200);
  const deadline = Date.now() + 50000;

  // 更新が古い順。商品コードが無いものは取り直せないので対象外。
  const { data: targets, error } = await supabase
    .from('products')
    .select('id, name, rakuten_item_code, last_synced_at')
    .not('rakuten_item_code', 'is', null)
    .or('is_blocked.is.null,is_blocked.eq.false')
    .is('canonical_id', null)
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  let checked = 0, updated = 0, notFound = 0;
  const samples = [];

  for (const p of targets || []) {
    if (Date.now() > deadline) break;
    checked++;

    const code = p.rakuten_item_code || '';
    const isYahoo = code.startsWith('yahoo-');
    // iHerb等の手動投入商品(iherb-)はAPIが無いので対象外
    if (code.startsWith('iherb-') || code.startsWith('amazon-')) continue;

    const seller = isYahoo
      ? await refetchYahoo(code.slice('yahoo-'.length), p.name)
      : await refetchRakuten(code);

    // 商品コードが一致しなかった/在庫切れ等で取得できなかった場合は
    // 既存の価格をそのまま残す（推測で上書きしない）。
    if (!seller) { notFound++; await sleep(120); continue; }

    const shopName = isYahoo ? 'Yahoo!ショッピング' : '楽天市場';
    await supabase.from('shops_prices').upsert([{
      product_id: p.id,
      shop_name: shopName,
      shop_type: /公式|直営|メーカー/.test(seller.shop_name) ? 'official' : 'mall',
      lowest_price: seller.price,
      source: isYahoo ? 'yahoo' : 'rakuten',
      sellers: JSON.stringify([{
        name: seller.shop_name, price: seller.price, url: seller.url,
        shipping: seller.shipping ?? 0, points: seller.points ?? 0,
        rating: seller.rating, reviews_count: seller.reviews_count, role: 'cheapest',
      }]),
      last_updated: new Date().toISOString(),
    }], { onConflict: 'product_id,shop_name', ignoreDuplicates: false });

    await recordPriceHistory(p.id, shopName, seller.price);
    await supabase.from('products').update({ last_synced_at: new Date().toISOString() }).eq('id', p.id);

    updated++;
    if (samples.length < 5) samples.push({ name: p.name.slice(0, 34), shop: shopName, price: seller.price });

    // 楽天/YahooのAPIレート制限に配慮して間隔を空ける
    await sleep(140);
  }

  return Response.json({
    ok: true, checked, updated, notFound, samples,
    note: '商品コード直接指定で再取得（キーワード検索を使わないため別バリアント混入なし）',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
