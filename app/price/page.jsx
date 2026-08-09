import Link from 'next/link';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { getProxiedImage, cleanProductName, UNIT_PRICE_CATEGORIES } from '@/src/lib/products';
import { buildFaqLd } from '@/src/lib/categoryGuides';
import SiteHeader from '@/src/components/SiteHeader';
import SpaBottomNav from '@/src/components/SpaBottomNav';

const SITE_URL = 'https://honestbaby-care.com';

// 価格は日次cronで更新されるため1時間で再生成する
export const revalidate = 3600;

const DROP_DAYS = 14;
const LOW_DAYS = 90;
const LIMIT = 20;

const TITLE = 'ベビー用品の値下がり・底値情報｜価格推移から見る今の買い時';
const DESC =
  'HonestBabyが毎日記録している価格推移データから、直近2週間で値下がりしたベビー用品と、過去90日の最安値圏にある商品を毎日更新でお知らせします。おむつ・ベビーカー・抱っこ紐まで、今が買い時かどうかが一目でわかります。';

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/price` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/price`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
};

// DB側の集計関数（price_drops / price_lows）を呼ぶ。
// price_history は3.4万行あり、supabase-js の select では集計できないため
// SQL関数に寄せている。失敗時は空配列でページ自体は表示する。
async function fetchMovers() {
  const [drops, lows] = await Promise.all([
    supabaseServer.rpc('price_drops', { window_days: DROP_DAYS, lim: LIMIT }),
    supabaseServer.rpc('price_lows', { window_days: LOW_DAYS, lim: LIMIT }),
  ]);
  return { drops: drops?.data || [], lows: lows?.data || [] };
}

function ProductRow({ item, rank, badge, sub }) {
  return (
    <li>
      <Link
        href={`/product/${encodeURIComponent(item.product_id)}`}
        className="flex items-center gap-3 bg-white rounded-2xl border border-[#F4EFEB] p-3 hover:shadow-sm active:scale-[0.99] transition-all"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4CDC7] text-white text-xs font-black flex items-center justify-center">
          {rank}
        </span>
        <div className="flex-shrink-0 w-16 h-16 bg-[#F9F6F3] rounded-xl overflow-hidden">
          <img
            src={getProxiedImage(item.image_url, 'card')}
            alt={item.name}
            width={600}
            height={600}
            loading={rank <= 3 ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-[#A5A19E] mb-0.5">{item.category}</p>
          <p className="text-xs font-bold leading-snug line-clamp-2">{cleanProductName(item.name, 60)}</p>
          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <span className="text-sm font-black text-[#C4635F]">{badge}</span>
            <span className="text-[10px] font-bold text-[#A5A19E]">{sub}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default async function PricePage() {
  const { drops, lows } = await fetchMovers();

  const faq = [
    {
      q: '値下がり情報はどうやって集めていますか？',
      a: 'HonestBabyが毎日、楽天市場・Yahoo!ショッピング・Amazonの価格を記録しています。その履歴を突き合わせて、同じショップで実際に価格が下がった商品だけを抽出しています。ショップが入れ替わっただけのものは値下がりとして扱いません。',
    },
    {
      q: '「最安値圏」とはどういう意味ですか？',
      a: `過去${LOW_DAYS}日間で記録した最安値と、現在の価格がほぼ同じ（2%以内）であることを指します。つまり、この期間で見ればこれ以上ほとんど下がっていない水準ということです。今後さらに下がる保証ではありません。`,
    },
    {
      q: '掲載されていない商品もありますか？',
      a: 'あります。価格履歴が7日分に満たない商品や、価格の変動幅が極端で商品の取り違えが疑われるデータは、正確に判断できないため掲載していません。数を増やすより、数字が信用できることを優先しています。',
    },
    {
      q: '安くなっていれば買ったほうがいい？',
      a: '必ずしもそうではありません。おむつなどの消耗品はサイズアウトすると使えなくなりますし、大型のベビー用品は置き場所の問題もあります。価格は判断材料の一つとして使ってください。',
    },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: TITLE,
      description: DESC,
      url: `${SITE_URL}/price`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '値下がり・底値情報', item: `${SITE_URL}/price` },
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
          <span className="text-[#5A4C4C]">値下がり・底値情報</span>
        </nav>

        <h1 className="text-xl font-black mb-1 mt-4">ベビー用品の値下がり・底値情報</h1>
        <p className="text-xs text-[#8E8282] font-bold mb-4 leading-relaxed">{DESC}</p>

        <div className="bg-[#FBF9F7] border border-[#F4EFEB] rounded-2xl px-4 py-3 mb-8">
          <p className="text-[11px] text-[#8E8282] font-bold leading-relaxed">
            楽天市場もAmazonも「この商品が今、高いのか安いのか」は教えてくれません。
            HonestBabyは毎日すべての掲載商品の価格を記録しているので、
            <strong className="text-[#5A4C4C]">過去と比べて今どうなのか</strong>を出せます。
            このページは毎日自動更新されます。
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-base font-black mb-1">直近{DROP_DAYS}日で値下がりした商品</h2>
          <p className="text-[11px] text-[#A5A19E] font-bold mb-3">
            同じショップで実際に価格が下がったものだけを、下落率の大きい順に表示しています
          </p>
          {drops.length === 0 ? (
            <p className="text-xs text-[#A5A19E] font-bold py-8 text-center">
              現在、条件を満たす値下がりはありません。
            </p>
          ) : (
            <ol className="space-y-3">
              {drops.map((d, i) => (
                <ProductRow
                  key={d.product_id}
                  item={d}
                  rank={i + 1}
                  badge={`${d.drop_pct}% 値下がり`}
                  sub={`¥${d.old_price.toLocaleString()} → ¥${d.new_price.toLocaleString()}（${d.shop_name}）`}
                />
              ))}
            </ol>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-base font-black mb-1">過去{LOW_DAYS}日の最安値圏にある商品</h2>
          <p className="text-[11px] text-[#A5A19E] font-bold mb-3">
            この期間の最安値とほぼ同じ価格で買える商品です。高値からの下げ幅が大きい順
          </p>
          {lows.length === 0 ? (
            <p className="text-xs text-[#A5A19E] font-bold py-8 text-center">
              現在、条件を満たす商品はありません。
            </p>
          ) : (
            <ol className="space-y-3">
              {lows.map((l, i) => (
                <ProductRow
                  key={l.product_id}
                  item={l}
                  rank={i + 1}
                  badge={`高値から ${Math.round(((l.high_price - l.cur_price) * 100) / l.high_price)}% 安い`}
                  sub={`現在 ¥${l.cur_price.toLocaleString()}（期間の最高 ¥${l.high_price.toLocaleString()}・${l.days_tracked}日分の記録）`}
                />
              ))}
            </ol>
          )}
        </section>

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
          <h2 className="text-base font-black mb-3">あわせて使う</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sale"
              className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]"
            >
              セール・買い時カレンダー
            </Link>
            {UNIT_PRICE_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/unit-price/${encodeURIComponent(c)}`}
                className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]"
              >
                {c}の1枚あたり単価
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
