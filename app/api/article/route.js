import { supabaseServer as supabase } from '@/src/lib/supabaseServer';

// 記事ページ本体は app/article/[slug]/page.jsx（ISR）へ移行済み。
// この route は SPA が使う記事一覧 JSON（?list=1）と、
// 旧URL（/api/article?slug=...）互換のリダイレクトのみを提供する。
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    return new Response(null, {
      status: 308,
      headers: { Location: `/article/${encodeURIComponent(slug)}` },
    });
  }

  if (searchParams.get('list') === '1') {
    const { data, error } = await supabase
      .from('articles')
      .select('slug, title, meta_description, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error) {
      return Response.json({ articles: [] }, { status: 200 });
    }
    return Response.json({ articles: data || [] }, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' },
    });
  }

  return new Response(null, { status: 302, headers: { Location: '/article' } });
}
