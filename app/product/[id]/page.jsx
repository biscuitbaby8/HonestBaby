import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct, getLowestPrice, CAT_META, getProxiedImage, cleanProductName } from '@/src/lib/products';
import { toVCUrl, getAmazonUrl, withAmazonTag } from '@/src/lib/affiliate';
import { searchAmazonItems, selectAmazonItem } from '@/lib/amazonApi';
import { saleBadgeLabel, saleMatchesShop, getTodayDeals, getShopBadge } from '@/src/lib/sales';
import { fetchActiveSale } from '@/src/lib/salesServer';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';
import ProductCardLink from '@/src/components/ProductCardLink';
import ProductAppGate from '@/src/components/ProductAppGate';
import ReviewHelpfulButton from '@/src/components/ReviewHelpfulButton';
import PriceHistoryChart from '@/src/components/PriceHistoryChart';

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

// 価格推移（過去90日）。日次cronが記録した最安値スナップショット。
async function fetchPriceHistory(productId) {
  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data } = await supabaseServer
      .from('price_history')
      .select('shop_name, price, recorded_on')
      .eq('product_id', productId)
      .gte('recorded_on', since)
      .order('recorded_on', { ascending: true });
    return data || [];
  } catch {
    return [];
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

  const [related, activeSale, priceHistory, amazonResult] = await Promise.all([
    fetchRelated(product.category, product.id),
    fetchActiveSale(),
    fetchPriceHistory(product.id),
    // Creators API（資格未達・未設定時は eligible:false → 検索リンク表示に自動フォールバック）
    searchAmazonItems(cleanProductName(product.name, 40), 5),
  ]);
  // 検索結果から「本体」とみなせる出品だけを採用（付属品のみの出品や
  // 楽天/Yahoo最安値と乖離しすぎる価格は誤マッチとして棄却 → 検索リンク表示に落ちる）
  const amazonItem = selectAmazonItem(amazonResult.items, {
    productName: product.name,
    referencePrice: getLowestPrice(product.shops),
  });
  // Amazonの実価格が取れたら価格履歴にも記録（1日1行、ベストエフォート）
  if (amazonItem) {
    try {
      const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
      await supabaseServer.from('price_history').upsert([{
        product_id: product.id,
        shop_name: 'Amazon',
        price: amazonItem.price,
        recorded_on: jstDate,
      }], { onConflict: 'product_id,shop_name,recorded_on' });
    } catch { /* noop */ }
  }
  const todayDeals = getTodayDeals();
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

  // CTA用のショップ短縮名（「楽天で見る」等、押した先が明確な文言にする）
  const shopShort = (name) => {
    const n = String(name || '');
    if (n.includes('楽天')) return '楽天';
    if (/yahoo|ヤフー/i.test(n)) return 'Yahoo!';
    if (/amazon/i.test(n)) return 'Amazon';
    return n.length > 5 ? n.slice(0, 5) : n || 'ショップ';
  };
  // 楽天/Yahoo/Amazon を横断した実際の最安値（「🏆最安」バッジの判定に使う）
  const amazonPrice = amazonItem ? Number(amazonItem.price) : 0;
  const candidatePrices = [
    ...shops.map((s) => Number(s.lowestPrice)).filter((p) => p > 0),
    ...(amazonPrice > 0 ? [amazonPrice] : []),
  ];
  const lowestAll = candidatePrices.length ? Math.min(...candidatePrices) : 0;

  // レビュー件数は実数のみ採用（捏造を避ける）。評価と件数の両方がある時だけ aggregateRating を出す。
  const reviewCount = Number(product.reviewsCount) || reviews.length || 0;
  const hasRating = product.rating > 0 && reviewCount > 0;

  const pageUrl = `${SITE_URL}/product/${encodeURIComponent(product.id)}`;
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cleanProductName(product.name, 100),
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
        // shops は価格昇順ソート済み。単一ショップ時は lowPrice と同値
        // （Search Console の「highPrice がありません」推奨対応）
        highPrice: shops.length > 0 ? Number(shops[shops.length - 1].lowestPrice) : price,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* アプリ利用経験者はその場でアプリ起動（従来の商品モーダル表示）、
          検索エンジン・初訪問者にはこのSSRページをそのまま表示する。 */}
      <ProductAppGate productId={product.id}>
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
            <img
              src={getProxiedImage(product.image, 'hero')}
              alt={product.name}
              width={1000}
              height={1000}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-contain rounded-[1.5rem]"
            />
          </div>
          <div className="p-6">
            {product.category && (
              <span className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest">{product.category}</span>
            )}
            <h1 className="text-xl font-black leading-snug mt-1 mb-3">{cleanProductName(product.name, 100)}</h1>
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

            <div className="mb-6">
              <h2 className="text-sm font-black mb-3">ショップ価格比較</h2>
              <ul className="space-y-2">
                {shops.map((s, i) => {
                  const periodSellers = (s.sellers || [])
                    .filter((sl) => sl.period && Number(sl.price) > 0)
                    .sort((a, b) => Number(a.price) - Number(b.price));
                  const isCheapest = Number(s.lowestPrice) > 0 && Number(s.lowestPrice) === lowestAll;
                  const b = getShopBadge(activeSale, todayDeals, s.name || '');
                  // 行の中身（バッジ・価格・CTA）。行全体をタップ領域にするため <a> でラップする
                  const inner = (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          {isCheapest && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap bg-[#7B8E76] text-white">🏆 最安</span>
                          )}
                          <span className="text-xs font-bold text-[#5A4C4C]">{s.name}</span>
                          {b && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap border ${
                              b.kind === 'sale' ? 'bg-white border-[#E8894A] text-[#E8894A]' : 'bg-[#FFF9E6] border-[#F2E3AE] text-[#B8933D]'
                            }`}>
                              {b.label}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2.5 shrink-0">
                          <span className="text-sm font-black text-[#7B8E76]">¥{Number(s.lowestPrice).toLocaleString()}</span>
                          {s.url && (
                            <span className={`text-[11px] font-black text-white px-3 py-1.5 rounded-full whitespace-nowrap ${isCheapest ? 'bg-[#7B8E76]' : 'bg-[#F2ABAC]'}`}>
                              {shopShort(s.name)}で見る
                            </span>
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
                    </>
                  );
                  const rowClass = `block rounded-2xl px-4 py-3 border transition-colors ${
                    isCheapest ? 'bg-[#F3F7F1] border-[#7B8E76] shadow-sm' : 'bg-[#FBF9F7] border-[#F4EFEB] active:bg-[#F4EFEB]'
                  }`;
                  return (
                    <li key={i}>
                      {s.url ? (
                        <a
                          href={toVCUrl(s.url)}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          data-cta-position={isCheapest ? 'product-shoplist-top' : 'product-shoplist'}
                          className={rowClass}
                        >
                          {inner}
                        </a>
                      ) : (
                        <div className={rowClass}>{inner}</div>
                      )}
                    </li>
                  );
                })}
                {/* Amazon: Creators APIで実価格が取れれば直リンク、未開通時はタグ付き検索リンク */}
                {(() => {
                  const amazonCheapest = amazonPrice > 0 && amazonPrice === lowestAll;
                  return (
                    <li>
                      <a
                        href={amazonItem ? withAmazonTag(amazonItem.url) : getAmazonUrl(cleanProductName(product.name, 40))}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        data-cta-position={amazonItem ? (amazonCheapest ? 'product-shoplist-top' : 'product-shoplist') : 'product-shoplist-amazon-search'}
                        className={`block rounded-2xl px-4 py-3 border transition-colors ${
                          amazonCheapest ? 'bg-[#F3F7F1] border-[#7B8E76] shadow-sm' : 'bg-[#FBF9F7] border-[#F4EFEB] active:bg-[#F4EFEB]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            {amazonCheapest && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap bg-[#7B8E76] text-white">🏆 最安</span>
                            )}
                            <span className="text-xs font-bold text-[#5A4C4C]">Amazon.co.jp</span>
                            {activeSale?.shop === 'amazon' && (
                              <span className="bg-white border border-[#E8894A] text-[9px] text-[#E8894A] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                                {saleBadgeLabel(activeSale)}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-2.5 shrink-0">
                            {amazonItem && (
                              <span className="text-sm font-black text-[#7B8E76]">¥{amazonItem.price.toLocaleString()}</span>
                            )}
                            <span className={`text-[11px] font-black text-white px-3 py-1.5 rounded-full whitespace-nowrap ${amazonCheapest ? 'bg-[#7B8E76]' : 'bg-[#F2ABAC]'}`}>
                              {amazonItem ? 'Amazonで見る' : activeSale?.shop === 'amazon' ? 'セール価格をチェック🔥' : 'Amazonで最安値をチェック'}
                            </span>
                          </span>
                        </div>
                      </a>
                    </li>
                  );
                })()}
              </ul>
            </div>

          </div>
        </div>

        {priceHistory.length > 0 && (
          <div className="mt-8">
            <PriceHistoryChart history={priceHistory} />
            <p className="text-[10px] text-[#A5A19E] font-bold mt-2 px-1">
              💡 底値を待つなら、アプリの価格アラート（目標価格になったら通知）が便利です
            </p>
          </div>
        )}

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
                  {(r.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {r.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF0EA] text-[#7B8E76]">{t}</span>
                      ))}
                    </div>
                  )}
                  {r.comment && <p className="text-xs text-[#8E8282] leading-relaxed">{r.comment}</p>}
                  <div className="mt-2.5">
                    <ReviewHelpfulButton reviewId={r.id} initialCount={r.helpful_count} />
                  </div>
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
      </ProductAppGate>
    </>
  );
}
