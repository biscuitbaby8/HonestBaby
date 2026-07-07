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
