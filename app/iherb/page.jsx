import Link from 'next/link';
import { Droplet, Shield, Heart, Sparkles, Fish, Leaf, ExternalLink } from 'lucide-react';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { formatDbProduct } from '@/src/lib/products';
import { addIherbAffiliate } from '@/src/lib/affiliate';
import SiteHeader from '@/src/components/SiteHeader';
import IherbProductCard from '@/src/components/IherbProductCard';
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

// アイコン・色は視認性のためカードごとに変える（同系色が並ばないように）
const TOPICS = [
  {
    title: 'ベビー用ビタミンD3ドロップ',
    desc: '完全母乳の赤ちゃんは不足しがちと言われるビタミンD。「Ddrops」「California Gold Nutrition」など無味・液体タイプが定番で、1日1滴タイプなど選択肢が豊富です。',
    href: iherbSearch('baby vitamin d3 drops'),
    icon: Droplet,
    bg: '#EAF4F2',
    fg: '#4C9A87',
  },
  {
    title: '乳酸菌+ビタミンD配合ドロップ',
    desc: 'スウェーデン発「BioGaia（プロテクティス）」は乳酸菌L.ロイテリ菌とビタミンDを一度に摂れるドロップタイプ。iHerb日本の年間ランキングでもベビー部門上位の定番です。',
    href: iherbSearch('biogaia protectis baby drops'),
    icon: Shield,
    bg: '#EAF0FA',
    fg: '#4C6FA8',
  },
  {
    title: '妊娠期の葉酸・プレナタルサプリ',
    desc: '「Solgar」「Thorne」「Garden of Life」など、鉄・DHAをまとめて摂れるプレナタル。メチル葉酸（活性型）など処方の選択肢が広いのが海外ブランドの特長です。',
    href: iherbSearch('prenatal methylfolate'),
    icon: Heart,
    bg: '#FFF0F5',
    fg: '#D9789A',
  },
  {
    title: 'オーガニック ベビーローション・オイル',
    desc: '「Weleda」「Babo Botanicals」など無香料・シンプル処方の保湿ケア。乾燥しやすい季節の全身ケアや、ベビーマッサージ用のオイルが見つかります。',
    href: iherbSearch('baby lotion organic'),
    icon: Sparkles,
    bg: '#FFF7E8',
    fg: '#C99A3D',
  },
  {
    title: 'ナチュラル ベビーソープ・シャンプー',
    desc: '「Aveeno Baby」「Alaffia」など涙にしみにくい低刺激タイプ。天然由来成分にこだわった海外ブランドのボディソープ・シャンプーが揃います。',
    href: iherbSearch('baby wash shampoo natural'),
    icon: Droplet,
    bg: '#F0F6FF',
    fg: '#5A8BC4',
  },
  {
    title: '授乳期のDHA・オメガ3',
    desc: '「Nordic Naturals」はミス・ユニバース・ジャパンの公式栄養コンサルタントも愛飲するブランド。産後の栄養補給としてママ向けのDHA/EPAサプリが海外では広く選ばれています。',
    href: iherbSearch('postnatal dha omega 3'),
    icon: Fish,
    bg: '#EAF7F5',
    fg: '#3D9E8F',
  },
  {
    title: 'iHerbのベビー用品カテゴリを見る',
    desc: 'ベビー＆キッズ向けのスキンケア・サプリ・食品などをまとめたiHerbの公式カテゴリ。品揃え全体をチェックできます。',
    href: addIherbAffiliate(IHERB_BABY_CATEGORY),
    icon: Leaf,
    bg: '#F2EFFA',
    fg: '#8368B8',
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
      <main className="px-4 pt-6 pb-32 lg:max-w-6xl lg:mx-auto lg:px-10 lg:pt-8">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">iHerb特集</span>
        </nav>

        {/* ヒーロー: グラデーション背景で「特集」感を強調 */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#EAF4F2] to-[#DCEEE8] border border-[#CDE6E0] p-6 mb-6 mt-2">
          <Leaf className="absolute right-4 top-4 w-24 h-24 text-[#4C9A87] opacity-10 rotate-12" strokeWidth={1.5} />
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#4C9A87] bg-white/70 px-3 py-1 rounded-full mb-3">
            HonestBaby × iHerb
          </span>
          <h1 className="relative text-2xl font-black mb-2 leading-snug">iHerbで買える<br />海外の人気ベビー・マタニティ用品</h1>
          <p className="relative text-sm text-[#5F7369] font-bold leading-relaxed max-w-xl">
            日本では手に入りにくいビタミンD3ドロップ、活性型葉酸のプレナタル、無香料オーガニックケアを厳選。
            気になるアイテムをタップすると、そのままiHerbの商品ページへ移動できます。
          </p>
        </section>

        {/* DBにiHerb商品があれば商品カードをメインで表示（タップで直接iHerbへ） */}
        {products.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-black mb-4">人気アイテム一覧</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {products.map((p) => (
                <IherbProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* おすすめカテゴリ（iHerbへのリンク） */}
        <h2 className="text-lg font-black mb-4">おすすめカテゴリから探す</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {TOPICS.map((t) => {
            const Icon = t.icon;
            return (
              <a
                key={t.title}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-cta-position="iherb-landing"
                className="group block bg-white rounded-[1.75rem] border border-[#F4EFEB] p-5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: t.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: t.fg }} strokeWidth={2.25} />
                </div>
                <h3 className="text-sm font-black mb-1.5 text-[#5A4C4C]">{t.title}</h3>
                <p className="text-xs text-[#8E8282] font-bold leading-relaxed mb-3">{t.desc}</p>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-black text-white px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: t.fg }}
                >
                  iHerbで見る<ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                </span>
              </a>
            );
          })}
        </div>

        {/* なぜベビー・マタニティでiHerbか */}
        <section className="bg-white rounded-[1.5rem] border border-[#F4EFEB] p-5 mb-8 shadow-sm">
          <h2 className="text-sm font-black mb-3">ベビー・マタニティにiHerbが選ばれる理由</h2>
          <ul className="space-y-2 text-xs text-[#8E8282] font-bold leading-relaxed">
            <li>・海外で定番のビタミンD3ドロップや活性型葉酸など、日本で選択肢が少ない商品が見つかる</li>
            <li>・無香料・シンプル処方のオーガニックスキンケアが豊富</li>
            <li>・日本語表示・日本円決済に対応し、まとめ買いで送料効率も良い</li>
          </ul>
        </section>

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
