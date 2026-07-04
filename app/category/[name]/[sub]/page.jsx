import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { CATEGORY_TREE, formatDbProduct } from '@/src/lib/products';
import SiteHeader from '@/src/components/SiteHeader';
import CategoryClient from '@/src/components/CategoryClient';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

// subs は string | { name, subsubs? } の混在
const getSubName = (sub) => (typeof sub === 'string' ? sub : sub.name);

export function generateStaticParams() {
  return CATEGORY_TREE.filter((c) => c.name !== 'すべて').flatMap((c) =>
    (c.subs || []).map((s) => ({ name: c.name, sub: getSubName(s) }))
  );
}

export const dynamicParams = false;
export const revalidate = 3600;

function resolveName(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

// サブカテゴリの title / description（例: 「ベビーカー A型」）
function subMeta(cat, sub) {
  return {
    title: `${cat} ${sub} の価格比較・おすすめ`,
    desc: `${cat}（${sub}）を楽天・Yahoo!ショッピングの最安値とパパママの口コミで比較。人気商品のランキングをチェック。`,
  };
}

export async function generateMetadata({ params }) {
  const { name, sub: rawSub } = await params;
  const cat = resolveName(name);
  const sub = resolveName(rawSub);
  const meta = subMeta(cat, sub);
  const url = `${SITE_URL}/category/${encodeURIComponent(cat)}/${encodeURIComponent(sub)}`;
  return {
    title: meta.title,
    description: meta.desc,
    alternates: { canonical: url },
    openGraph: { title: meta.title, description: meta.desc, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.desc },
  };
}

export default async function SubCategoryPage({ params }) {
  const { name, sub: rawSub } = await params;
  const cat = resolveName(name);
  const sub = resolveName(rawSub);

  const catEntry = CATEGORY_TREE.find((c) => c.name === cat);
  if (!catEntry || !(catEntry.subs || []).some((s) => getSubName(s) === sub)) notFound();

  let products = [];
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .eq('category', cat)
      .eq('sub_category', sub)
      .or('is_blocked.is.null,is_blocked.eq.false')
      .order('popularity_rank', { ascending: true })
      .limit(300);
    if (!error && data) products = data.map(formatDbProduct);
  } catch {
    // Supabase接続失敗時は空リストで表示
  }

  const meta = subMeta(cat, sub);
  const url = `${SITE_URL}/category/${encodeURIComponent(cat)}/${encodeURIComponent(sub)}`;
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
        { '@type': 'ListItem', position: 2, name: cat, item: `${SITE_URL}/category/${encodeURIComponent(cat)}` },
        { '@type': 'ListItem', position: 3, name: sub, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="px-4 pt-6 pb-32 lg:max-w-7xl lg:mx-auto lg:px-10 lg:pt-8">
        {/* パンくず */}
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <Link href={`/category/${encodeURIComponent(cat)}`} className="hover:text-[#7B8E76]">{cat}</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">{sub}</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">{meta.title}</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-4 leading-relaxed">{meta.desc}</p>

        {/* クライアント側: サブカテゴリ(リンク)・サブサブ・ソート・商品グリッド */}
        <CategoryClient products={products} cat={cat} sub={sub} />
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
