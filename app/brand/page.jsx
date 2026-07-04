import Link from 'next/link';
import { fetchBrandCounts } from '@/src/lib/brands';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

export const revalidate = 3600;

export const metadata = {
  title: 'ベビー用品ブランド一覧 価格比較・口コミ',
  description:
    'エルゴベビー・コンビ・アップリカ・ピジョンなど、HonestBabyで比較できるベビー用品ブランドの一覧。ブランドごとに最安値と口コミをまとめてチェック。',
  alternates: { canonical: `${SITE_URL}/brand` },
  openGraph: {
    title: 'ベビー用品ブランド一覧 価格比較・口コミ',
    description: 'HonestBabyで比較できるベビー用品ブランドの一覧。',
    url: `${SITE_URL}/brand`,
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'ベビー用品ブランド一覧' },
};

export default async function BrandIndexPage() {
  const brands = await fetchBrandCounts();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'ベビー用品ブランド一覧',
      url: `${SITE_URL}/brand`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'ブランド一覧', item: `${SITE_URL}/brand` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 pt-6 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">ブランド一覧</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">ベビー用品ブランド一覧</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-6 leading-relaxed">
          気になるブランドから商品を探せます。各ブランドの最安値・口コミをまとめてチェック。
        </p>

        {brands.length === 0 ? (
          <p className="text-xs text-[#A5A19E] font-bold py-10 text-center">準備中です。</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {brands.map((b) => (
              <li key={b.name}>
                <Link
                  href={`/brand/${encodeURIComponent(b.name)}`}
                  className="flex items-center justify-between bg-white rounded-2xl border border-[#F4EFEB] px-4 py-3.5 hover:shadow-sm active:scale-95 transition-all"
                >
                  <span className="text-sm font-bold leading-snug">{b.name}</span>
                  <span className="text-[10px] text-[#A5A19E] font-bold whitespace-nowrap ml-2">
                    {b.count}件
                  </span>
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
