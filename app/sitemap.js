import { supabaseServer } from '@/src/lib/supabaseServer';
import { CATEGORY_TREE } from '@/src/lib/products';

const SITE_URL = 'https://honestbaby-care.com';

export const revalidate = 3600;

export default async function sitemap() {
  const staticEntries = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/article`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/iherb`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const categoryEntries = CATEGORY_TREE.filter((c) => c.name !== 'すべて').map((c) => ({
    url: `${SITE_URL}/category/${encodeURIComponent(c.name)}`,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  let productEntries = [];
  try {
    const { data: products } = await supabaseServer
      .from('products')
      .select('id, last_synced_at')
      .or('is_blocked.is.null,is_blocked.eq.false')
      .order('popularity_rank');

    productEntries = (products || []).map((p) => ({
      url: `${SITE_URL}/product/${p.id}`,
      lastModified: p.last_synced_at ? new Date(p.last_synced_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    // Supabase 未設定時はビルドを止めない
  }

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

  return [...staticEntries, ...categoryEntries, ...articleEntries, ...productEntries];
}
