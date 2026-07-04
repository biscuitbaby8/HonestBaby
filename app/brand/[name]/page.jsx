import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct } from '@/src/lib/products';
import SiteHeader from '@/src/components/SiteHeader';
import ProductCardLink from '@/src/components/ProductCardLink';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

// ブランドはDB由来のためオンデマンドSSR + ISR（1時間）。
export const revalidate = 3600;

function resolveName(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

async function fetchBrandProducts(brand) {
  try {
    const { data } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .eq('brand', brand)
      .or('is_blocked.is.null,is_blocked.eq.false')
      .order('popularity_rank', { ascending: true })
      .limit(300);
    return (data || []).map(formatDbProduct);
  } catch {
    return [];
  }
}

function brandMeta(brand) {
  return {
    title: `${brand}のベビー用品 価格比較・口コミ`,
    desc: `${brand}のベビー用品を楽天・Yahoo!ショッピングの最安値とパパママの口コミで比較。人気商品をまとめてチェック。`,
  };
}

export async function generateMetadata({ params }) {
  const { name } = await params;
  const brand = resolveName(name);
  const meta = brandMeta(brand);
  const url = `${SITE_URL}/brand/${encodeURIComponent(brand)}`;
  return {
    title: meta.title,
    description: meta.desc,
    alternates: { canonical: url },
    openGraph: { title: meta.title, description: meta.desc, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.desc },
  };
}

export default async function BrandPage({ params }) {
  const { name } = await params;
  const brand = resolveName(name);

  const products = await fetchBrandProducts(brand);
  if (products.length === 0) notFound();

  // ブランド内のカテゴリ一覧（内部リンク用）
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const meta = brandMeta(brand);
  const url = `${SITE_URL}/brand/${encodeURIComponent(brand)}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: meta.title,
      description: meta.desc,
      url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'ブランド一覧', item: `${SITE_URL}/brand` },
        { '@type': 'ListItem', position: 3, name: brand, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="px-4 pt-6 pb-32 lg:max-w-7xl lg:mx-auto lg:px-10 lg:pt-8">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <Link href="/brand" className="hover:text-[#7B8E76]">ブランド一覧</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">{brand}</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">{meta.title}</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-4 leading-relaxed">{meta.desc}</p>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 mb-4 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/category/${encodeURIComponent(c)}`}
                className="flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#8E8282] hover:bg-[#E8E1DC]"
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCardLink key={p.id} product={p} />
          ))}
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
