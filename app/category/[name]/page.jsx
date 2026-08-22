import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { CATEGORY_TREE, CAT_META, formatDbProduct, UNIT_PRICE_CATEGORIES, IHERB_RELEVANT_CATEGORIES } from '@/src/lib/products';
import { CATEGORY_GUIDES, buildFaqLd } from '@/src/lib/categoryGuides';
import GuideModalButton from '@/src/components/GuideModalButton';
import SiteHeader from '@/src/components/SiteHeader';
import CategoryClient from '@/src/components/CategoryClient';
import CategoryGuide from '@/src/components/CategoryGuide';
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
    title: `${cat}のベビー用品 価格比較・口コミ`,
    desc: `${cat}のベビー用品を価格比較。最安値・口コミ・評価をまとめてチェック。`,
  };
  const url = `${SITE_URL}/category/${encodeURIComponent(cat)}`;
  return {
    title: meta.title,
    description: meta.desc,
    alternates: { canonical: url },
    // images未指定 → app/opengraph-image.jsx（1200×630）が自動適用される
    openGraph: { title: meta.title, description: meta.desc, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.desc },
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
      // 重複商品（非代表）は 301 で代表ページへ飛ぶため、内部リンクには出さない
      .is('canonical_id', null)
      .order('popularity_rank', { ascending: true })
      // 代表商品が最多のカテゴリでも全件を内部リンクできる件数にする（孤立ページ防止）
      .limit(400);
    if (!error && data) products = data.map(formatDbProduct);
  } catch {
    // Supabase接続失敗時は空リストで表示
  }

  // このカテゴリに商品があるブランド上位12件（出現数順）
  const brandCounts = new Map();
  for (const p of products) {
    if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
  }
  const catBrands = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([b]) => b);

  const meta = CAT_META[cat];
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta?.title || `${cat}のベビー用品`,
    description: meta?.desc || `${cat}のベビー用品を価格比較。`,
    url: `${SITE_URL}/category/${encodeURIComponent(cat)}`,
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: cat,
        item: `${SITE_URL}/category/${encodeURIComponent(cat)}`,
      },
    ],
  };
  // ページ下部のCategoryGuideで表示しているFAQを構造化データ化（FAQリッチリザルト対策）
  const faqLd = buildFaqLd(CATEGORY_GUIDES[cat]?.faq);
  const jsonLd = [collectionLd, breadcrumbLd, ...(faqLd ? [faqLd] : [])];

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

        {/* タイトル・説明（H1は「検索結果」ではなく内容のある見出しにする） */}
        <h1 className="text-xl font-black mb-1 mt-4">
          {cat === 'すべて'
            ? 'おすすめピックアップ'
            : meta?.title || `${cat}のベビー用品 価格比較・口コミ`}
        </h1>
        <p className="text-xs text-[#8E8282] font-bold mb-4 leading-relaxed">
          {meta?.desc || `${cat}のベビー用品を楽天・Yahooの最安値と口コミで比較。`}
        </p>

        {/* 選び方ガイド・ランキングへのショートカット */}
        <div className="flex flex-wrap gap-2 mb-4">
          <GuideModalButton guide={CATEGORY_GUIDES[cat] || null} />
          <Link
            href={`/ranking/${encodeURIComponent(cat)}`}
            className="inline-flex items-center gap-1.5 bg-[#FFF0F0] border border-[#F8D7D8] text-[#D98A8B] text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-transform"
          >
            人気ランキングTOP20 →
          </Link>
          {/* 内容量が「枚」で数えられるカテゴリだけ、単価比較ページへ導線を出す */}
          {UNIT_PRICE_CATEGORIES.includes(cat) && (
            <Link
              href={`/unit-price/${encodeURIComponent(cat)}`}
              className="inline-flex items-center gap-1.5 bg-[#EFF4EE] border border-[#CFDDCC] text-[#5F7359] text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-transform"
            >
              1枚あたり単価で比較 →
            </Link>
          )}
          {/* iHerbの取り扱いと内容が直結するカテゴリだけ、特集ページへ導線を出す */}
          {IHERB_RELEVANT_CATEGORIES.includes(cat) && (
            <Link
              href="/iherb"
              data-cta-position="category-shortcut"
              className="inline-flex items-center gap-1.5 bg-[#EAF4F2] border border-[#CDE6E0] text-[#4C9A87] text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-transform"
            >
              iHerbの海外サプリ・ケア用品も見る →
            </Link>
          )}
        </div>

        {/* クライアント側: サブカテゴリ・ソート・商品グリッド */}
        <CategoryClient products={products} cat={cat} />

        {/* このカテゴリのブランド（内部リンク） */}
        {catBrands.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-black mb-3">{cat}のブランドから探す</h2>
            <div className="flex flex-wrap gap-2">
              {catBrands.map((b) => (
                <Link
                  key={b}
                  href={`/brand/${encodeURIComponent(b)}`}
                  className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]"
                >
                  {b}
                </Link>
              ))}
              <Link
                href="/brand"
                className="inline-block px-4 py-2 rounded-full text-xs font-black text-[#7B8E76] border border-[#7B8E76]/30 hover:bg-[#7B8E76]/5"
              >
                ブランド一覧 →
              </Link>
            </div>
          </section>
        )}

        {/* 選び方ガイド（サーバー描画・SEO本文） */}
        <CategoryGuide cat={cat} />
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
