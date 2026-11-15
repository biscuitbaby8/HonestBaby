import Link from 'next/link';
import { Leaf, ExternalLink } from 'lucide-react';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { addIherbAffiliate, toVCUrl } from '@/src/lib/affiliate';
import { IHERB_PICKS, IHERB_SECTIONS, iherbStapleId } from '@/src/lib/iherbPicks';
import { fmtDateJa } from '@/src/lib/staplesFormat';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';
const PAGE_URL = `${SITE_URL}/iherb`;

export const revalidate = 3600;

const TITLE = 'iHerbで買えるベビー・マタニティ用品の定番｜楽天・Yahoo!との価格比較つき';
const DESC =
  'iHerbで人気のベビー用ビタミンDドロップ、葉酸サプリ、ヴェレダやバイオイルなどのボディケアを厳選。同じ商品を楽天・Yahoo!ショッピングで買った場合の価格も毎日チェックして並べています。';

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESC, url: PAGE_URL, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
};

// iHerb公式サイトの検索結果（Partnerize経由のアフィリエイトリンク）
const iherbSearch = (kw) => addIherbAffiliate(`https://www.iherb.com/search?kw=${encodeURIComponent(kw)}`);

// 楽天の「iHerb 公式」店舗。楽天APIの shopName がこの名前になる
const IHERB_RAKUTEN_SHOP = 'iHerb';

// Yahoo!はValueCommerce経由のリンクにする（他の比較ページと同じ扱い）
const offerHref = (o) => (o.mall === 'yahoo' ? toVCUrl(o.url) : o.url);

const UNIT_LABEL = { ml: 'ml', g: 'g', '粒': '粒' };
const fmtYen = (v) => `¥${Math.round(Number(v)).toLocaleString()}`;
const fmtQty = (q, unit) => `${Number(q).toLocaleString()}${UNIT_LABEL[unit] || ''}`;
const fmtPer = (v) => (v >= 100 ? fmtYen(v) : `¥${Number(v).toFixed(1)}`);

async function fetchOffers() {
  try {
    const { data } = await supabaseServer
      .from('staple_offers')
      .select('staple_id, mall, shop_name, item_name, url, price, qty, unit_price, shipping, fetched_at')
      .like('staple_id', 'iherb-%')
      .order('unit_price', { ascending: true })
      .limit(1000);
    return (data || []).map((o) => ({ ...o, price: Number(o.price), qty: Number(o.qty), unit_price: Number(o.unit_price) }));
  } catch {
    return [];
  }
}

const FAQ = [
  {
    q: 'iHerbと楽天、どちらで買うのが安いですか？',
    a: '商品によって違います。iHerbは楽天市場にも公式店を出しており、このページではその価格と、国内の他のショップの最安値を並べています。国内ショップの出品には並行輸入品が多く、内容量が違うこともあるため、1mlあたり・1粒あたりの値段もあわせて確認してください。',
  },
  {
    q: 'iHerbで買うときの送料や関税は？',
    a: '送料は注文金額によって変わり、一定額以上で無料になる仕組みです。条件は時期によって変わるので、注文前にiHerbの画面で確認してください。サプリメントなどの個人輸入には、1回に輸入できる量の目安があります。',
  },
  {
    q: '赤ちゃんにサプリを使ってもいいですか？',
    a: '月齢や体調によって合う・合わないがあります。使い始める前に、かかりつけの小児科で相談してください。妊娠中・授乳中のサプリも、産婦人科で相談のうえで選ぶのが安心です。',
  },
];

