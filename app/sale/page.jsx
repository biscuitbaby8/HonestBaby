import Link from 'next/link';
import { saleStatusLabel, SALE_CALENDAR, SALE_KEYWORDS } from '@/src/lib/sales';
import { fetchActiveSale, fetchSalePicks } from '@/src/lib/salesServer';
import { formatDbProduct, getLowestPrice, getProxiedImage, CATEGORIES } from '@/src/lib/products';
import {
  getAmazonUrl, getAmazonDealsUrl, withAmazonTag,
  getYahooSearchUrl, getYahooTopUrl,
} from '@/src/lib/affiliate';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

// 外部リンク(<a>)と内部リンク(<Link>)で見た目を揃えるための共通クラス
const ctaClass =
  'block text-center text-sm font-black text-white bg-[#E8894A] px-6 py-3.5 rounded-full active:scale-95 transition-transform mb-5';
const chipClass =
  'inline-block px-3.5 py-2 rounded-full text-[11px] font-bold bg-white/80 text-[#5A4C4C] border border-[#F5D5B8] hover:bg-white';

// 自サイトのカテゴリURL（サブカテゴリ指定があればそちらへ）
const categoryPath = (k) =>
  `/category/${encodeURIComponent(k.category)}` +
  (k.sub ? `/${encodeURIComponent(k.sub)}` : '');

// 開催中セールのショップに合わせた導線。
// Amazon / Yahoo! はアフィリエイトが有効なのでモールへ直リンクする。
// 楽天だけは検索ページ用のアフィリエイト経路が無く（商品ごとのアフィリエイトURLを
// APIから受け取る方式で、hb.afl の hgc セグメントは商品単位に楽天が生成するため
// こちらで組み立てられない）、素のリンクで外部へ流すと収益にならない。
// そのため楽天セール時は自サイトのカテゴリページへ送る。カテゴリ内の商品リンクは
// 楽天アフィリエイト済みなので、比較を挟みつつ収益も維持できる。
const SALE_SHOP_LINKS = {
  amazon: {
    label: 'Amazon',
    external: true,
    cta: 'Amazonのセール会場を見る →',
    venue: () => getAmazonDealsUrl(),
    link: (k) => getAmazonUrl(k.keyword),
  },
  yahoo: {
    label: 'Yahoo!ショッピング',
    external: true,
    cta: 'Yahoo!ショッピングのセール会場を見る →',
    venue: () => getYahooTopUrl(),
    link: (k) => getYahooSearchUrl(k.keyword),
  },
  rakuten: {
    label: '楽天市場',
    external: false,
    cta: 'HonestBabyで価格を比較する →',
    venue: () => '/',
    link: (k) => categoryPath(k),
  },
};

const SITE_URL = 'https://honestbaby-care.com';

// セール開始/終了の切り替え反映を早めるため30分で再生成
export const revalidate = 1800;

export const metadata = {
  title: 'ベビー用品のセール・買い時カレンダー',
  description:
    'Amazonプライムデー・楽天スーパーセール・超PayPay祭など、ベビー用品が安く買えるタイミングをまとめて解説。おむつ・ミルクの買いだめ時期や、セール価格が本当に安いか比較するコツも紹介。',
  alternates: { canonical: `${SITE_URL}/sale` },
  openGraph: {
    title: 'ベビー用品のセール・買い時カレンダー',
    description: 'ベビー用品が安く買えるタイミングをまとめて解説。開催中のセール情報も。',
    url: `${SITE_URL}/sale`,
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'ベビー用品のセール・買い時カレンダー' },
};

