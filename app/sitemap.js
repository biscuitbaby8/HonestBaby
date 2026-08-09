import { supabaseServer } from '@/src/lib/supabaseServer';
import { CATEGORY_TREE, UNIT_PRICE_CATEGORIES } from '@/src/lib/products';
import { fetchBrandCounts } from '@/src/lib/brands';
import { AGE_GUIDES } from '@/src/lib/ageGuides';

const SITE_URL = 'https://honestbaby-care.com';

export const revalidate = 3600;

export default async function sitemap() {
  const staticEntries = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/article`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/brand`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/sale`, changeFrequency: 'daily', priority: 0.8 },
    // 値下がり・底値情報（価格推移データから毎日自動更新）
    { url: `${SITE_URL}/price`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/iherb`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const categories = CATEGORY_TREE.filter((c) => c.name !== 'すべて');
  const categoryEntries = categories.map((c) => ({
    url: `${SITE_URL}/category/${encodeURIComponent(c.name)}`,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // 月齢別ページ（/age/[slug]）
  const ageEntries = AGE_GUIDES.map((g) => ({
    url: `${SITE_URL}/age/${g.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // カテゴリ別ランキング（/ranking/[category]）
  const rankingEntries = categories.map((c) => ({
    url: `${SITE_URL}/ranking/${encodeURIComponent(c.name)}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // 1枚あたり単価ページ（/unit-price/[category]）。内容量が「枚」で数えられる
  // カテゴリのみ（src/lib/products.js の UNIT_PRICE_CATEGORIES）。
  const unitPriceEntries = UNIT_PRICE_CATEGORIES.map((c) => ({
    url: `${SITE_URL}/unit-price/${encodeURIComponent(c)}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // サブカテゴリ（/category/[name]/[sub]）。subs は string | { name } の混在。
  const subCategoryEntries = categories.flatMap((c) =>
    (c.subs || []).map((s) => ({
      url: `${SITE_URL}/category/${encodeURIComponent(c.name)}/${encodeURIComponent(typeof s === 'string' ? s : s.name)}`,
      changeFrequency: 'daily',
      priority: 0.8,
    }))
  );

  let productEntries = [];
  try {
    // Supabaseは1リクエスト最大1000行のため、range()でページングして全代表商品を取得する
    // （従来は先頭1000件で頭打ちになり、残りの商品ページがsitemapから漏れていた）。
    const pageSize = 1000;
    for (let from = 0; from < 60000; from += pageSize) {
      const { data } = await supabaseServer
        .from('products')
        .select('id, last_synced_at')
        .or('is_blocked.is.null,is_blocked.eq.false')
        .is('canonical_id', null) // 重複の非代表ページはsitemapに載せない（代表のみ）
        .order('popularity_rank')
        .range(from, from + pageSize - 1);
      if (!data || data.length === 0) break;
      for (const p of data) {
        productEntries.push({
          url: `${SITE_URL}/product/${p.id}`,
          lastModified: p.last_synced_at ? new Date(p.last_synced_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
      if (data.length < pageSize) break;
    }
  } catch {
    // Supabase 未設定時はビルドを止めない
  }

  const brandEntries = (await fetchBrandCounts()).map((b) => ({
    url: `${SITE_URL}/brand/${encodeURIComponent(b.name)}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  let articleEntries = [];
  try {
    const { data: articles } = await supabaseServer
      .from('articles')
      .select('slug, created_at')
      .eq('published', true);

    articleEntries = (articles || []).map((a) => ({
      url: `${SITE_URL}/article/${encodeURIComponent(a.slug)}`,
      lastModified: a.created_at ? new Date(a.created_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch {
    // Supabase 未設定時はビルドを止めない
  }

  return [
    ...staticEntries,
    ...categoryEntries,
    ...ageEntries,
    ...rankingEntries,
    ...unitPriceEntries,
    ...subCategoryEntries,
    ...brandEntries,
    ...articleEntries,
    ...productEntries,
  ];
}
