import { supabaseServer } from '@/src/lib/supabaseServer';

const SITE_URL = 'https://honestbaby-care.com';

// 記事のRSS 2.0フィード。RSSリーダー・Google Discover等の取得経路になる。
export const revalidate = 3600;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let articles = [];
  try {
    const { data } = await supabaseServer
      .from('articles')
      .select('slug, title, meta_description, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50);
    articles = data || [];
  } catch {
    // Supabase未設定時は空フィード
  }

  const items = articles
    .map((a) => {
      const link = `${SITE_URL}/article/${encodeURIComponent(a.slug)}`;
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(a.meta_description || a.title)}</description>
      ${a.created_at ? `<pubDate>${new Date(a.created_at).toUTCString()}</pubDate>` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HonestBaby 選び方ガイド・記事</title>
    <link>${SITE_URL}/article</link>
    <description>ベビー用品の選び方・比較・お得な買い方をパパママ目線でまとめた記事フィード</description>
    <language>ja</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
