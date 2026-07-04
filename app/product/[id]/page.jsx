import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct, getLowestPrice, CAT_META, getProxiedImage, cleanProductName } from '@/src/lib/products';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';
import ProductCardLink from '@/src/components/ProductCardLink';
import ProductClient from './ProductClient';

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

// 同カテゴリの人気商品を関連商品として取得（内部リンク強化・回遊性向上）
async function fetchRelated(category, excludeId) {
  if (!category) return [];
  try {
    const { data } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .eq('category', category)
      .neq('id', excludeId)
      .or('is_blocked.is.null,is_blocked.eq.false')
      .order('popularity_rank', { ascending: true })
      .limit(6);
    return (data || []).map(formatDbProduct);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) return { title: 'HonestBaby' };

  const shortName = cleanProductName(product.name);
  const title = `${shortName} の最安値・価格比較`;
  const desc = `${shortName}の最安値・価格比較。${product.rating > 0 ? `評価${product.rating}★。` : ''}楽天・Yahoo最安値をまとめてチェック。忖度なしのリアルレビューも掲載。`;
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

  const related = await fetchRelated(product.category, product.id);
  const price = getLowestPrice(product.shops);
  const shops = (product.shops || [])
    .filter((s) => {
      if (Number(s.lowestPrice) <= 0) return false;
      // 楽天市場名でYahoo URLが入っている古いDBデータを除外
      const name = (s.name || '').toLowerCase();
      const url = (s.url || '').toLowerCase();
      if (name.includes('楽天') && url && !url.includes('rakuten')) return false;
      return true;
    })
    .sort((a, b) => Number(a.lowestPrice) - Number(b.lowestPrice));
  const reviews = (product.honestReviews || []).slice(0, 5);

  // レビュー件数は実数のみ採用（捏造を避ける）。評価と件数の両方がある時だけ aggregateRating を出す。
  const reviewCount = Number(product.reviewsCount) || reviews.length || 0;
  const hasRating = product.rating > 0 && reviewCount > 0;

  const pageUrl = `${SITE_URL}/product/${encodeURIComponent(product.id)}`;
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    url: pageUrl,
    ...(product.description
      ? { description: String(product.description).slice(0, 500) }
      : {}),
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
    ...(hasRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
      // 個別レビュー（aggregateRating がある場合のみ、上位3件）
      ...(reviews.length > 0 && {
        review: reviews.slice(0, 3).map((r) => ({
          '@type': 'Review',
          ...(r.rating && {
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
          }),
          author: { '@type': 'Person', name: r.user_name || 'ユーザー' },
          reviewBody: r.comment,
        })),
      }),
    }),
  };

  // パンくず構造化データ（ホーム > カテゴリ > 商品）
  const breadcrumbItems = [{ name: 'ホーム', url: `${SITE_URL}/` }];
  if (product.category && CAT_META[product.category]) {
    breadcrumbItems.push({
      name: product.category,
      url: `${SITE_URL}/category/${encodeURIComponent(product.category)}`,
    });
  }
  breadcrumbItems.push({
    name: product.name,
    url: `${SITE_URL}/product/${encodeURIComponent(product.id)}`,
  });
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };

  const jsonLd = [productLd, breadcrumbLd];

  return (
    <>
      {/* 構造化データは常時出力（アプリ起動後にSSRページが入れ替わってもSEOには影響しない） */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductClient productId={product.id}>
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
            <img src={getProxiedImage(product.image, 'hero')} alt={product.name} className="w-full h-full object-contain rounded-[1.5rem]" />
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
              {product.brand && (
                <Link
                  href={`/brand/${encodeURIComponent(product.brand)}`}
                  className="text-xs text-[#8E8282] font-bold hover:text-[#7B8E76] underline decoration-dotted underline-offset-2"
                >
                  {product.brand}
                </Link>
              )}
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
                  {shops.map((s, i) => {
                    const periodSellers = (s.sellers || [])
                      .filter((sl) => sl.period && Number(sl.price) > 0)
                      .sort((a, b) => Number(a.price) - Number(b.price));
                    return (
                      <li key={i} className="bg-[#FBF9F7] rounded-2xl px-4 py-3 border border-[#F4EFEB]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#5A4C4C]">{s.name}</span>
                          <span className="flex items-center gap-3">
                            <span className="text-sm font-black text-[#7B8E76]">¥{Number(s.lowestPrice).toLocaleString()}</span>
                            {s.url && (
                              <a href={s.url} target="_blank" rel="noopener noreferrer sponsored" className="text-[11px] font-black text-white bg-[#F2ABAC] px-3 py-1.5 rounded-full">
                                見る
                              </a>
                            )}
                          </span>
                        </div>
                        {periodSellers.length > 1 && (
                          <ul className="mt-2 pt-2 border-t border-[#EFE7E0] space-y-1">
                            {periodSellers.map((sl, j) => (
                              <li key={j} className="flex items-center justify-between text-[11px]">
                                <span className="text-[#8E8282] font-bold">{sl.period}</span>
                                <span className="text-[#5A4C4C] font-black">¥{Number(sl.price).toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <Link href="/" className="block text-center text-sm font-black text-white bg-[#7B8E76] px-6 py-3.5 rounded-full active:scale-95 transition-transform">
              アプリで詳しく見る（最新価格・口コミ）
            </Link>
          </div>
        </div>

        {product.description && (
          <section className="mt-8 bg-white rounded-[2rem] border border-[#F4EFEB] p-6">
            <h2 className="text-lg font-black mb-3">商品説明</h2>
            <p className="text-xs text-[#8E8282] leading-relaxed whitespace-pre-line">{product.description}</p>
          </section>
        )}

        {product.aiAnalysis && (
          <section className="mt-8 bg-white rounded-[2rem] border border-[#F4EFEB] p-6">
            <h2 className="text-lg font-black mb-3">HonestBaby のAI分析</h2>
            <p className="text-xs text-[#8E8282] leading-relaxed whitespace-pre-line">{product.aiAnalysis}</p>
          </section>
        )}

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
                  <p className="text-xs text-[#8E8282] leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-black mb-4">
              {product.category ? `${product.category}の関連商品` : '関連商品'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {related.map((p) => (
                <ProductCardLink key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
          </main>

          <SpaBottomNav />
        </div>
      </ProductClient>
    </>
  );
}