export default async function IherbPage() {
  const offers = await fetchOffers();
  const byStaple = offers.reduce((acc, o) => { (acc[o.staple_id] ||= []).push(o); return acc; }, {});
  const latest = offers.reduce((m, o) => (o.fetched_at > m ? o.fetched_at : m), '');

  const cards = IHERB_PICKS.map((p) => {
    const list = p.compare ? (byStaple[iherbStapleId(p.id)] || []) : [];
    const iherbStore = list.filter((o) => o.shop_name === IHERB_RAKUTEN_SHOP).sort((a, b) => a.price - b.price)[0] || null;
    const others = list.filter((o) => o.shop_name !== IHERB_RAKUTEN_SHOP).sort((a, b) => a.unit_price - b.unit_price);
    return { ...p, iherbStore, domestic: others[0] || null, domesticCount: others.length };
  });

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'iHerb特集', item: PAGE_URL },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">iHerb特集</span>
        </nav>

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#EAF4F2] to-[#DCEEE8] border border-[#CDE6E0] p-6 mb-6">
          <Leaf className="absolute right-4 top-4 w-24 h-24 text-[#4C9A87] opacity-10 rotate-12" strokeWidth={1.5} />
          <span className="inline-block text-[10px] font-black tracking-widest text-[#4C9A87] bg-white/70 px-3 py-1 rounded-full mb-3">
            HonestBaby × iHerb
          </span>
          <h1 className="relative text-xl font-black mb-2 leading-snug">iHerbで買えるベビー・マタニティ用品の定番</h1>
          <p className="relative text-xs text-[#5F7369] font-bold leading-relaxed">
            海外で定番のビタミンDドロップや葉酸サプリ、ボディケア用品を厳選しました。
            同じ商品が楽天・Yahoo!ショッピングでも買えるものは、その価格も毎日チェックして並べています。
          </p>
          {latest && (
            <p className="relative text-[10px] text-[#5F7369]/80 font-bold mt-3">価格の最終更新: {fmtDateJa(latest)}</p>
          )}
        </section>

        <nav aria-label="カテゴリ" className="flex flex-wrap gap-2 mb-8">
          {IHERB_SECTIONS.map((s) => (
            <a key={s.key} href={`#${s.key}`} className="inline-block px-3.5 py-2 rounded-full text-[11px] font-bold bg-white border border-[#CDE6E0] text-[#3F7F70]">
              {s.title}
            </a>
          ))}
        </nav>

        {IHERB_SECTIONS.map((sec) => (
          <section key={sec.key} id={sec.key} className="mb-10 scroll-mt-20">
            <h2 className="text-base font-black mb-3">{sec.title}</h2>
            <div className="space-y-3">
              {cards.filter((c) => c.section === sec.key).map((c) => (
                <article key={c.id} className="bg-white rounded-[1.75rem] border border-[#F4EFEB] p-5">
                  <p className="text-[10px] font-black text-[#4C9A87] mb-0.5">{c.brand}</p>
                  <h3 className="text-sm font-black leading-snug mb-1">{c.name}</h3>
                  <p className="text-[10px] font-bold text-[#A5A19E] mb-3">{c.spec}</p>
                  <p className="text-xs text-[#6F6464] leading-relaxed mb-2">{c.point}</p>
                  <p className="text-[11px] font-bold text-[#8E8282] mb-4">
                    <span className="text-[#4C9A87]">こんな人に：</span>{c.who}
                  </p>

                  {(c.iherbStore || c.domestic) && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {c.iherbStore ? (
                        <a href={offerHref(c.iherbStore)} target="_blank" rel="noopener noreferrer sponsored" data-cta-position="iherb-rakuten-store"
                          className="rounded-xl p-3 border bg-[#F1F8F6] border-[#CDE6E0]">
                          <p className="text-[10px] font-black text-[#4C9A87] mb-0.5">iHerb 楽天公式店</p>
                          <p className="text-sm font-black text-[#3F7F70]">{fmtYen(c.iherbStore.price)}</p>
                          <p className="text-[9.5px] font-bold text-[#8E8282]">{fmtQty(c.iherbStore.qty, c.unit)}・{UNIT_LABEL[c.unit]}あたり{fmtPer(c.iherbStore.unit_price)}</p>
                        </a>
                      ) : (
                        <div className="rounded-xl p-3 border bg-[#FBF9F7] border-[#F4EFEB]">
                          <p className="text-[10px] font-black text-[#A5A19E] mb-0.5">iHerb 楽天公式店</p>
                          <p className="text-[11px] font-bold text-[#A5A19E]">出品なし</p>
                        </div>
                      )}
                      {c.domestic ? (
                        <a href={offerHref(c.domestic)} target="_blank" rel="noopener noreferrer sponsored" data-cta-position="iherb-domestic"
                          className="rounded-xl p-3 border bg-[#FBF9F7] border-[#F4EFEB]">
                          <p className="text-[10px] font-black text-[#A5A19E] mb-0.5">国内ショップの最安</p>
                          <p className="text-sm font-black text-[#5A4C4C]">{fmtYen(c.domestic.price)}</p>
                          <p className="text-[9.5px] font-bold text-[#8E8282]">{fmtQty(c.domestic.qty, c.unit)}・{UNIT_LABEL[c.unit]}あたり{fmtPer(c.domestic.unit_price)}</p>
                        </a>
                      ) : (
                        <div className="rounded-xl p-3 border bg-[#FBF9F7] border-[#F4EFEB]">
                          <p className="text-[10px] font-black text-[#A5A19E] mb-0.5">国内ショップ</p>
                          <p className="text-[11px] font-bold text-[#A5A19E]">取り扱いなし</p>
                        </div>
                      )}
                    </div>
                  )}

                  <a href={iherbSearch(c.iherbKw)} target="_blank" rel="noopener noreferrer sponsored" data-cta-position="iherb-site"
                    className="flex items-center justify-center gap-1 text-xs font-black text-white bg-[#4C9A87] px-4 py-2.5 rounded-full active:scale-95 transition-transform">
                    iHerb公式サイトで見る<ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-8">
          <h2 className="text-base font-black mb-3">よくある質問</h2>
          <dl className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="text-xs font-black text-[#5A4C4C] mb-1">{f.q}</dt>
                <dd className="text-xs text-[#8E8282] leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-[#FBF9F7] rounded-[1.5rem] border border-[#F4EFEB] p-5 text-[11px] text-[#A5A19E] font-bold leading-relaxed space-y-2">
          <p>
            ※ 本ページのリンクにはアフィリエイトリンク（iHerb・楽天市場・Yahoo!ショッピング）が含まれます。
            リンク経由でご購入いただいた場合、当サイトが紹介料を受け取ることがあります。商品価格に影響はありません。
          </p>
          <p>
            ※ 国内ショップの価格は、商品名から内容量が確認できた出品だけを比べています。並行輸入品を含み、価格・在庫は変動します。
            iHerb公式サイトの価格は、リンク先でご確認ください。
          </p>
          <p>
            ※ サプリメント・スキンケアは海外製品を含みます。月齢・体質・アレルギー表示をご確認のうえ、
            使用前にかかりつけの医師・薬剤師にご相談ください。本ページは医療上の助言を目的としたものではありません。
          </p>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
