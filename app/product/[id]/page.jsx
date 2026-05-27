import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct, getLowestPrice, CAT_META } from '@/src/lib/products';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 商品データは定期的に再生成（ISR、1時間）。未知IDはオンデマンドSSR。
export const revalidate = 3600;

async function fetchProduct(rawId) {
  let id;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    id = rawId;
  }
  const select = '*, shops:shops_prices(*), honestReviews:reviews(*), snsReviews:sns_reviews(*)';
  try {
    const query = UUID_RE.test(id)
      ? supabaseServer.from('products').select(select).eq('id', id)
      : supabaseServer.from('products').select(select).eq('rakuten_item_code', id);
    const { data } = await query.maybeSingle();
    return data ? formatDbProduct(data) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) return { title: 'HonestBaby' };

  const title = `${product.name} の最安値・価格比較 | HonestBaby`;
  const desc = `${product.name}の最安値・価格比較。評価${product.rating || ''}★。楽天・Yahoo最安値をまとめてチェック。忖度なしのリアルレビューも掲載。`;
  const url = `${SITE_URL}/product/${encodeURIComponent(product.id)}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      type: 'website',
      images: [product.image || `${SITE_URL}/logo.png`],
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [product.image] },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  const price = getLowestPrice(product.shops);
  const shops = (product.shops || [])
    .filter((s) => Number(s.lowestPrice) > 0)
    .sort((a, b) => Number(a.lowestPrice) - Number(b.lowestPrice));
  const reviews = (product.honestReviews || []).slice(0, 5);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(price > 0 && {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'JPY',
        lowPrice: price,
        offerCount: shops.length || 1,
        availability: 'https://schema.org/InStock',
      },
    }),
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewsCount || reviews.length || 1,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          {product.category && CAT_META[product.category] && (
            <>
              <span className="mx-1.5">›</span>
              <Link href={`/category/${encodeURIComponent(product.category)}`} className="hover:text-[#7B8E76]">
                {product.category}
              </Link>
            </>
          )}
        </nav>

        <div className="bg-white rounded-[2rem] border border-[#F4EFEB] overflow-hidden shadow-sm">
          <div className="aspect-square bg-[#F9F6F3] p-6">
            <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded-[1.5rem]" />
          </div>
          <div className="p-6">
            {product.category && (
              <span className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest">{product.category}</span>
            )}
            <h1 className="text-xl font-black leading-snug mt-1 mb-3">{product.name}</h1>
            <div className="flex items-center gap-3 mb-4">
              {product.rating > 0 && (
                <span className="bg-[#FFF9E6] text-[#D4AF37] px-2.5 py-1 rounded-full text-xs font-black">★ {product.rating}</span>
              )}
              {product.brand && <span className="text-xs text-[#8E8282] font-bold">{product.brand}</span>}
            </div>
            <p className="text-3xl font-black text-[#7B8E76] leading-none mb-6">
              <span className="text-base mr-1">¥</span>
              {price > 0 ? price.toLocaleString() : '---'}
              <span className="text-xs text-[#A5A19E] ml-1 font-normal">{price > 0 ? '〜' : ''}</span>
            </p>

            {shops.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-black mb-3">ショップ価格比較</h2>
                <ul className="space-y-2">
                  {shops.map((s, i) => (
                    <li key={i} className="flex items-center justify-between bg-[#FBF9F7] rounded-2xl px-4 py-3 border border-[#F4EFEB]">
                      <span className="text-xs font-bold text-[#5A4C4C]">{s.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-sm font-black text-[#7B8E76]">¥{Number(s.lowestPrice).toLocaleString()}</span>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer sponsored" className="text-[11px] font-black text-white bg-[#F2ABAC] px-3 py-1.5 rounded-full">
                            見る
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link href="/" className="block text-center text-sm font-black text-white bg-[#7B8E76] px-6 py-3.5 rounded-full active:scale-95 transition-transform">
              アプリで詳しく見る（最新価格・口コミ）
            </Link>
          </div>
        </div>

        {reviews.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-black mb-4">口コミ・レビュー</h2>
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#F4EFEB] p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-black text-[#5A4C4C]">{r.user_name || 'ユーザー'}</span>
                    {r.rating && <span className="text-[#D4AF37] text-xs font-black">★ {r.rating}</span>}
                  </div>
                  <p className="text-xs text-[#8E8282] leading-relaxed">{r.content}</p>
                </div>
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