export default async function SalePage() {
  const sale = await fetchActiveSale();
  // 未知のshop値でも導線が壊れないようAmazonにフォールバック
  const saleShop = (sale && SALE_SHOP_LINKS[sale.shop]) || SALE_SHOP_LINKS.amazon;

  // Amazon開催中のときだけ「注目商品」比較セクションを出す（Amazon価格は手動登録分のみ）。
  // 楽天/Yahooの現在最安値は既存のshops_pricesデータから計算するので、
  // ここではAmazon価格との単純比較だけ行う。
  const rawPicks = sale?.shop === 'amazon' ? await fetchSalePicks(sale.id) : [];
  const picks = rawPicks.map((pk) => {
    const product = formatDbProduct(pk.product);
    const otherPrice = getLowestPrice(product.shops);
    const amazonPrice = Number(pk.amazon_price);
    // 消耗品はパック数量がAmazonと楽天/Yahooで違うことが多く、総額の
    // 単純比較は「5ロール¥2952」と「1ロール¥1080」を同じ土俵で比べてしまい
    // 誤った「お得」判定になる。amazon_qty/other_qty/unit_labelが揃っている
    // 行だけ、1単位あたりの単価で比較する（揃っていなければ総額で比較）。
    const unitLabel = pk.unit_label || null;
    const amazonQty = Number(pk.amazon_qty) || 0;
    const otherQty = Number(pk.other_qty) || 0;
    const hasUnit = !!unitLabel && amazonQty > 0 && otherQty > 0;
    const amazonUnitPrice = hasUnit ? amazonPrice / amazonQty : null;
    const otherUnitPrice = hasUnit && otherPrice > 0 ? otherPrice / otherQty : null;
    const cmpAmazon = hasUnit ? amazonUnitPrice : amazonPrice;
    const cmpOther = hasUnit ? otherUnitPrice : otherPrice;
    return {
      id: pk.id,
      amazonUrl: withAmazonTag(pk.amazon_url),
      amazonPrice,
      otherPrice,
      unitLabel,
      amazonQty,
      otherQty,
      amazonUnitPrice,
      otherUnitPrice,
      product,
      verdict: cmpOther > 0 && cmpAmazon < cmpOther
        ? 'amazon-cheaper'
        : cmpOther > 0 && cmpAmazon > cmpOther
          ? 'other-cheaper'
          : 'tie',
    };
  });
  const picksByCategory = picks.reduce((acc, p) => {
    const cat = p.product.category || 'その他';
    (acc[cat] ||= []).push(p);
    return acc;
  }, {});
  // カテゴリの並び順を一覧ページ等と同じ順序（CATEGORY_TREE）に揃える。
  // 未知のカテゴリ値が混在しても表示から漏れないよう、末尾にまとめて出す。
  const categoryOrder = [...CATEGORIES, 'その他'];
  const categoryRank = (cat) => {
    const i = categoryOrder.indexOf(cat);
    return i === -1 ? categoryOrder.length : i;
  };
  const sortedCategoryEntries = Object.entries(picksByCategory).sort(
    ([a], [b]) => categoryRank(a) - categoryRank(b)
  );

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'ベビー用品のセール・買い時カレンダー',
      url: `${SITE_URL}/sale`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'セール・買い時', item: `${SITE_URL}/sale` },
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
          <span className="text-[#5A4C4C]">セール・買い時</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">ベビー用品のセール・買い時カレンダー</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-6 leading-relaxed">
          おむつ・ミルクなどの消耗品からベビーカーまで、安く買えるタイミングを忖度なしでまとめました。
        </p>

        {/* 開催中のセール */}
        {sale && (
          <section className="bg-gradient-to-br from-[#FFF3E8] to-[#FFE9D6] border border-[#F5D5B8] rounded-[2rem] p-6 mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#E8894A] text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
                {saleStatusLabel(sale)}
              </span>
            </div>
            <h2 className="text-lg font-black mb-1">{sale.name}</h2>
            <p className="text-[11px] font-bold text-[#B07A4A] mb-4">{sale.periodLabel}</p>

            {saleShop.external ? (
              <a
                href={saleShop.venue()}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={ctaClass}
              >
                {saleShop.cta}
              </a>
            ) : (
              // 内部リンクは next/link で。クローラーに辿らせたいので sponsored は付けない
              <Link href={saleShop.venue()} className={ctaClass}>
                {saleShop.cta}
              </Link>
            )}

            <p className="text-xs font-black text-[#5A4C4C] mb-2">狙い目カテゴリから探す</p>
            <div className="flex flex-wrap gap-2">
              {SALE_KEYWORDS.map((k) =>
                saleShop.external ? (
                  <a
                    key={k.label}
                    href={saleShop.link(k)}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={chipClass}
                  >
                    {k.label}
                  </a>
                ) : (
                  <Link key={k.label} href={saleShop.link(k)} className={chipClass}>
                    {k.label}
                  </Link>
                )
              )}
            </div>
          </section>
        )}

        {/* 注目商品の比較（Amazon開催中 + 登録済みピックがある時だけ） */}
        {picks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-black mb-1">本当にお得？ 注目商品を比較</h2>
            <p className="text-[11px] text-[#8E8282] font-bold mb-4 leading-relaxed">
              Amazonのセール価格を、楽天・Yahoo!ショッピングの今の最安値と比べました。
            </p>
            {sortedCategoryEntries.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {sortedCategoryEntries.map(([cat, items]) => (
                  <a key={cat} href={`#sale-cat-${encodeURIComponent(cat)}`} className={chipClass}>
                    {cat}（{items.length}）
                  </a>
                ))}
              </div>
            )}
            <div className="space-y-6">
              {sortedCategoryEntries.map(([cat, items]) => (
                <div key={cat} id={`sale-cat-${encodeURIComponent(cat)}`}>
                  <h3 className="text-xs font-black text-[#A5A19E] uppercase tracking-widest mb-2">{cat}（{items.length}）</h3>
                  <div className="space-y-3">
                    {items.map((p) => (
                      <div key={p.id} className="bg-white rounded-[1.75rem] border border-[#F4EFEB] p-4">
                        <div className="flex gap-3 mb-3">
                          <Link href={`/product/${encodeURIComponent(p.product.id)}`} className="w-16 h-16 rounded-xl overflow-hidden bg-[#F9F6F3] flex-shrink-0">
                            <img src={getProxiedImage(p.product.image, 'card')} alt={p.product.name} className="w-full h-full object-cover" />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link href={`/product/${encodeURIComponent(p.product.id)}`} className="text-xs font-bold text-[#5A4C4C] leading-snug line-clamp-2 hover:underline">
                              {p.product.name}
                            </Link>
                            {p.verdict === 'amazon-cheaper' && (
                              <span className="inline-block mt-1.5 text-[9.5px] font-black text-white bg-[#7B8E76] px-2 py-0.5 rounded-full">本当にお得</span>
                            )}
                            {p.verdict === 'other-cheaper' && (
                              <span className="inline-block mt-1.5 text-[9.5px] font-black text-white bg-[#D98A8B] px-2 py-0.5 rounded-full">楽天/Yahooの方が安い</span>
                            )}
                            {p.verdict === 'tie' && (
                              <span className="inline-block mt-1.5 text-[9.5px] font-black text-[#8E8282] bg-[#F4EFEB] px-2 py-0.5 rounded-full">同じくらい</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <a href={p.amazonUrl} target="_blank" rel="noopener noreferrer sponsored"
                            className={`rounded-xl p-3 border ${p.verdict === 'amazon-cheaper' ? 'bg-[#F3F7F1] border-[#7B8E76]' : 'bg-[#FBF9F7] border-[#F4EFEB]'}`}>
                            <p className="text-[10px] font-black text-[#A5A19E] mb-0.5">Amazon（セール中）</p>
                            {p.amazonUnitPrice != null ? (
                              <>
                                <p className="text-sm font-black text-[#232F3E]">¥{Math.round(p.amazonUnitPrice).toLocaleString()}<span className="text-[10px] font-bold">/{p.unitLabel}</span></p>
                                <p className="text-[9.5px] text-[#A5A19E] font-bold mt-0.5">¥{p.amazonPrice.toLocaleString()}（{p.amazonQty}{p.unitLabel}）</p>
                              </>
                            ) : (
                              <p className="text-sm font-black text-[#232F3E]">¥{p.amazonPrice.toLocaleString()}</p>
                            )}
                          </a>
                          {p.otherPrice > 0 ? (
                            <Link href={`/product/${encodeURIComponent(p.product.id)}`}
                              className={`rounded-xl p-3 border ${p.verdict === 'other-cheaper' ? 'bg-[#FFF0F0] border-[#D98A8B]' : 'bg-[#FBF9F7] border-[#F4EFEB]'}`}>
                              <p className="text-[10px] font-black text-[#A5A19E] mb-0.5">楽天/Yahoo最安</p>
                              {p.otherUnitPrice != null ? (
                                <>
                                  <p className="text-sm font-black text-[#BF3F3F]">¥{Math.round(p.otherUnitPrice).toLocaleString()}<span className="text-[10px] font-bold">/{p.unitLabel}</span></p>
                                  <p className="text-[9.5px] text-[#A5A19E] font-bold mt-0.5">¥{p.otherPrice.toLocaleString()}（{p.otherQty}{p.unitLabel}）</p>
                                </>
                              ) : (
                                <p className="text-sm font-black text-[#BF3F3F]">¥{p.otherPrice.toLocaleString()}</p>
                              )}
                            </Link>
                          ) : (
                            <div className="rounded-xl p-3 border bg-[#FBF9F7] border-[#F4EFEB]">
                              <p className="text-[10px] font-black text-[#A5A19E] mb-0.5">楽天/Yahoo</p>
                              <p className="text-[11px] font-bold text-[#A5A19E]">取扱なし</p>
                            </div>
                          )}
                        </div>
                        {p.unitLabel && (
                          <p className="text-[9.5px] text-[#A5A19E] font-bold mt-2">※ パック数量が異なるため、1{p.unitLabel}あたりの単価で比較しています</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 忖度なしの買い方 */}
        <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-8">
          <h2 className="text-base font-black mb-3">セールで失敗しない3つの鉄則</h2>
          <ol className="space-y-3">
            <li className="text-xs text-[#8E8282] leading-relaxed flex gap-1.5">
              <span className="text-[#7B8E76] font-black flex-shrink-0">1.</span>
              <span>
                <strong className="text-[#5A4C4C]">「セール価格＝最安値」とは限らない。</strong>
                同じ商品が楽天・Yahoo!ショッピングの方が安いことは珍しくありません。
                買う前にHonestBabyの価格比較でひと呼吸おくのがおすすめです。
              </span>
            </li>
            <li className="text-xs text-[#8E8282] leading-relaxed flex gap-1.5">
              <span className="text-[#7B8E76] font-black flex-shrink-0">2.</span>
              <span>
                <strong className="text-[#5A4C4C]">消耗品はサイズアウトに注意。</strong>
                おむつのまとめ買いは同サイズ2〜3パックまでが安全。安さにつられて買いすぎない。
              </span>
            </li>
            <li className="text-xs text-[#8E8282] leading-relaxed flex gap-1.5">
              <span className="text-[#7B8E76] font-black flex-shrink-0">3.</span>
              <span>
                <strong className="text-[#5A4C4C]">大物はポイント還元まで含めて比較。</strong>
                ベビーカー・チャイルドシートは表示価格だけでなく、楽天SPUやPayPay還元を含めた実質価格で判断を。
              </span>
            </li>
          </ol>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/category/おむつ" className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]">
              おむつの価格を比較
            </Link>
            <Link href="/ranking/おむつ" className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]">
              人気ランキングを見る
            </Link>
            <Link href="/category/ミルク・授乳" className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]">
              ミルク・授乳グッズを比較
            </Link>
            {/* 価格推移データから作る値下がり情報へ（セールと買い時の文脈が同じ） */}
            <Link href="/price" className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#EFF4EE] border border-[#CFDDCC] text-[#5F7359] hover:bg-[#E4EDE2]">
              今週値下がりした商品を見る →
            </Link>
          </div>
        </section>

        {/* 年間買い時カレンダー */}
        <section className="mb-8">
          <h2 className="text-base font-black mb-4">年間の買い時カレンダー</h2>
          <div className="space-y-4">
            {SALE_CALENDAR.map((group) => (
              <div key={group.shop} className="bg-white rounded-[2rem] border border-[#F4EFEB] p-5">
                <h3 className="text-sm font-black mb-3">{group.shop}</h3>
                <ul className="space-y-2.5">
                  {group.events.map((ev) => (
                    <li key={ev.name} className="text-xs leading-relaxed">
                      <span className="font-black text-[#7B8E76]">{ev.name}</span>
                      <span className="text-[#A5A19E] font-bold ml-2">{ev.timing}</span>
                      <p className="text-[#8E8282] mt-0.5">{ev.tip}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[10px] text-[#A5A19E] leading-relaxed">
          ※ 本ページのリンクにはアフィリエイトリンクが含まれます。セールの開催期間・対象商品は各ショップの発表をご確認ください。
        </p>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
