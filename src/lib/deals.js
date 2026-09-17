// 値下げ速報（/deals）用データ取得。サーバー専用。
// 重い集計は DB ビュー price_drops（価格履歴から「実際に下がった/底値の商品」を抽出）に委譲し、
// ここでは商品本体を突き合わせて返すだけにする。
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct, cleanProductName } from '@/src/lib/products';

// price_drops ビュー: product_id / shop / current_price / usual_price / off_pct / at_low / is_recent_drop
// （鮮度7日・過去60日で5%以上変動・「30日中央比7%以上安い」or「60日底値」を満たす商品のみ）
export async function fetchPriceDrops(limit = 40) {
  try {
    const { data: drops, error } = await supabaseServer
      .from('price_drops')
      .select('*')
      .order('off_pct', { ascending: false })
      .limit(limit);
    if (error || !drops || drops.length === 0) return [];

    const ids = drops.map((d) => d.product_id);
    const { data: prods } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .in('id', ids)
      .or('is_blocked.is.null,is_blocked.eq.false');

    const byId = new Map((prods || []).map((p) => [p.id, formatDbProduct(p)]));
    // drops の並び（値引き率順）を保ったまま商品を結合。非表示商品は除外。
    return drops
      .map((d) => {
        const product = byId.get(d.product_id);
        if (!product) return null;
        return {
          product,
          shop: d.shop,
          currentPrice: Number(d.current_price) || 0,
          usualPrice: Number(d.usual_price) || 0,
          offPct: Number(d.off_pct) || 0,
          atLow: !!d.at_low,
          isRecentDrop: !!d.is_recent_drop,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// X（ツイート）用の本文を実データから生成。280字（重み付き・CJKは2）に収める。
// URL は X 上で23字換算される点を考慮。値下げが無ければ null。
function weightedLen(str) {
  let w = 0;
  for (const ch of str) {
    w += /[　-ヿ぀-ゟ一-鿿＀-￯]/.test(ch) ? 2 : 1;
  }
  return w;
}

export function buildDealsTweet(deals, siteUrl = 'https://honestbaby-care.com') {
  if (!deals || deals.length === 0) return null;
  const url = `${siteUrl}/deals`;
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  const md = `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`;
  const header = `🍼ベビー用品の値下げ速報（${md}）｜本日${deals.length}件がお得`;
  const tags = '#ベビー用品 #出産準備 #育児';
  const mkLines = (n) =>
    deals.slice(0, n).map((d, i) => {
      const nm = cleanProductName(d.product.name, 14);
      const tag = d.offPct > 0 ? `${Math.round(d.offPct)}%OFF` : '底値';
      return `${i + 1}. ${nm} ${tag} ¥${d.currentPrice.toLocaleString()}`;
    });
  for (const n of [3, 2, 1]) {
    const text = [header, ...mkLines(n), `▼${url}`, tags].join('\n');
    // URL以外の重み + URL23字換算 で280以内に収める
    if (weightedLen(text.replace(url, '')) + 23 <= 275) return text;
  }
  return [header, `▼${url}`, tags].join('\n');
}
