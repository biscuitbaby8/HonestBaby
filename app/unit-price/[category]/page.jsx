import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/src/lib/supabaseServer';
import {
  UNIT_PRICE_CATEGORIES,
  formatDbProduct,
  getLowestPrice,
  parseQuantity,
} from '@/src/lib/products';
import { buildFaqLd } from '@/src/lib/categoryGuides';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';
import UnitPriceTabs from '@/src/components/UnitPriceTabs';

const SITE_URL = 'https://honestbaby-care.com';

export function generateStaticParams() {
  return UNIT_PRICE_CATEGORIES.map((category) => ({ category }));
}

export const dynamicParams = false;
export const revalidate = 3600;

function resolveName(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function meta(cat) {
  return {
    title: `${cat}の1枚あたり単価ランキング｜内容量で割った実質価格を比較`,
    desc: `${cat}を「1枚あたりいくら」で比較。60枚入りと240枚入りのように内容量が違う商品でも、実質どちらが安いかが一目でわかります。楽天・Yahoo!の最安値から自動計算、毎日更新。`,
  };
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const cat = resolveName(category);
  const m = meta(cat);
  const url = `${SITE_URL}/unit-price/${encodeURIComponent(cat)}`;
  return {
    title: m.title,
    description: m.desc,
    alternates: { canonical: url },
    openGraph: { title: m.title, description: m.desc, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: m.title, description: m.desc },
  };
}

// サブカテゴリ単位でしか単価は比較できない（おむつ本体と防臭袋の¥/枚を
// 並べても意味がない）ため、サブカテゴリごとに分けて安い順に並べる。
//
// 同じサブカテゴリでも種類の違う商品が紛れることがある（例: パンツタイプに
// 「おむつカバー4枚セット」が入り720円/枚として並ぶ）。単価が中央値から
// 大きく外れるものは別種の商品である可能性が高いので、比較の邪魔にならないよう
// 落とす。中央値の5倍という緩い閾値にして、高級品を巻き込まないようにしている。
const OUTLIER_RATIO = 5;

function dropOutliers(list) {
  if (list.length < 3) return list;
  const sorted = [...list].sort((a, b) => a.unitPrice - b.unitPrice);
  const median = sorted[Math.floor(sorted.length / 2)].unitPrice;
  if (!(median > 0)) return list;
  return list.filter((p) => p.unitPrice <= median * OUTLIER_RATIO);
}

function groupBySubCategory(products) {
  const groups = new Map();
  for (const p of products) {
    const key = p.subCategory || 'その他';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  // 件数が多いサブカテゴリを上に。1件だけのグループは比較にならないので除外する
  return [...groups.entries()]
    .map(([sub, list]) => [sub, dropOutliers(list).sort((a, b) => a.unitPrice - b.unitPrice)])
    .filter(([, list]) => list.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);
}

export default async function UnitPricePage({ params }) {
  const { category } = await params;
  const cat = resolveName(category);
  if (!UNIT_PRICE_CATEGORIES.includes(cat)) notFound();

  let rows = [];
  try {
    const { data } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .eq('category', cat)
      .or('is_blocked.is.null,is_blocked.eq.false')
      // 重複商品（非代表）は 301 で代表ページへ飛ぶため出さない
      .is('canonical_id', null)
      .order('popularity_rank', { ascending: true })
      .limit(400);
    rows = data || [];
  } catch {
    // Supabase接続失敗時は空リストで表示
  }

  // 内容量が解析でき、かつ価格がある商品だけを単価つきで採用する。
  // どちらか欠けるものは「1枚あたり」を出せないので安全側で除外。
  const products = rows
    .map(formatDbProduct)
    .map((p) => {
      const qty = parseQuantity(p.name);
      const price = getLowestPrice(p.shops);
      if (!qty || qty.count <= 0 || price <= 0) return null;
      return { ...p, qty, price, unitPrice: price / qty.count };
    })
    .filter(Boolean);

  const groups = groupBySubCategory(products);
  const m = meta(cat);
  const url = `${SITE_URL}/unit-price/${encodeURIComponent(cat)}`;

  const faq = [
    {
      q: '1枚あたりの単価はどうやって計算していますか？',
      a: '商品名に記載された内容量（「60枚」「10枚入×24パック」など）を読み取り、楽天市場・Yahoo!ショッピングの最安値を枚数で割って算出しています。内容量が読み取れない商品は、正確に比較できないため掲載していません。',
    },
    {
      q: 'なぜ表示価格が高い商品のほうが上位にくることがあるの？',
      a: 'このページは「1枚あたりが安い順」で並べているためです。たとえば60枚で690円（1枚あたり11.5円）より、240枚で2,622円（1枚あたり10.9円）のほうが実質は割安になります。まとめ買いのほうが安くなる典型例です。',
    },
    {
      q: '単価が安ければ必ずお得？',
      a: 'いいえ。使い切れる量かどうかが前提です。おむつはサイズアウトすると使えなくなるため、同じサイズで2〜3パックまでが安全な目安です。保管場所と使用ペースも合わせて判断してください。',
    },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: m.title,
      url,
      itemListElement: products.slice(0, 30).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: `${SITE_URL}/product/${encodeURIComponent(p.id)}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: cat, item: `${SITE_URL}/category/${encodeURIComponent(cat)}` },
        { '@type': 'ListItem', position: 3, name: '1枚あたり単価', item: url },
      ],
    },
    buildFaqLd(faq),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <nav className="text-[11px] text-[#A5A19E] font-bold mb-4">
          <Link href="/" className="hover:text-[#7B8E76]">ホーム</Link>
          <span className="mx-1.5">›</span>
          <Link href={`/category/${encodeURIComponent(cat)}`} className="hover:text-[#7B8E76]">{cat}</Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#5A4C4C]">1枚あたり単価</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">{m.title}</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-4 leading-relaxed">{m.desc}</p>

        <div className="bg-[#FBF9F7] border border-[#F4EFEB] rounded-2xl px-4 py-3 mb-6">
          <p className="text-[11px] text-[#8E8282] font-bold leading-relaxed">
            表示価格が安くても、内容量が少なければ実質は割高になります。このページは商品名から内容量を読み取り、
            最安値を枚数で割った<strong className="text-[#5A4C4C]">1枚あたりの価格</strong>で並べ替えています。
            内容量が読み取れない商品は、正確に比較できないため掲載していません。
          </p>
        </div>

        {groups.length === 0 ? (
          <p className="text-xs text-[#A5A19E] font-bold py-10 text-center">単価を計算できる商品を集計中です。</p>
        ) : (
          <UnitPriceTabs groups={groups} />
        )}

        <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-8">
          <h2 className="text-base font-black mb-3">よくある質問</h2>
          <dl className="space-y-4">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="text-sm font-black mb-1">{f.q}</dt>
                <dd className="text-xs text-[#8E8282] leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/category/${encodeURIComponent(cat)}`}
              className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]"
            >
              {cat}をまとめて比較する
            </Link>
            <Link
              href={`/ranking/${encodeURIComponent(cat)}`}
              className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]"
            >
              {cat}の人気ランキング
            </Link>
            {UNIT_PRICE_CATEGORIES.filter((n) => n !== cat).map((n) => (
              <Link
                key={n}
                href={`/unit-price/${encodeURIComponent(n)}`}
                className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]"
              >
                {n}の1枚あたり単価
              </Link>
            ))}
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpaBottomNav />
    </div>
  );
}
