import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { CATEGORY_TREE, CAT_META, formatDbProduct } from '@/src/lib/products';
import SiteHeader from '@/src/components/SiteHeader';
import CategoryClient from '@/src/components/CategoryClient';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';
const CATEGORY_NAMES = CATEGORY_TREE.map((c) => c.name).filter((n) => n !== 'すべて');

export function generateStaticParams() {
  return CATEGORY_NAMES.map((name) => ({ name }));
}

export const dynamicParams = false;
export const revalidate = 3600;

function resolveName(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

export async function generateMetadata({ params }) {
  const { name } = await params;
  const cat = resolveName(name);
  const meta = CAT_META[cat] || {
    title: `${cat}のベビー用品 価格比較・口コミ | HonestBaby`,
    desc: `${cat}のベビー用品を価格比較。最安値・口コミ・評価をまとめてチェック。`,
  };
  const url = `${SITE_URL}/category/${encodeURIComponent(cat)}`;
  return {
    title: meta.title,
    description: meta.desc,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.desc,
      url,
      type: 'website',
      images: [{ url: `/api/og?type=category&name=${encodeURIComponent(cat)}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.desc,
      images: [`/api/og?type=category&name=${encodeURIComponent(cat)}`],
    },
  };
}

export default async function CategoryPage({ params }) {
  const { name } = await params;
  const cat = resolveName(name);

  if (!CATEGORY_NAMES.includes(cat)) notFound();

  let products = [];
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .eq('category', cat)
      .or('is_blocked.is.null,is_blocked.eq.false')
      .order('popularity_rank', { ascending: true })
      .limit(60);
    if (!error && data) products = data.map(formatDbProduct);
  } catch {
    // Supabase接続失敗時は空リストで表示
  }

  const meta = CAT_META[cat];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta?.title || `${cat}のベビー用品 | HonestBaby`,
    description: meta?.desc || `${cat}のベビー用品を価格比較。`,
    url: `${SITE_URL}/category/${encodeURIComponent(cat)}`,
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="px-4 pt-6 pb-32 lg:max-w-7xl lg:mx-auto lg:px-10 lg:pt-8">
        {/* パンくず */}
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">{cat}</span>
        </nav>

        {/* メインカテゴリ横スクロールタブ（SPA同様のスタイル） */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 mb-4 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
          {CATEGORY_NAMES.map((n) => (
            <Link
              key={n}
              href={`/category/${encodeURIComponent(n)}`}
              className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
                n === cat
                  ? 'bg-[#7B8E76] text-white'
                  : 'bg-[#F4EFEB] text-[#8E8282] hover:bg-[#E8E1DC]'
              }`}
            >
              {n}
            </Link>
          ))}
        </div>

        {/* タイトル・説明 */}
        <h1 className="text-xl font-black mb-1 mt-4">
          {cat === 'すべて' ? 'おすすめピックアップ' : `${cat}の検索結果`}
        </h1>
        <p className="text-xs text-[#8E8282] font-bold mb-4 leading-relaxed">
          {meta?.desc || `${cat}のベビー用品を楽天・Yahooの最安値と口コミで比較。`}
        </p>

        {/* クライアント側: サブカテゴリ・ソート・商品グリッド */}
        <CategoryClient products={products} cat={cat} />
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
