import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
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

// 「APIが混んでいて取れなかった」を「商品が見つからなかった(null)」と区別する印。
// これを返した商品は試行済みにせず、次回また順番が回ってくるようにする。
const RATE_LIMITED = Symbol('rate-limited');

// 価格履歴を記録（1商品×1ショップ×1日=1行）。同期本体は止めない。
// 併せて商品ページのISRキャッシュも即時無効化する（アクセスの少ない商品ページが
// 値下がり後も古いキャッシュを配信し続ける問題を防ぐ）。
async function recordPriceHistory(productId, shopName, price) {
  if (!productId || !(price > 0)) return;
  const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  try {
    await supabase.from('price_history').upsert([{
      product_id: productId, shop_name: shopName, price, recorded_on: jstDate,
    }], { onConflict: 'product_id,shop_name,recorded_on' });
  } catch { /* noop */ }
  try {
    revalidatePath(`/product/${productId}`);
  } catch { /* noop */ }
}

// --- 楽天: itemCode で1件だけ取り直す ---
// itemCode は keyword/shopCode/genreId と並ぶ検索条件のひとつで、
// 指定するとその商品だけが返る。返ってきた itemCode が一致することを
// 必ず確認してから採用する（保険）。
async function refetchRakuten(itemCode) {
  if (!RAKUTEN_APP_ID) return RATE_LIMITED;
  const params = `applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}`
    + `&itemCode=${encodeURIComponent(itemCode)}&hits=1`
    + `&affiliateId=${RAKUTEN_AFFILIATE_ID}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // 楽天は旧APIバージョンを定期的に廃止するため、候補を順に試す
      const { statusCode, text } = await withVersionFallback(
        (v) => nodeHttpsGet(searchUrl(v, params))
      );
      if (statusCode === 429) { await sleep(1200); continue; }
      // 400/404 はその商品コード自体が無効（削除済み等）。見つからない扱いにして列を進める
      if (statusCode === 400 || statusCode === 404) return null;
      // それ以外の失敗（403/5xx等）は「商品が無い」とは言えないので、次回また試す
      if (statusCode !== 200) return RATE_LIMITED;
      const data = JSON.parse(text);
      const item = data?.Items?.[0]?.Item;
      if (!item || item.itemCode !== itemCode) return null;
      const price = parseInt(item.itemPrice, 10) || 0;
      if (!(price > 0)) return null;
      return {
        shop_name: item.shopName || '楽天市場',
        price,
        url: item.affiliateUrl || item.itemUrl,
        // postageFlag: 0=送料込 / 1=送料別
        shipping: Number(item.postageFlag) === 0 ? 0 : null,
        points: item.pointRate || 0,
        rating: parseFloat(item.reviewAverage) || 0,
        reviews_count: parseInt(item.reviewCount, 10) || 0,
      };
    } catch {
      return RATE_LIMITED;
    }
  }
  return RATE_LIMITED;
}

// --- Yahoo: ストアID内を検索し、商品コードが完全一致するものだけ採用する ---
// Yahoo APIには商品コードの直接取得が無いため、コードの前半（ストアID）で
// 絞り込んでから code の完全一致で特定する。一致しなければ何も書かない
// （近い商品で代用すると、まさに直したばかりの別バリアント問題が再発するため）。
async function refetchYahoo(fullCode, productName) {
  if (!YAHOO_CLIENT_ID) return RATE_LIMITED;
  const sellerId = fullCode.split('_')[0];
  if (!sellerId) return null;
  const words = String(productName || '').split(/[\s　]+/).filter(Boolean);
  // 商品名の先頭4語で見つからなければ2語に緩める。商品名は整形済みで、
  // ストア側の表記と語順が違うと4語では当たらないことが多い（取りこぼしの主因）。
  // どちらも「ストア内検索 + 商品コード完全一致」なので別商品は混ざらない。
  const queries = [...new Set([words.slice(0, 4).join(' '), words.slice(0, 2).join(' ')].filter(Boolean))];
  for (const q of queries) {
    const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch`
      + `?appid=${YAHOO_CLIENT_ID}&seller_id=${encodeURIComponent(sellerId)}`
      + `&query=${encodeURIComponent(q)}&results=100&condition=new`;
    let data;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return RATE_LIMITED;
      data = await res.json();
    } catch {
      return RATE_LIMITED;
    }
    const hit = (data.hits || []).find((h) => h.code === fullCode);
    if (hit) {
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
        shipping: Number(hit.shipping?.code) === 2 ? 0 : null,
        points: 0,
        rating: parseFloat(hit.review?.rate) || 0,
        reviews_count: parseInt(hit.review?.count, 10) || 0,
      };
    }
    await sleep(YAHOO_GAP_MS);
  }
  return null;
}

