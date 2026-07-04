import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import {
  CATEGORY_TREE,
  formatDbProduct,
  getLowestPrice,
  getProxiedImage,
  cleanProductName,
} from '@/src/lib/products';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';
const CATEGORY_NAMES = CATEGORY_TREE.map((c) => c.name).filter((n) => n !== 'すべて');
const RANK_LIMIT = 20;

export function generateStaticParams() {
  return CATEGORY_NAMES.map((category) => ({ category }));
}

export const dynamicParams = false;
export const revalidate = 3600;

function resolveName(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

// 「2026年7月」のような年月表記（ISR再生成のたびに更新される）
function nowLabel() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function rankMeta(cat) {
  return {
    title: `【${nowLabel()}】${cat}おすすめ人気ランキングTOP${RANK_LIMIT}`,
    desc: `${cat}の売れ筋・人気商品をランキングで紹介。楽天・Yahoo!ショッピングの最安値とパパママの口コミをまとめてチェック。毎日更新。`,
  };
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const cat = resolveName(category);
  const meta = rankMeta(cat);
  const url = `${SITE_URL}/ranking/${encodeURIComponent(cat)}`;
  return {
    title: meta.title,
    description: meta.desc,
    alternates: { canonical: url },
    openGraph: { title: meta.title, description: meta.desc, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.desc },
  };
}

export default async function RankingPage({ params }) {
  const { category } = await params;
  const cat = resolveName(category);
  if (!CATEGORY_NAMES.includes(cat)) notFound();

  let products = [];
  try {
    const { data } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .eq('category', cat)
      .or('is_blocked.is.null,is_blocked.eq.false')
      .order('popularity_rank', { ascending: true })
      .limit(RANK_LIMIT);
    products = (data || []).map(formatDbProduct);
  } catch {
    // Supabase接続失敗時は空リストで表示
  }

  const meta = rankMeta(cat);
  const url = `${SITE_URL}/ranking/${encodeURIComponent(cat)}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: meta.title,
      url,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: `${SITE_URL}/product/${encodeURIComponent(p.id)}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: cat, item: `${SITE_URL}/category/${encodeURIComponent(cat)}` },
        { '@type': 'ListItem', position: 3, name: 'ランキング', item: url },
      ],
    },
  ];

  // 上位3位はメダル色で強調
  const rankColor = (i) =>
    i === 0 ? 'bg-[#D4AF37]' : i === 1 ? 'bg-[#A8A8A8]' : i === 2 ? 'bg-[#B08D57]' : 'bg-[#D4CDC7]';

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <Link href={`/category/${encodeURIComponent(cat)}`} className="hover:text-[#7B8E76]">{cat}</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">ランキング</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">{meta.title}</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-6 leading-relaxed">{meta.desc}</p>

        {products.length === 0 ? (
          <p className="text-xs text-[#A5A19E] font-bold py-10 text-center">ランキング集計中です。</p>
        ) : (
          <ol className="space-y-3">
            {products.map((p, i) => {
              const price = getLowestPrice(p.shops);
              return (
                <li key={p.id}>
                  <Link
                    href={`/product/${encodeURIComponent(p.id)}`}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-[#F4EFEB] p-3 hover:shadow-sm active:scale-[0.99] transition-all"
                  >
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full text-white text-xs font-black flex items-center justify-center ${rankColor(i)}`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-shrink-0 w-16 h-16 bg-[#F9F6F3] rounded-xl overflow-hidden">
                      <img
                        src={getProxiedImage(p.image, 'card')}
                        alt={p.name}
                        width={600}
                        height={600}
                        loading={i < 3 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-snug line-clamp-2">{cleanProductName(p.name, 60)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-[#7B8E76]">
                          {price > 0 ? `¥${price.toLocaleString()}〜` : '価格をチェック'}
                        </span>
                        {p.rating > 0 && (
                          <span className="text-[10px] font-black text-[#D4AF37]">★ {p.rating}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        {/* 他カテゴリのランキングへ（内部リンク） */}
        <section className="mt-10">
          <h2 className="text-base font-black mb-3">ほかのカテゴリのランキング</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_NAMES.filter((n) => n !== cat).map((n) => (
              <Link
                key={n}
                href={`/ranking/${encodeURIComponent(n)}`}
                className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]"
              >
                {n}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
