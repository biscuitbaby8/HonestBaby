// サーバー専用: sales テーブルから開催中セールを取得する。
// （クライアントは supabase anon クライアントで直接 select する）
import { supabaseServer } from './supabaseServer';
import { normalizeSaleRow, pickActiveSale } from './sales';

export async function fetchActiveSale() {
  try {
    const { data } = await supabaseServer
      .from('sales')
      .select('*')
      .order('start_at', { ascending: false })
      .limit(20);
    return pickActiveSale((data || []).map(normalizeSaleRow));
  } catch {
    return null;
  }
}

// セール特集の「注目商品」(Amazon価格は手動登録、商品本体は自サイトDBから)
export async function fetchSalePicks(saleId) {
  if (!saleId) return [];
  try {
    const { data } = await supabaseServer
      .from('sale_picks')
      .select('id, amazon_url, amazon_price, amazon_qty, other_qty, unit_label, display_order, product:products(id, name, category, image_url, shops:shops_prices(*))')
      .eq('sale_id', saleId)
      .order('display_order', { ascending: true });
    return (data || []).filter((p) => p.product);
  } catch {
    return [];
  }
}
