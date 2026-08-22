import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct } from '@/src/lib/products';
import { addIherbAffiliate } from '@/src/lib/affiliate';
import SiteHeader from '@/src/components/SiteHeader';
import ProductCardLink from '@/src/components/ProductCardLink';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

export const revalidate = 3600;

export function generateMetadata() {
  const title = 'iHerbで買えるベビー・マタニティ用品ガイド';
  const desc = 'iHerbで購入できるベビー用ビタミンD・葉酸/プレナタルサプリ・オーガニックスキンケアを、選び方の解説つきでまとめて紹介。海外の人気ナチュラルケア用品をチェック。';
  const url = `${SITE_URL}/iherb`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

// iHerb 検索/カテゴリURL。addIherbAffiliate が承認後（IHERB_CAMREF_ID設定後）に
// 自動でPartnerizeトラッキングURLへ変換する（未承認の間は通常リンク）。
const iherbSearch = (kw) => addIherbAffiliate(`https://www.iherb.com/search?kw=${encodeURIComponent(kw)}`);
const IHERB_BABY_CATEGORY = 'https://www.iherb.com/c/baby';

const TOPICS = [
  {
    title: 'ベビー用ビタミンD3ドロップ',
    desc: '完全母乳の赤ちゃんは不足しがちと言われるビタミンD。「Ddrops」「California Gold Nutrition」など無味・液体タイプが定番で、1日1滴タイプなど選択肢が豊富です。',
    href: iherbSearch('baby vitamin d3 drops'),
  },
  {
    title: '乳酸菌+ビタミンD配合ドロップ',
    desc: 'スウェーデン発「BioGaia（プロテクティス）」は乳酸菌L.ロイテリ菌とビタミンDを一度に摂れるドロップタイプ。iHerb日本の年間ランキングでもベビー部門上位の定番です。',
    href: iherbSearch('biogaia protectis baby drops'),
  },
  {
    title: '妊娠期の葉酸・プレナタルサプリ',
    desc: '「Solgar」「Thorne」「Garden of Life」など、鉄・DHAをまとめて摂れるプレナタル。メチル葉酸（活性型）など処方の選択肢が広いのが海外ブランドの特長です。',
    href: iherbSearch('prenatal methylfolate'),
  },
  {
    title: 'オーガニック ベビーローション・オイル',
    desc: '「Weleda」「Babo Botanicals」など無香料・シンプル処方の保湿ケア。乾燥しやすい季節の全身ケアや、ベビーマッサージ用のオイルが見つかります。',
    href: iherbSearch('baby lotion organic'),
  },
  {
    title: 'ナチュラル ベビーソープ・シャンプー',
    desc: '「Aveeno Baby」「Alaffia」など涙にしみにくい低刺激タイプ。天然由来成分にこだわった海外ブランドのボディソープ・シャンプーが揃います。',
    href: iherbSearch('baby wash shampoo natural'),
  },
  {
    title: '授乳期のDHA・オメガ3',
    desc: '「Nordic Naturals」はミス・ユニバース・ジャパンの公式栄養コンサルタントも愛飲するブランド。産後の栄養補給としてママ向けのDHA/EPAサプリが海外では広く選ばれています。',
    href: iherbSearch('postnatal dha omega 3'),
  },
  {
    title: 'iHerbのベビー用品カテゴリを見る',
    desc: 'ベビー＆キッズ向けのスキンケア・サプリ・食品などをまとめたiHerbの公式カテゴリ。品揃え全体をチェックできます。',
    href: addIherbAffiliate(IHERB_BABY_CATEGORY),
  },
];

export default async function IherbPage() {
  let products = [];
  try {
    const { data, error } = await supabaseServer
      .from('shops_prices')
      .select('product:products(*, shops:shops_prices(*))')
      .eq('shop_name', 'iHerb')
      .limit(300);
    if (!error && data) {
      products = data
        .map((row) => row.product)
        .filter((p) => p && (p.is_blocked === null || p.is_blocked === false))
        .map(formatDbProduct);
    }
  } catch {
    // Supabase接続失敗時は編集コンテンツのみ表示
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'iHerb特集', item: `${SITE_URL}/iherb` },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="px-4 pt-6 pb-32 lg:max-w-5xl lg:mx-auto lg:px-10 lg:pt-8">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">iHerb特集</span>
        </nav>

        <h1 className="text-2xl font-black mb-2 mt-4 leading-snug">iHerbで買えるベビー・マタニティ用品ガイド</h1>
        <p className="text-sm text-[#8E8282] font-bold mb-6 leading-relaxed">
          iHerb（アイハーブ）は、海外のナチュラル・オーガニック用品を日本語・日本円で購入できる通販サイトです。
          日本では手に入りにくいベビー用ビタミンD、妊娠・授乳期のサプリ、シンプル処方のスキンケアが揃うのが魅力。
          このページでは、HonestBabyが特にベビー・マタニティにおすすめのカテゴリを、選び方の解説つきで紹介します。
        </p>

        {/* なぜベビー・マタニティでiHerbか */}
        <section className="bg-white rounded-[1.5rem] border border-[#F4EFEB] p-5 mb-8 shadow-sm">
          <h2 className="text-sm font-black mb-3">ベビー・マタニティにiHerbが選ばれる理由</h2>
          <ul className="space-y-2 text-xs text-[#8E8282] font-bold leading-relaxed">
            <li>・海外で定番のビタミンD3ドロップや活性型葉酸など、日本で選択肢が少ない商品が見つかる</li>
            <li>・無香料・シンプル処方のオーガニックスキンケアが豊富</li>
            <li>・日本語表示・日本円決済に対応し、まとめ買いで送料効率も良い</li>
          </ul>
        </section>

        {/* おすすめカテゴリ（iHerbへのリンク） */}
        <h2 className="text-lg font-black mb-4">おすすめカテゴリ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {TOPICS.map((t) => (
            <a
              key={t.title}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              data-cta-position="iherb-landing"
              className="block bg-white rounded-[1.5rem] border border-[#F4EFEB] p-5 shadow-sm active:bg-[#FBF9F7] transition-colors"
            >
              <h3 className="text-sm font-black mb-1.5 text-[#5A4C4C]">{t.title}</h3>
              <p className="text-xs text-[#8E8282] font-bold leading-relaxed mb-3">{t.desc}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-[#7B8E76] px-3 py-1.5 rounded-full">
                iHerbで見る<ExternalLink className="w-3 h-3" strokeWidth={2.5} />
              </span>
            </a>
          ))}
        </div>

        {/* DBにiHerb商品があれば商品カードも表示 */}
        {products.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-black mb-4">iHerbで買える商品</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {products.map((p) => (
                <ProductCardLink key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* アフィリエイト開示・注意書き */}
        <section className="bg-[#FBF9F7] rounded-[1.5rem] border border-[#F4EFEB] p-5 text-[11px] text-[#A5A19E] font-bold leading-relaxed space-y-2">
          <p>
            ※ 本ページのiHerbへのリンクにはアフィリエイトリンク（Partnerize経由）が含まれます。
            リンク経由でご購入いただいた場合、当サイトが紹介料を受け取ることがあります。商品価格に影響はありません。
          </p>
          <p>
            ※ サプリメント・スキンケアは海外製品を含みます。月齢・体質・アレルギー表示をご確認のうえ、
            心配な場合はかかりつけの医師・薬剤師にご相談ください。本ページは医療上の助言を目的としたものではありません。
          </p>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SpaBottomNav />
    </div>
  );
}
