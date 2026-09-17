import Link from 'next/link';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { getProxiedImage, cleanProductName } from '@/src/lib/products';
import { fetchPriceDrops } from '@/src/lib/deals';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

// 価格履歴は日次で更新されるため 1 時間ごとに再生成（ISR）。
export const revalidate = 3600;

const TITLE = 'ベビー用品の値下げ・底値速報';
const DESC =
  '楽天・Yahoo!ショッピングの価格推移から「今まさに値下がっている」「過去最安（底値）」のベビー用品を自動抽出。おむつ・ベビーカー・抱っこ紐などの買い時をまとめてチェック。';

export const metadata = {
  // layout の title テンプレート `%s | HonestBaby` が自動付与するため、ここではブランド名を付けない
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/deals` },
  // images未指定 → app/opengraph-image.jsx（1200×630・絶対URL）が自動適用される
  openGraph: { title: `${TITLE} | HonestBaby`, description: DESC, url: `${SITE_URL}/deals`, type: 'website' },
  twitter: { card: 'summary_large_image', title: `${TITLE} | HonestBaby`, description: DESC },
};

function DealCard({ d }) {
  const p = d.product;
  const badge = d.offPct > 0 ? `${Math.round(d.offPct)}%OFF` : d.atLow ? '底値' : 'お買い得';
  return (
    <Link
      href={`/product/${encodeURIComponent(p.id)}`}
      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full relative border border-[#F4EFEB] active:scale-95 transition-all"
    >
      <div className="relative aspect-square bg-[#F9F6F3] p-4">
        <img
          src={getProxiedImage(p.image, 'card')}
          className="w-full h-full object-cover rounded-[1.5rem]"
          alt={p.name}
          width={600}
          height={600}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-[#E8894A] text-white shadow-sm">
            {badge}
          </span>
          {d.atLow && d.offPct > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/90 text-[#E8894A] border border-[#F5D5B8]">
              過去最安
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest">{p.category}</span>
          {p.rating > 0 && (
            <span className="ml-auto bg-[#FFF9E6] px-2 py-0.5 rounded-full text-[10px] font-black text-[#D4AF37]">
              ★ {p.rating}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-[#5A4C4C] line-clamp-2 leading-snug mb-3">
          {cleanProductName(p.name, 60)}
        </h3>
        <div className="mt-auto">
          <p className="text-[9px] text-[#A5A19E] font-bold mb-0.5">{d.shop}の価格推移より</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-[#E8894A] leading-none">
              <span className="text-xs mr-0.5">¥</span>
              {d.currentPrice.toLocaleString()}
            </span>
            {d.usualPrice > d.currentPrice && (
              <span className="text-[11px] text-[#A5A19E] line-through font-bold">
                ¥{d.usualPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function DealsPage() {
  let deals = [];
  try {
    deals = await fetchPriceDrops(40);
  } catch {
    deals = [];
  }

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: TITLE,
      description: DESC,
      url: `${SITE_URL}/deals`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '値下げ速報', item: `${SITE_URL}/deals` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="px-4 pt-6 pb-32 lg:max-w-7xl lg:mx-auto lg:px-10 lg:pt-8">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">値下げ速報</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">{TITLE}</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-5 leading-relaxed">
          楽天・Yahoo!ショッピングの価格推移から、<strong>今まさに値下がっている</strong>／
          <strong>過去最安（底値）</strong>のベビー用品だけを自動でピックアップ。毎日更新。
        </p>

        {deals.length === 0 ? (
          <div className="text-center py-20 text-[#A5A19E]">
            <p className="text-sm font-bold">現在、値下げ中の商品はありません。</p>
            <p className="text-xs mt-1">セール時期に自動で更新されます。</p>
            <Link href="/" className="inline-block mt-6 text-xs font-black text-[#7B8E76] hover:underline">
              人気ランキングを見る →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4 xl:grid-cols-5">
            {deals.map((d) => (
              <DealCard key={d.product.id} d={d} />
            ))}
          </div>
        )}

        <p className="text-[10px] text-[#B7AFAA] leading-relaxed mt-4">
          ※「値下げ」「底値」は当サイトが記録している過去60日の価格推移をもとに自動判定した目安です。
          最新価格・在庫は各ショップの商品ページでご確認ください。
        </p>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