// 楽天・Yahooとも1秒1回程度のレート制限がある。以前は140ms間隔で叩いており、
// 429で失敗した分が「見つからない」として捨てられていた。
const RAKUTEN_GAP_MS = 1050;
const YAHOO_GAP_MS = 1050;

async function saveSeller(p, seller, isYahoo) {
  const shopName = isYahoo ? 'Yahoo!ショッピング' : '楽天市場';
  await supabase.from('shops_prices').upsert([{
    product_id: p.id,
    shop_name: shopName,
    shop_type: /公式|直営|メーカー/.test(seller.shop_name) ? 'official' : 'mall',
    lowest_price: seller.price,
    source: isYahoo ? 'yahoo' : 'rakuten',
    sellers: JSON.stringify([{
      name: seller.shop_name, price: seller.price, url: seller.url,
      shipping: seller.shipping ?? null, points: seller.points ?? 0,
      rating: seller.rating, reviews_count: seller.reviews_count, role: 'cheapest',
    }]),
    last_updated: new Date().toISOString(),
  }], { onConflict: 'product_id,shop_name', ignoreDuplicates: false });
  await recordPriceHistory(p.id, shopName, seller.price);
  return shopName;
}

// 1モールぶんの順番待ちを処理する。楽天とYahooは別APIなので並行して回す。
async function runQueue({ isYahoo, limit, deadline, stats }) {
  let query = supabase
    .from('products')
    .select('id, name, rakuten_item_code')
    .not('rakuten_item_code', 'is', null)
    .or('is_blocked.is.null,is_blocked.eq.false')
    .is('canonical_id', null)
    // 試した時刻の古い順（未試行が先頭）。成否にかかわらず更新するので列が必ず進む
    .order('refresh_checked_at', { ascending: true, nullsFirst: true })
    .limit(limit);
  query = isYahoo
    ? query.like('rakuten_item_code', 'yahoo-%')
    : query.not('rakuten_item_code', 'like', 'yahoo-%')
        .not('rakuten_item_code', 'like', 'iherb-%')
        .not('rakuten_item_code', 'like', 'amazon-%');
  const { data: targets, error } = await query;
  if (error) { stats.errors.push(error.message); return; }

  const gap = isYahoo ? YAHOO_GAP_MS : RAKUTEN_GAP_MS;
  for (const p of targets || []) {
    if (Date.now() > deadline) break;
    const started = Date.now();
    const code = p.rakuten_item_code;
    const seller = isYahoo
      ? await refetchYahoo(code.slice('yahoo-'.length), p.name)
      : await refetchRakuten(code);

    if (seller === RATE_LIMITED) {
      // 試行済みにしない。少し長めに待って次の商品へ
      stats.rateLimited++;
      await sleep(1500);
      continue;
    }

    stats.checked++;
    const now = new Date().toISOString();
    if (seller) {
      const shopName = await saveSeller(p, seller, isYahoo);
      await supabase.from('products').update({ last_synced_at: now, refresh_checked_at: now }).eq('id', p.id);
      stats.updated++;
      if (stats.samples.length < 6) stats.samples.push({ name: p.name.slice(0, 34), shop: shopName, price: seller.price });
    } else {
      // 商品コードが一致しない・在庫切れ等。既存の価格は残し（推測で上書きしない）、
      // 試した時刻だけ進めて、次回は別の商品に順番を譲る。
      await supabase.from('products').update({ refresh_checked_at: now }).eq('id', p.id);
      stats.notFound++;
    }
    const wait = gap - (Date.now() - started);
    if (wait > 0) await sleep(wait);
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

  const rakuten = { checked: 0, updated: 0, notFound: 0, rateLimited: 0, samples: [], errors: [] };
  const yahoo = { checked: 0, updated: 0, notFound: 0, rateLimited: 0, samples: [], errors: [] };
  await Promise.all([
    runQueue({ isYahoo: false, limit, deadline, stats: rakuten }),
    runQueue({ isYahoo: true, limit, deadline, stats: yahoo }),
  ]);

  return Response.json({
    ok: true, rakuten, yahoo,
    note: '商品コード直接指定で再取得（キーワード検索を使わないため別バリアント混入なし）',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
