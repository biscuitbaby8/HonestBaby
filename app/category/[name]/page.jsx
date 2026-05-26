import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { CATEGORY_TREE, CAT_META, formatDbProduct } from '@/src/lib/products';
import ProductCardLink from '@/src/components/ProductCardLink';
import SiteHeader from '@/src/components/SiteHeader';

const SITE_URL = 'https://honestbaby-care.com';
const CATEGORY_NAMES = CATEGORY_TREE.map((c) => c.name).filter((n) => n !== 'すべて');

// ビルド時に全カテゴリページを静的生成（Next.jsがURLエンコードを処理するため生の名前を渡す）
export function generateStaticParams() {
  return CATEGORY_NAMES.map((name) => ({ name }));
}

export const dynamicParams = false;
// 商品データは定期的に再生成（ISR、1時間）
export const revalidate = 3600;

function resolveName(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
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
      images: [`${SITE_URL}/logo.png`],
    },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.desc },
  };
}

export default async function CategoryPage({ params }) {
  const { name } = await params;
  const cat = resolveName(name);

  if (!CATEGORY_NAMES.includes(cat)) notFound();

  const { data } = await supabaseServer
    .from('products')
    .select('*, shops:shops_prices(*)')
    .eq('category', cat)
    .or('is_blocked.is.null,is_blocked.eq.false')
    .order('popularity_rank', { ascending: true })
    .limit(60);

  const products = (data || []).map(formatDbProduct);
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">{cat}</span>
        </nav>

        {/* カテゴリ横スクロールタブ */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORY_NAMES.map((name) => (
            <Link
              key={name}
              href={`/category/${encodeURIComponent(name)}`}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
                name === cat
                  ? 'bg-[#7B8E76] text-white'
                  : 'bg-[#F4EFEB] text-[#8E8282] hover:bg-[#E8E1DC]'
              }`}
            >
              {name}
            </Link>
          ))}
        </div>

        <h1 className="text-2xl font-black mb-2">{cat}の比較・おすすめ</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-8 leading-relaxed">
          {meta?.desc || `${cat}のベビー用品を楽天・Yahooの最安値と口コミで比較。`}
        </p>

        {products.length === 0 ? (
          <div className="text-center py-20 text-[#A5A19E]">
            <p className="text-sm font-bold mb-4">このカテゴリの商品は準備中です。</p>
            <Link href="/" className="text-[#7B8E76] font-black underline">アプリで探す</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <ProductCardLink key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
