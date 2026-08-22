import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { markdownToHtml, extractFaq } from '@/src/lib/markdown';
import { buildFaqLd } from '@/src/lib/categoryGuides';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

// タイトル/概要にこれらの語を含む記事だけ、iHerb特集への導線を出す
// （葉酸・ビタミンD・授乳期サプリなど、iHerbの取り扱いと内容が直結する記事に限定）
const IHERB_RELEVANT_KEYWORDS = ['葉酸', 'ビタミンD', 'ビタミンｄ', 'マタニティ', '妊娠', '授乳', 'プレナタル', 'オーガニック'];
const isIherbRelevantArticle = (article) => {
  const text = `${article.title || ''}${article.meta_description || ''}`;
  return IHERB_RELEVANT_KEYWORDS.some((kw) => text.includes(kw));
};

// 記事はISRで配信（1時間）。新規slugはオンデマンドSSR。
export const revalidate = 3600;

async function fetchArticle(rawSlug) {
  let slug;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  try {
    const { data } = await supabaseServer
      .from('articles')
      .select('slug, title, meta_description, content, published, created_at')
      .eq('slug', slug)
      .maybeSingle();
    return data && data.published ? data : null;
  } catch {
    return null;
  }
}

async function fetchLatestOthers(excludeSlug) {
  try {
    const { data } = await supabaseServer
      .from('articles')
      .select('slug, title, meta_description, created_at')
      .eq('published', true)
      .neq('slug', excludeSlug)
      .order('created_at', { ascending: false })
      .limit(4);
    return data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: '記事が見つかりません' };

  const url = `${SITE_URL}/article/${encodeURIComponent(article.slug)}`;
  const desc = article.meta_description || article.title;
  return {
    title: article.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: desc,
      url,
      type: 'article',
      images: [`${SITE_URL}/logo.png`],
    },
    twitter: { card: 'summary_large_image', title: article.title, description: desc },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const others = await fetchLatestOthers(article.slug);
  const url = `${SITE_URL}/article/${encodeURIComponent(article.slug)}`;
  const bodyHtml = markdownToHtml(article.content);
  const published = article.created_at ? new Date(article.created_at) : null;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.meta_description || article.title,
      image: [`${SITE_URL}/logo.png`],
      ...(published && { datePublished: published.toISOString() }),
      author: { '@type': 'Organization', name: 'HonestBaby', url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: 'HonestBaby',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '記事・ガイド', item: `${SITE_URL}/article` },
        { '@type': 'ListItem', position: 3, name: article.title, item: url },
      ],
    },
  ];

  // 本文に「よくある質問」があればFAQPageも出力する（FAQリッチリザルト狙い）。
  // カテゴリ/ランキングページと同じ buildFaqLd を再利用する。
  const faqLd = buildFaqLd(extractFaq(article.content));
  if (faqLd) jsonLd.push(faqLd);

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <Link href="/article" className="hover:text-[#7B8E76]">記事・ガイド</Link>
        </nav>

        <article>
          <h1 className="text-2xl font-black leading-snug mb-2">{article.title}</h1>
          {published && (
            <p className="text-[11px] text-[#A5A19E] font-bold mb-6">
              <time dateTime={published.toISOString()}>
                {published.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              {' '}公開
            </p>
          )}
          <div
            className="text-sm leading-relaxed
              [&_h2]:text-lg [&_h2]:font-black [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:pb-1.5 [&_h2]:border-b-2 [&_h2]:border-[#F2ABAC]
              [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:my-3 [&_ul]:my-3 [&_ul]:ml-5 [&_ul]:list-disc [&_li]:my-1.5
              [&_strong]:font-bold [&_code]:bg-[#F4EFEB] [&_code]:px-1 [&_code]:rounded
              [&_hr]:my-8 [&_hr]:border-[#F4EFEB]
              [&_a]:text-[#F2ABAC] [&_a]:font-bold [&_a]:underline
              [&_table]:w-full [&_table]:my-5 [&_table]:border-collapse [&_table]:text-xs
              [&_th]:bg-[#F4EFEB] [&_th]:font-black [&_th]:p-2.5 [&_th]:text-left [&_th]:border-b-2 [&_th]:border-[#F2ABAC]
              [&_td]:p-2.5 [&_td]:border-b [&_td]:border-[#F4EFEB] [&_td]:align-top"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </article>

        <Link
          href="/"
          className="block text-center text-sm font-black text-white bg-[#F2ABAC] px-6 py-3.5 rounded-full mt-10 active:scale-95 transition-transform"
        >
          HonestBaby で商品を比較・検索する →
        </Link>

        {isIherbRelevantArticle(article) && (
          <Link
            href="/iherb"
            data-cta-position="article-related"
            className="flex items-center justify-between bg-[#EAF4F2] border border-[#CDE6E0] rounded-2xl px-5 py-4 mt-4"
          >
            <span className="text-xs font-black text-[#4C9A87]">関連: iHerbの海外サプリ・オーガニックケアも見る</span>
            <span className="text-xs font-black text-[#4C9A87]">→</span>
          </Link>
        )}

        {others.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-black mb-4">ほかの記事・ガイド</h2>
            <ul className="space-y-3">
              {others.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/article/${encodeURIComponent(a.slug)}`}
                    className="block bg-white rounded-2xl border border-[#F4EFEB] p-4 hover:shadow-sm"
                  >
                    <p className="text-sm font-bold leading-snug mb-1">{a.title}</p>
                    {a.meta_description && (
                      <p className="text-xs text-[#8E8282] leading-relaxed line-clamp-2">{a.meta_description}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
