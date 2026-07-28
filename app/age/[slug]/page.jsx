import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct } from '@/src/lib/products';
import { AGE_GUIDES, getAgeGuide } from '@/src/lib/ageGuides';
import SiteHeader from '@/src/components/SiteHeader';
import ProductCardLink from '@/src/components/ProductCardLink';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

export function generateStaticParams() {
  return AGE_GUIDES.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getAgeGuide(slug);
  if (!guide) return { title: 'HonestBaby' };
  const url = `${SITE_URL}/age/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.desc,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.desc, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: guide.title, description: guide.desc },
  };
}

async function fetchAgeProducts(categories) {
  try {
    const { data } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .in('category', categories)
      .or('is_blocked.is.null,is_blocked.eq.false')
      // 重複商品（非代表）は 301 で代表ページへ飛ぶため、内部リンクには出さない
      .is('canonical_id', null)
      .order('popularity_rank', { ascending: true })
      .limit(12);
    return (data || []).map(formatDbProduct);
  } catch {
    return [];
  }
}

export default async function AgePage({ params }) {
  const { slug } = await params;
  const guide = getAgeGuide(slug);
  if (!guide) notFound();

  const products = await fetchAgeProducts(guide.categories);
  const url = `${SITE_URL}/age/${guide.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: guide.title,
      description: guide.desc,
      url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: guide.label, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">{guide.label}</span>
        </nav>

        {/* 月齢タブ（内部リンク） */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 mb-4">
          {AGE_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/age/${g.slug}`}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                g.slug === guide.slug ? 'bg-[#7B8E76] text-white' : 'bg-[#F4EFEB] text-[#8E8282] hover:bg-[#E8E1DC]'
              }`}
            >
              {g.label}
            </Link>
          ))}
        </div>

        <h1 className="text-xl font-black mb-2">{guide.title}</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-6 leading-relaxed">{guide.intro}</p>

        {/* この時期に必要なもの（内部リンク付きチェックリスト） */}
        <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-8">
          <h2 className="text-base font-black mb-4">この時期に必要なもの</h2>
          <ul className="space-y-3">
            {guide.needs.map((n) => (
              <li key={n.name} className="flex gap-2.5">
                <span className="text-[#7B8E76] font-black flex-shrink-0">✓</span>
                <div className="min-w-0">
                  <Link
                    href={n.href}
                    className="text-sm font-bold text-[#5A4C4C] underline decoration-dotted underline-offset-2 hover:text-[#7B8E76]"
                  >
                    {n.name}
                  </Link>
                  <p className="text-xs text-[#8E8282] leading-relaxed mt-0.5">{n.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 先輩パパママのアドバイス */}
        {guide.tips?.length > 0 && (
          <section className="bg-[#FFF9E6] rounded-[2rem] border border-[#F2E3AE] p-6 mb-8">
            <h2 className="text-base font-black mb-3 text-[#B8933D]">忖度なしアドバイス</h2>
            <ul className="space-y-2">
              {guide.tips.map((t, i) => (
                <li key={i} className="text-xs text-[#8E8282] leading-relaxed flex gap-1.5">
                  <span className="text-[#B8933D] font-black flex-shrink-0">{i + 1}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* この時期の人気アイテム */}
        {products.length > 0 && (
          <section>
            <h2 className="text-base font-black mb-4">この時期の人気アイテム</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCardLink key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
