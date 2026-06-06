import { supabaseServer } from '@/src/lib/supabaseServer';
import { extractSubCategory } from '@/src/lib/subcategory';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 既存商品の sub_category を再分類する管理用エンドポイント。
// 呼び出し: POST /api/admin/reclassify
// （Vercel環境変数 ADMIN_SECRET が設定されている場合は Authorization ヘッダーで認証）
export async function POST(request) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${adminSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 全商品の id・name・category を取得
  const { data: products, error } = await supabaseServer
    .from('products')
    .select('id, name, category')
    .order('id');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  let skipped = 0;
  const BATCH = 20;

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (p) => {
        const sub = extractSubCategory(p.category, p.name);
        const { error: upErr } = await supabaseServer
          .from('products')
          .update({ sub_category: sub })
          .eq('id', p.id);
        if (upErr) skipped++;
        else updated++;
      })
    );
  }

  return Response.json({ total: products.length, updated, skipped });
}
