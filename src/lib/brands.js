import { supabaseServer } from './supabaseServer';

// products.brand を集計して [{ name, count }] を商品数降順で返す。
// /brand（一覧）・トップページ・sitemap で共用する。
export async function fetchBrandCounts() {
  try {
    const { data } = await supabaseServer
      .from('products')
      .select('brand')
      .not('brand', 'is', null)
      .or('is_blocked.is.null,is_blocked.eq.false');

    const counts = new Map();
    for (const row of data || []) {
      if (!row.brand) continue;
      counts.set(row.brand, (counts.get(row.brand) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja'));
  } catch {
    return [];
  }
}
