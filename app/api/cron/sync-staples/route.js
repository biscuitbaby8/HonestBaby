import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { request as httpsRequest } from 'node:https';
import { searchUrl, withVersionFallback } from '@/src/lib/rakutenApi';
import { STAPLES, matchOffer, dropOutliers } from '@/src/lib/staples';
import { IHERB_STAPLES } from '@/src/lib/iherbPicks';

// おむつ・おしりふき・粉ミルクに加え、/iherb 特集の輸入品も同じ仕組みで楽天・Yahoo!を比べる
const SYNC_TARGETS = [...STAPLES, ...IHERB_STAPLES];

// 定番おむつ（銘柄×タイプ×サイズ）ごとに楽天・Yahooを検索し、
// 商品名から突合できた出品を1枚あたりの単価つきで保存する。
// 楽天のレート制限（約1回/秒）と429時の再試行を見込むと1回で回せるのは
// 十数件まで。3分割では末尾の定番が時間切れで飛ばされたため、?part=0..5 の6分割にする（おしりふき・粉ミルクも含め78定番）。

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const PARTS = 7;
const KEEP_PER_MALL = 8;
const DEADLINE_MS = 52000;

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// fetch では Referer を送れないため node:https を使う（楽天APIは Referer/Origin 必須）
function nodeHttpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest(
      { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET', headers },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve({ statusCode: res.statusCode, text: data }));
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

// 戻り値: 出品の配列。取得に失敗したら null（=この回は既存データを消さない）
async function searchRakuten(keyword) {
  if (!RAKUTEN_APP_ID) return null;
  const params = `applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}&keyword=${encodeURIComponent(keyword)}&hits=30&availability=1&affiliateId=${RAKUTEN_AFFILIATE_ID}`;
  const headers = { 'User-Agent': 'Mozilla/5.0', Referer: RAKUTEN_REFERER, Origin: RAKUTEN_REFERER };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await withVersionFallback((v) => nodeHttpsGet(searchUrl(v, params), headers));
      if (res.statusCode === 200) {
        const data = JSON.parse(res.text);
        return (data.Items || []).map(({ Item: it }) => ({
          mall: 'rakuten',
          item_code: String(it.itemCode || ''),
          shop_name: it.shopName || '楽天市場',
          item_name: it.itemName || '',
          url: it.affiliateUrl || it.itemUrl || '',
          image_url: (it.mediumImageUrls?.[0]?.imageUrl || '').replace(/_ex=\d+x\d+/, '_ex=300x300'),
          price: Number(it.itemPrice) || 0,
          shipping: Number(it.postageFlag) === 0 ? 'free' : 'paid',
        }));
      }
      if (res.statusCode !== 429) return null;
      await sleep(1200);
    } catch {
      return null;
    }
  }
  return null;
}

async function searchYahoo(keyword) {
  if (!YAHOO_CLIENT_ID) return null;
  const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${YAHOO_CLIENT_ID}&query=${encodeURIComponent(keyword)}&results=50&condition=new&in_stock=true`;
  try {
    let res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.status === 429) {
      await sleep(1200);
      res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    }
    if (!res.ok) return null;
    const data = await res.json();
    return (data.hits || []).map((it) => {
      let u = it.url || '';
      if (/yahoo\.co\.jp/.test(u)) u += `${u.includes('?') ? '&' : '?'}sc_e=afvc_shp_${VC_SID}`;
      const code = Number(it.shipping?.code);
      return {
        mall: 'yahoo',
        item_code: String(it.code || ''),
        shop_name: it.seller?.name || 'Yahoo!ショッピング',
        item_name: it.name || '',
        url: u,
        image_url: it.image?.medium || it.image?.small || '',
        price: Number(it.price) || 0,
        // 2: 送料無料 / 3: 条件付き送料無料 / それ以外: 送料別
        shipping: code === 2 ? 'free' : code === 3 ? 'cond' : 'paid',
      };
    });
  } catch {
    return null;
  }
}

const jstDate = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function syncStaple(staple) {
  const runStart = new Date().toISOString();
  const [rakuten, yahoo] = await Promise.all([searchRakuten(staple.rakutenKeyword), searchYahoo(staple.keyword)]);

  const matched = [];
  for (const o of [...(rakuten || []), ...(yahoo || [])]) {
    if (!o.item_code || !/^https:\/\//.test(o.url)) continue;
    const m = matchOffer(staple, o.item_name, o.price);
    if (!m) continue;
    matched.push({ ...o, staple_id: staple.id, qty: m.qty, unit_price: m.unitPrice, fetched_at: runStart });
  }
  const clean = dropOutliers(matched);

  const rows = [];
  for (const mall of ['rakuten', 'yahoo']) {
    const seen = new Set();
    clean
      .filter((o) => o.mall === mall)
      .sort((a, b) => a.unit_price - b.unit_price)
      .forEach((o) => {
        if (seen.has(o.item_code) || seen.size >= KEEP_PER_MALL) return;
        seen.add(o.item_code);
        rows.push(o);
      });
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from('staple_offers')
      .upsert(rows, { onConflict: 'staple_id,mall,item_code' });
    if (error) return { id: staple.id, error: error.message };
  }

  // 取得に成功したモールだけ、今回見つからなかった古い出品を消す
  // （APIが落ちていた回に、既存の出品まで消してしまわないため）
  for (const [mall, result] of [['rakuten', rakuten], ['yahoo', yahoo]]) {
    if (result === null) continue;
    await supabase.from('staple_offers').delete()
      .eq('staple_id', staple.id).eq('mall', mall).lt('fetched_at', runStart);
  }

  // 日ごとの最安単価。送料無料の出品があればその中の最安を採る
  const history = [];
  for (const mall of ['rakuten', 'yahoo']) {
    const list = rows.filter((o) => o.mall === mall);
    if (list.length === 0) continue;
    const free = list.filter((o) => o.shipping === 'free');
    const best = (free.length ? free : list)[0];
    history.push({
      staple_id: staple.id, mall, recorded_on: jstDate(),
      unit_price: best.unit_price, price: best.price, qty: best.qty,
    });
  }
  if (history.length > 0) {
    await supabase.from('staple_history').upsert(history, { onConflict: 'staple_id,mall,recorded_on' });
  }

  return {
    id: staple.id,
    rakuten: rakuten === null ? 'fail' : rows.filter((o) => o.mall === 'rakuten').length,
    yahoo: yahoo === null ? 'fail' : rows.filter((o) => o.mall === 'yahoo').length,
  };
}

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const part = Math.max(0, Math.min(PARTS - 1, parseInt(searchParams.get('part') || '0', 10) || 0));
  const targets = SYNC_TARGETS.filter((_, i) => i % PARTS === part);

  const started = Date.now();
  const results = [];
  for (const staple of targets) {
    if (Date.now() - started > DEADLINE_MS) { results.push({ id: staple.id, skipped: true }); continue; }
    const t = Date.now();
    try {
      results.push(await syncStaple(staple));
    } catch (e) {
      results.push({ id: staple.id, error: e.message });
    }
    // 楽天のレート制限（約1回/秒）を守る
    const wait = 1100 - (Date.now() - t);
    if (wait > 0) await sleep(wait);
  }

  try {
    revalidatePath('/iherb');
    for (const base of ['/omutsu', '/oshirifuki', '/milk']) {
      revalidatePath(base);
      revalidatePath(`${base}/[id]`, 'page');
    }
  } catch { /* noop */ }

  return Response.json({ part, count: targets.length, ms: Date.now() - started, results });
}
