import Link from 'next/link';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct } from '@/src/lib/products';
import SiteHeader from '@/src/components/SiteHeader';
import ProductCardLink from '@/src/components/ProductCardLink';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

export const revalidate = 3600;

export function generateMetadata() {
  const title = 'iHerbで買えるベビー・マタニティ用品まとめ';
  const desc = 'iHerbで購入できるベビーオイル・マタニティサプリ・スキンケアをまとめて紹介。海外の人気ナチュラルケア用品を口コミと価格でチェック。';
  const url = `${SITE_URL}/iherb`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

export default async function IherbPage() {
  let products = [];
  try {
    const { data, error } = await supabaseServer
      .from('shops_prices')
      .select('product:products(*, shops:shops_prices(*))')
      .eq('shop_name', 'iHerb')
      .limit(300);
    if (!error && data) {
      products = data
        .map((row) => row.product)
        .filter((p) => p && (p.is_blocked === null || p.is_blocked === false))
        .map(formatDbProduct);
    }
  } catch {
    // Supabase接続失敗時は空リストで表示
  }

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'iHerbで買えるベビー・マタニティ用品',
    itemListElement: products.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/product/${p.id}`,
    })),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'iHerb特集', item: `${SITE_URL}/iherb` },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="px-4 pt-6 pb-32 lg:max-w-7xl lg:mx-auto lg:px-10 lg:pt-8">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">iHerb特集</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">iHerbで買えるベビー・マタニティ用品</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-4 leading-relaxed">
          iHerbで購入できるベビーオイル・マタニティサプリ・ナチュラルスキンケアをまとめてチェック。
        </p>

        {products.length === 0 ? (
          <p className="text-xs text-[#A5A19E] font-bold py-10 text-center">近日公開予定です。</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <ProductCardLink key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListLd, breadcrumbLd]) }} />
      <SpaBottomNav />
    </div>
  );
}
