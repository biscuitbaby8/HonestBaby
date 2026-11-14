import Link from 'next/link';
import { GROUPS, staplesOf } from '@/src/lib/staples';
import { fetchAllOffers, groupByStaple, bestOffer } from '@/src/lib/staplesServer';
import { fmtUnit, fmtYen, fmtQty, perLabel, fmtDateJa, MALL_LABEL, SHIPPING_LABEL } from '@/src/lib/staplesFormat';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

// サイズの無い定番（おしりふき・粉ミルク）の一覧ページ。単価の安い順に銘柄を並べる。
const SITE_URL = 'https://honestbaby-care.com';

export default async function StapleListHub({ group, title, lead, faq, links }) {
  const g = GROUPS[group];
  const per = perLabel(group);
  const pageUrl = `${SITE_URL}${g.path}`;
  const offers = await fetchAllOffers();
  const byStaple = groupByStaple(offers);
  const rows = staplesOf(group)
    .map((s) => ({ staple: s, offer: bestOffer(byStaple[s.id]), count: (byStaple[s.id] || []).length }))
    .filter((r) => r.offer)
    .sort((a, b) => a.offer.unit_price - b.offer.unit_price);
  const latest = rows.reduce((m, r) => (r.offer.fetched_at > m ? r.offer.fetched_at : m), '');

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: g.hub, item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: title,
      itemListElement: rows.map((r, i) => ({
        '@type': 'ListItem', position: i + 1, name: r.staple.name, url: `${pageUrl}/${r.staple.id}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">{g.hub}</span>
        </nav>

        <h1 className="text-xl font-black leading-snug mb-2">{title}</h1>
        <p className="text-xs text-[#8E8282] font-bold leading-relaxed mb-2">{lead}</p>
        {latest && (
          <p className="text-[10px] text-[#A5A19E] font-bold mb-6">最終更新: {fmtDateJa(latest)}　／　単位: 円/{per}（税込）</p>
        )}

        {rows.length === 0 && (
          <p className="text-xs text-[#A5A19E] font-bold py-10 text-center">価格を集計中です。しばらくしてからご覧ください。</p>
        )}

        <ol className="space-y-2 mb-10">
          {rows.map((r, i) => (
            <li key={r.staple.id}>
              <Link
                href={`${g.path}/${r.staple.id}`}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${i === 0 ? 'bg-[#F3F7F1] border-[#7B8E76]' : 'bg-white border-[#F4EFEB] hover:bg-[#FBF9F7]'}`}
              >
                <span className={`text-sm font-black w-5 text-center flex-shrink-0 ${i === 0 ? 'text-[#5F7359]' : 'text-[#A5A19E]'}`}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black leading-snug">{r.staple.name}</span>
                  <span className="block text-[10px] font-bold text-[#8E8282] mt-0.5">
                    {fmtQty(r.offer.qty, group)} {fmtYen(r.offer.price)}・{MALL_LABEL[r.offer.mall]}・{SHIPPING_LABEL[r.offer.shipping]}
                  </span>
                  <span className="block text-[10px] font-bold text-[#A5A19E]">{r.count}件の出品を比較 →</span>
                </span>
                <span className="text-right flex-shrink-0">
                  <span className="block text-lg font-black text-[#5F7359]">{fmtUnit(r.offer.unit_price, group)}</span>
                  <span className="block text-[9px] font-bold text-[#A5A19E]">/ {per}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-8">
          <h2 className="text-base font-black mb-3">この一覧の見方と注意</h2>
          <dl className="space-y-4">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="text-xs font-black text-[#5A4C4C] mb-1">{f.q}</dt>
                <dd className="text-xs text-[#8E8282] leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex flex-wrap gap-2 mb-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]">{l.label}</Link>
          ))}
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
