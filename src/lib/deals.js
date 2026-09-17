// 値下げ速報（/deals）用データ取得。サーバー専用。
// 重い集計は DB ビュー price_drops（価格履歴から「実際に下がった/底値の商品」を抽出）に委譲し、
// ここでは商品本体を突き合わせて返すだけにする。
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct } from '@/src/lib/products';

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
