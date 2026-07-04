import Link from 'next/link';
import { supabaseServer } from '@/src/lib/supabaseServer';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

export const revalidate = 3600;

export const metadata = {
  title: '子育てグッズの選び方ガイド・記事一覧',
  description:
    'ベビー用品の選び方・比較・お得な買い方をまとめた記事一覧。おむつ・ベビーカー・抱っこ紐など、パパママ目線の忖度なしガイドを掲載。',
  alternates: {
    canonical: `${SITE_URL}/article`,
    types: { 'application/rss+xml': [{ url: '/feed.xml', title: 'HonestBaby 記事フィード' }] },
  },
  openGraph: {
    title: '子育てグッズの選び方ガイド・記事一覧',
    description: 'ベビー用品の選び方・比較・お得な買い方をまとめた記事一覧。',
    url: `${SITE_URL}/article`,
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: '子育てグッズの選び方ガイド・記事一覧' },
};

async function fetchArticles() {
  try {
    const { data } = await supabaseServer
      .from('articles')
      .select('slug, title, meta_description, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export default async function ArticleListPage() {
  const articles = await fetchArticles();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '子育てグッズの選び方ガイド・記事一覧',
      url: `${SITE_URL}/article`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '記事・ガイド', item: `${SITE_URL}/article` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">記事・ガイド</span>
        </nav>

        <h1 className="text-xl font-black mb-1">子育てグッズの選び方ガイド・記事一覧</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-6 leading-relaxed">
          ベビー用品の選び方・比較・お得な買い方を、パパママ目線で忖度なしにまとめています。
          <a href="/feed.xml" className="ml-2 text-[#7B8E76] underline decoration-dotted underline-offset-2">RSS</a>
        </p>

        {articles.length === 0 ? (
          <p className="text-xs text-[#A5A19E] font-bold py-10 text-center">記事は準備中です。</p>
        ) : (
          <ul className="space-y-3">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/article/${encodeURIComponent(a.slug)}`}
                  className="block bg-white rounded-2xl border border-[#F4EFEB] p-4 hover:shadow-sm"
                >
                  <p className="text-sm font-bold leading-snug mb-1">{a.title}</p>
                  {a.meta_description && (
                    <p className="text-xs text-[#8E8282] leading-relaxed line-clamp-2 mb-1.5">
                      {a.meta_description}
                    </p>
                  )}
                  {a.created_at && (
                    <time
                      dateTime={new Date(a.created_at).toISOString()}
                      className="text-[10px] text-[#A5A19E] font-bold"
                    >
                      {new Date(a.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
