import Link from 'next/link';
import { STAPLES, GROUPS, SIZE_ORDER, sizeInfo } from '@/src/lib/staples';
import { fetchOffers, fetchAllOffers, fetchLowestEver, groupByStaple, bestOffer } from '@/src/lib/staplesServer';
import { fmtUnit, fmtYen, fmtQty, perLabel, fmtDateJa, MALL_LABEL, MALL_SHORT, SHIPPING_LABEL } from '@/src/lib/staplesFormat';
import { toVCUrl } from '@/src/lib/affiliate';
import { getProxiedImage } from '@/src/lib/products';
import { NOINDEX_ROBOTS } from '@/src/lib/seo';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

// 定番（おむつ・おしりふき・粉ミルク）の個別ページ。3カテゴリで共通。
const SITE_URL = 'https://honestbaby-care.com';

export async function buildStapleMetadata(staple) {
  if (!staple) return { title: 'HonestBaby' };
  const g = GROUPS[staple.group];
  const per = perLabel(staple.group);
  const best = bestOffer(await fetchOffers(staple.id));
  const url = `${SITE_URL}${g.path}/${staple.id}`;
  const title = best
    ? `${staple.name}の最安値 ${per}あたり${fmtUnit(best.unit_price, staple.group)}〜｜楽天・Yahoo!比較`
    : `${staple.name}の最安値｜楽天・Yahoo!比較`;
  const description = best
    ? `${staple.name}を${per}あたりの単価で比較。現在の最安は${MALL_LABEL[best.mall]}の${best.shop_name}で${fmtQty(best.qty, staple.group)}${fmtYen(best.price)}（${per}あたり${fmtUnit(best.unit_price, staple.group)}）。楽天とYahoo!の出品を毎日チェックしています。`
    : `${staple.name}を${per}あたりの単価で比較。楽天とYahoo!の出品を毎日チェックしています。`;
  return {
    title,
    description,
    // 出品が足りないページは中身が薄いので検索結果には出さない
    ...(best ? {} : { robots: NOINDEX_ROBOTS }),
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

const offerHref = (o) => (o.mall === 'yahoo' ? toVCUrl(o.url) : o.url);

export default async function StapleDetail({ staple }) {
  const id = staple.id;
  const G = staple.group;
  const g = GROUPS[G];
  const per = perLabel(G);
  const isDiaper = G === 'omutsu';

  const [offers, allOffers, lowestEver] = await Promise.all([
    fetchOffers(id),
    fetchAllOffers(),
    fetchLowestEver(id),
  ]);
  const best = bestOffer(offers);
  const byStaple = groupByStaple(allOffers);
  const bestOf = (sid) => bestOffer(byStaple[sid]);

  const mallBest = ['rakuten', 'yahoo'].map((mall) => ({
    mall,
    offer: bestOffer(offers.filter((o) => o.mall === mall)),
  }));

  // 同じ銘柄のサイズ違い（おむつのみ）
  const siblings = !isDiaper ? [] : STAPLES
    .filter((s) => s.lineKey === staple.lineKey && (s.id === staple.id || bestOf(s.id)))
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
  // 同じタイプ・同じサイズの他銘柄（単価の安い順）
  const rivals = STAPLES
    .filter((s) => s.group === G && s.type === staple.type && s.size === staple.size)
    .map((s) => ({ staple: s, offer: bestOf(s.id) }))
    .filter((r) => r.offer)
    .sort((a, b) => a.offer.unit_price - b.offer.unit_price);

  const latest = offers.reduce((m, o) => (o.fetched_at > m ? o.fetched_at : m), '');
  const url = `${SITE_URL}${g.path}/${staple.id}`;
  const image = offers.find((o) => o.image_url)?.image_url || null;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: g.hub, item: `${SITE_URL}${g.path}` },
        { '@type': 'ListItem', position: 3, name: staple.name, item: url },
      ],
    },
    ...(best
      ? [{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: staple.name,
          brand: { '@type': 'Brand', name: staple.brand },
          url,
          ...(image ? { image } : {}),
          description: `${staple.name}の楽天市場・Yahoo!ショッピングでの販売価格と${per}あたりの単価。`,
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'JPY',
            lowPrice: Math.min(...offers.map((o) => o.price)),
            highPrice: Math.max(...offers.map((o) => o.price)),
            offerCount: offers.length,
            availability: 'https://schema.org/InStock',
          },
        }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <Link href={g.path} className="hover:text-[#7B8E76]">{g.hub}</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">{staple.name}</span>
        </nav>

        <h1 className="text-xl font-black leading-snug mb-1">{staple.name}の最安値</h1>
        <p className="text-[11px] text-[#8E8282] font-bold mb-5">
          {staple.maker}{isDiaper && <>　／　{staple.typeLabel}タイプ　／　体重のめやす {staple.weight}</>}
          {latest && <>　／　更新 {fmtDateJa(latest)}</>}
        </p>

        {!best && (
          <p className="text-xs text-[#A5A19E] font-bold bg-white rounded-2xl border border-[#F4EFEB] p-6 mb-8 text-center">
            いま条件に合う出品が十分に見つかっていません。内容量が商品名から確認できた出品だけを載せています。
          </p>
        )}

        {best && (
          <section className="bg-gradient-to-br from-[#F3F7F1] to-[#EAF1E8] border border-[#7B8E76] rounded-[2rem] p-5 mb-6">
            <p className="text-[11px] font-black text-[#5F7359] mb-1">いまの最安（{SHIPPING_LABEL[best.shipping]}）</p>
            <p className="leading-none mb-2">
              <span className="text-4xl font-black text-[#5F7359]">{fmtUnit(best.unit_price, G)}</span>
              <span className="text-sm font-black text-[#5F7359] ml-1">/ {per}</span>
            </p>
            <p className="text-xs font-bold text-[#5A4C4C] mb-4">
              {fmtQty(best.qty, G)}で{fmtYen(best.price)}　{MALL_LABEL[best.mall]}・{best.shop_name}
            </p>
            <a
              href={offerHref(best)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              data-cta-position="staple-best"
              className="block text-center text-sm font-black text-white bg-[#7B8E76] px-6 py-3.5 rounded-full active:scale-95 transition-transform"
            >
              {MALL_SHORT[best.mall]}でこの価格を見る ↗
            </a>
            {lowestEver && lowestEver.records >= 14 && (
              <p className="text-[10px] font-bold text-[#8E8282] mt-3">
                記録上の最安は {fmtUnit(lowestEver.unitPrice, G)}/{per}（{lowestEver.date}・{MALL_SHORT[lowestEver.mall]}）
                {best.unit_price <= lowestEver.unitPrice * 1.02 && '　いまは底値圏です'}
              </p>
            )}
          </section>
        )}

        {best && (
          <section className="grid grid-cols-2 gap-2 mb-8">
            {mallBest.map(({ mall, offer }) => (
              <div key={mall} className="bg-white rounded-2xl border border-[#F4EFEB] p-4">
                <p className="text-[10px] font-black text-[#A5A19E] mb-1">{MALL_LABEL[mall]}の最安</p>
                {offer ? (
                  <>
                    <p className="text-lg font-black text-[#5A4C4C]">{fmtUnit(offer.unit_price, G)}<span className="text-[10px] font-bold">/{per}</span></p>
                    <p className="text-[10px] font-bold text-[#8E8282]">{fmtQty(offer.qty, G)} {fmtYen(offer.price)}</p>
                  </>
                ) : (
                  <p className="text-[11px] font-bold text-[#A5A19E]">該当する出品なし</p>
                )}
              </div>
            ))}
          </section>
        )}

        {best && (
          <section className="mb-10">
            <h2 className="text-base font-black mb-1">ショップ別・{per}あたりの安い順</h2>
            <p className="text-[11px] text-[#8E8282] font-bold mb-3">入数が違っても比べられるよう、{per}あたりの単価で並べています。</p>
            <ul className="space-y-2">
              {offers.map((o, i) => (
                <li key={`${o.mall}-${i}`}>
                  <a
                    href={offerHref(o)}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    data-cta-position="staple-list"
                    className="flex items-center gap-3 bg-white rounded-2xl border border-[#F4EFEB] px-3 py-3 active:bg-[#FBF9F7]"
                  >
                    {o.image_url && (
                      <img
                        src={getProxiedImage(o.image_url, 'card')}
                        alt={`${staple.name} ${fmtQty(o.qty, G)}（${o.shop_name}）`}
                        width={56}
                        height={56}
                        loading="lazy"
                        className="w-14 h-14 rounded-xl object-cover bg-[#F9F6F3] flex-shrink-0"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-black text-[#A5A19E]">{MALL_SHORT[o.mall]}・{o.shop_name}</span>
                      <span className="block text-xs font-bold text-[#5A4C4C]">{fmtQty(o.qty, G)}　{fmtYen(o.price)}</span>
                      <span className={`inline-block mt-0.5 text-[9.5px] font-black px-1.5 py-0.5 rounded-full ${o.shipping === 'free' ? 'bg-[#EFF4EE] text-[#5F7359]' : 'bg-[#F4EFEB] text-[#8E8282]'}`}>
                        {SHIPPING_LABEL[o.shipping]}
                      </span>
                    </span>
                    <span className="text-right flex-shrink-0">
                      <span className="block text-base font-black text-[#5F7359]">{fmtUnit(o.unit_price, G)}</span>
                      <span className="block text-[9px] font-bold text-[#A5A19E]">/ {per} ↗</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {siblings.length > 1 && (
        <section className="mb-10">
          <h2 className="text-base font-black mb-3">サイズ違いの最安</h2>
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => {
              const o = bestOf(s.id);
              const current = s.id === staple.id;
              return (
                <Link
                  key={s.id}
                  href={`${g.path}/${s.id}`}
                  aria-current={current ? 'page' : undefined}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black border ${current ? 'bg-[#7B8E76] text-white border-[#7B8E76]' : 'bg-white text-[#5A4C4C] border-[#F4EFEB] hover:bg-[#FBF9F7]'}`}
                >
                  {sizeInfo(s.size).label}
                  <span className={`block text-[10px] font-bold ${current ? 'text-white/80' : 'text-[#A5A19E]'}`}>{o ? `${fmtUnit(o.unit_price, G)}/${per}` : '—'}</span>
                </Link>
              );
            })}
          </div>
        </section>
        )}

        {rivals.length > 1 && (
          <section className="mb-10">
            <h2 className="text-base font-black mb-3">{isDiaper ? `${staple.typeLabel}・${staple.sizeLabel}サイズを銘柄で比べる` : '他の銘柄と比べる'}</h2>
            <ul className="bg-white rounded-2xl border border-[#F4EFEB] divide-y divide-[#F4EFEB]">
              {rivals.map((r, i) => (
                <li key={r.staple.id}>
                  <Link href={`${g.path}/${r.staple.id}`} className={`flex items-center justify-between px-4 py-3 text-xs ${r.staple.id === staple.id ? 'bg-[#F3F7F1]' : 'hover:bg-[#FBF9F7]'}`}>
                    <span className="font-bold">
                      <span className="text-[#A5A19E] font-black mr-2">{i + 1}</span>
                      {!isDiaper ? r.staple.name : r.staple.line === r.staple.brand ? r.staple.brand : `${r.staple.brand} ${r.staple.line}`}
                    </span>
                    <span className="font-black text-[#5F7359] whitespace-nowrap">{fmtUnit(r.offer.unit_price, G)}<span className="text-[10px] font-bold text-[#A5A19E]"> /{per}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-8">
          <h2 className="text-base font-black mb-2">単価の出し方</h2>
          <p className="text-xs text-[#8E8282] leading-relaxed">
            税込の販売価格を、商品名に書かれた合計の内容量で割っています。ポイント還元は含めていません。
            内容量が商品名からはっきり読み取れない出品、複数の種類から選ぶ形式の出品は、誤った単価を避けるため載せていません。
            そのため、ここに無いショップがさらに安い場合があります。価格と在庫は変動するので、購入前に各ショップのページでご確認ください。
          </p>
          <Link href={g.path} className="inline-block mt-4 px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]">
            ← 全銘柄の単価一覧に戻る
          </Link>
        </section>

        <p className="text-[10px] text-[#A5A19E] leading-relaxed">
          ※ 本ページのリンクにはアフィリエイトリンクが含まれます。
        </p>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
