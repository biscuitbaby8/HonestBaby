// サーバー専用: 定番おむつの出品（staple_offers）を読む。
import { supabaseServer } from './supabaseServer';

const COLS = 'staple_id, mall, shop_name, item_name, url, image_url, price, qty, unit_price, shipping, fetched_at';

// 全定番の出品を単価の安い順で返す（最大約1,100行。PostgRESTの1,000行上限をまたぐため2回に分ける）
export async function fetchAllOffers() {
  try {
    const pages = await Promise.all(
      [0, 1].map((i) =>
        supabaseServer.from('staple_offers').select(COLS)
          .order('unit_price', { ascending: true })
          .range(i * 1000, i * 1000 + 999)
      )
    );
    return pages.flatMap((p) => p.data || []).map(normalize);
  } catch {
    return [];
  }
}

export async function fetchOffers(stapleId) {
  try {
    const { data } = await supabaseServer.from('staple_offers').select(COLS)
      .eq('staple_id', stapleId).order('unit_price', { ascending: true });
    return (data || []).map(normalize);
  } catch {
    return [];
  }
}

// 過去の最安単価（記録開始からの最小値と、その日付）
export async function fetchLowestEver(stapleId) {
  try {
    const { data } = await supabaseServer.from('staple_history')
      .select('unit_price, recorded_on, mall')
      .eq('staple_id', stapleId).order('unit_price', { ascending: true }).limit(1);
    const { count } = await supabaseServer.from('staple_history')
      .select('recorded_on', { count: 'exact', head: true }).eq('staple_id', stapleId);
    const row = data?.[0];
    return row ? { unitPrice: Number(row.unit_price), date: row.recorded_on, mall: row.mall, records: count || 0 } : null;
  } catch {
    return null;
  }
}

function normalize(o) {
  return { ...o, price: Number(o.price), qty: Number(o.qty), unit_price: Number(o.unit_price) };
}

// 見出しに出す「最安」。送料別の出品は送料を足すと逆転しうるので、
// 送料無料の出品があればその中の最安を採る（無ければ全体の最安）。
// 出品が1件しか無い定番は、転売価格など相場から外れた値である可能性が高いので
// 「最安」として出さない（比べる相手がいて初めて最安と言える）。
export function bestOffer(offers) {
  if (!offers || offers.length < 2) return null;
  const sorted = [...offers].sort((a, b) => a.unit_price - b.unit_price);
  return sorted.find((o) => o.shipping === 'free') || sorted[0];
}

export const groupByStaple = (offers) =>
  offers.reduce((acc, o) => { (acc[o.staple_id] ||= []).push(o); return acc; }, {});
