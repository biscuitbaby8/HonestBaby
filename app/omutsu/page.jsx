import Link from 'next/link';
import { STAPLES, SIZE_ORDER, sizeInfo } from '@/src/lib/staples';
import { fetchAllOffers, groupByStaple, bestOffer } from '@/src/lib/staplesServer';
import { fmtUnit, fmtDateJa, MALL_SHORT } from '@/src/lib/staplesFormat';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';
const PAGE_URL = `${SITE_URL}/omutsu`;

export const revalidate = 3600;

const TITLE = 'おむつ1枚あたりの最安値一覧｜楽天・Yahoo!を毎日比較';
const DESC =
  'パンパース・メリーズ・ムーニー・グーン・マミーポコ・ゲンキの紙おむつを、サイズ別に1枚あたりの単価で比較。楽天市場とYahoo!ショッピングの出品を毎日チェックし、いま一番安いショップがわかります。';

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESC, url: PAGE_URL, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
};

const TYPES = [
  { key: 'tape', label: 'テープタイプ', note: '新生児〜寝返り前に。寝かせたまま替えられる' },
  { key: 'pants', label: 'パンツタイプ', note: '寝返り・ハイハイ以降に。立ったまま履かせられる' },
];

export default async function OmutsuPage() {
  const offers = await fetchAllOffers();
  const byStaple = groupByStaple(offers);
  const best = Object.fromEntries(STAPLES.map((s) => [s.id, bestOffer(byStaple[s.id])]));
  const latest = offers.reduce((m, o) => (o.fetched_at > m ? o.fetched_at : m), '');

  const tables = TYPES.map((t) => {
    const staples = STAPLES.filter((s) => s.type === t.key);
    const sizes = SIZE_ORDER.filter((sz) => staples.some((s) => s.size === sz));
    const lineKeys = [...new Set(staples.map((s) => s.lineKey))];
    // 出品が1件も無い銘柄の行は出さない
    const rows = lineKeys.filter((lk) => staples.some((s) => s.lineKey === lk && best[s.id])).map((lk) => {
      const members = staples.filter((s) => s.lineKey === lk);
      const head = members[0];
      return {
        lineKey: lk,
        label: head.line === head.brand ? head.brand : `${head.brand} ${head.line}`,
        cells: sizes.map((sz) => {
          const s = members.find((m) => m.size === sz);
          return s ? { staple: s, offer: best[s.id] } : null;
        }),
      };
    });
    // 列（サイズ）ごとの最安に印を付ける
    const colMin = sizes.map((_, i) => {
      const vals = rows.map((r) => r.cells[i]?.offer?.unit_price).filter((v) => v > 0);
      return vals.length ? Math.min(...vals) : null;
    });
    return { ...t, sizes, rows, colMin };
  });

  const pricedStaples = STAPLES.filter((s) => best[s.id]);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'おむつ1枚あたりの最安値', item: PAGE_URL },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: TITLE,
      itemListElement: pricedStaples.slice(0, 100).map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.name,
        url: `${PAGE_URL}/${s.id}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">おむつ1枚あたりの最安値</span>
        </nav>

        <h1 className="text-xl font-black leading-snug mb-2">おむつ1枚あたりの最安値一覧</h1>
        <p className="text-xs text-[#8E8282] font-bold leading-relaxed mb-2">
          同じおむつでも、ショップと入数で1枚あたりの値段は大きく変わります。
          楽天市場とYahoo!ショッピングの出品を毎日チェックし、サイズごとに1枚あたりの単価で比べました。
          数字をタップすると、いま一番安いショップと入数の一覧が見られます。
        </p>
        {latest && (
          <p className="text-[10px] text-[#A5A19E] font-bold mb-6">最終更新: {fmtDateJa(latest)}　／　単位: 円/枚（税込）</p>
        )}

        {offers.length === 0 && (
          <p className="text-xs text-[#A5A19E] font-bold py-10 text-center">価格を集計中です。しばらくしてからご覧ください。</p>
        )}

        {offers.length > 0 && tables.map((t) => (
          <section key={t.key} className="mb-10">
            <h2 className="text-base font-black mb-1">{t.label}</h2>
            <p className="text-[11px] text-[#8E8282] font-bold mb-3">{t.note}</p>
            <div className="overflow-x-auto bg-white rounded-2xl border border-[#F4EFEB]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FBF9F7]">
                    <th scope="col" className="sticky left-0 bg-[#FBF9F7] text-left font-black px-3 py-2.5 min-w-[7.5rem]">銘柄</th>
                    {t.sizes.map((sz) => (
                      <th key={sz} scope="col" className="font-black px-2 py-2.5 whitespace-nowrap text-center">
                        {sz === 'xbig' ? 'ビッグ大' : sizeInfo(sz).label}
                        <span className="block text-[9px] font-bold text-[#A5A19E]">{sizeInfo(sz).weight}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r) => (
                    <tr key={r.lineKey} className="border-t border-[#F4EFEB]">
                      <th scope="row" className="sticky left-0 bg-white text-left font-bold px-3 py-3 leading-snug">{r.label}</th>
                      {r.cells.map((c, i) => {
                        if (!c) return <td key={i} className="text-center text-[#D5CFCA] px-2">—</td>;
                        if (!c.offer) return <td key={i} className="text-center text-[#D5CFCA] px-2">—</td>;
                        const isMin = t.colMin[i] !== null && c.offer.unit_price === t.colMin[i];
                        return (
                          <td key={i} className="text-center px-1.5 py-1.5">
                            <Link
                              href={`/omutsu/${c.staple.id}`}
                              className={`block rounded-xl px-2 py-2 font-black whitespace-nowrap ${isMin ? 'bg-[#F3F7F1] text-[#5F7359] border border-[#7B8E76]' : 'text-[#5A4C4C] hover:bg-[#FBF9F7]'}`}
                            >
                              {fmtUnit(c.offer.unit_price)}
                              <span className="block text-[9px] font-bold text-[#A5A19E]">{MALL_SHORT[c.offer.mall]}</span>
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#A5A19E] font-bold mt-2">緑の枠は、そのサイズで1枚あたりが最も安い銘柄です。</p>
          </section>
        ))}

        <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-8">
          <h2 className="text-base font-black mb-3">この表の見方と注意</h2>
          <dl className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="text-xs font-black text-[#5A4C4C] mb-1">{f.q}</dt>
                <dd className="text-xs text-[#8E8282] leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/category/おむつ" className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]">おむつカテゴリを見る</Link>
          <Link href="/unit-price/おむつ" className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]">おしりふき・防臭袋の単価</Link>
          <Link href="/sale" className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]">セール・買い時カレンダー</Link>
        </div>

        <p className="text-[10px] text-[#A5A19E] leading-relaxed">
          ※ 本ページのリンクにはアフィリエイトリンクが含まれます。価格・在庫は変動します。購入前に各ショップのページでご確認ください。
        </p>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}

const FAQ = [
  {
    q: '1枚あたりの単価はどう計算していますか？',
    a: '各ショップの販売価格（税込）を、商品名に書かれた合計枚数で割っています。「62枚×4袋」のような表記は248枚として計算します。サイズや枚数が商品名からはっきり読み取れない出品は、誤った単価を出さないよう対象から外しています。',
  },
  {
    q: '送料は含まれていますか？',
    a: '送料無料の出品がある場合は、その中で最も安いものを表に載せています。送料無料の出品が見つからない銘柄・サイズだけ、送料別の出品の単価を載せています。各ページの一覧で送料の区分を確認できます。',
  },
  {
    q: 'ポイント還元は含まれていますか？',
    a: '含めていません。楽天のSPUやお買い物マラソン、Yahoo!のPayPay還元は人によって倍率が違うため、表示は税込の販売価格だけで比べています。還元率が高い日は、単価の差が数円以内ならポイントが多い方を選ぶのがおすすめです。',
  },
  {
    q: '単価が一番安い銘柄を選べばよいですか？',
    a: 'おむつは肌との相性と漏れにくさが第一です。合わない銘柄をまとめ買いすると結局割高になります。まず少量で試し、合う銘柄が決まってからこの表でいちばん安いショップを探す使い方をおすすめします。サイズアウトが早い時期は買いすぎにも注意してください。',
  },
];
