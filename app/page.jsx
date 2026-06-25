import Link from 'next/link';
import HomeClient from './HomeClient';
import { supabaseServer } from '@/src/lib/supabaseServer';
import {
  CATEGORY_TREE,
  CAT_META,
  formatDbProduct,
  getLowestPrice,
  getProxiedImage,
} from '@/src/lib/products';

const SITE_URL = 'https://honestbaby-care.com';

// トップページもISRでサーバー描画（1時間ごとに再生成）。
// クローラーには下記のSSRコンテンツが届き、ユーザーには起動後アプリが表示される。
export const revalidate = 3600;

export const metadata = {
  alternates: { canonical: '/' },
};

const CATEGORY_NAMES = CATEGORY_TREE.map((c) => c.name).filter((n) => n !== 'すべて');

async function fetchTopProducts() {
  try {
    const { data } = await supabaseServer
      .from('products')
      .select('*, shops:shops_prices(*)')
      .or('is_blocked.is.null,is_blocked.eq.false')
      .order('popularity_rank', { ascending: true })
      .limit(24);
    return (data || []).map(formatDbProduct);
  } catch {
    return [];
  }
}

export default async function Page() {
  const products = await fetchTopProducts();

  return (
    <HomeClient>
      {/* SSR(サーバー描画)コンテンツ: クローラー向けの読めるHTML。
          アプリ(SPA)起動後はクライアント側で非表示にし、従来通りの表示に切り替わる。 */}
      <div className="min-h-screen bg-[#FFFDFB] text-[#5A4C4C]">
        <main className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-black leading-snug mb-3">
            本当に良いベビー用品が見つかる、忖度なし比較サイト | HonestBaby
          </h1>
          <p className="text-sm text-[#8E8282] font-bold leading-relaxed mb-6">
            パパ・ママのリアルな口コミと、楽天・Yahoo!ショッピングの最安値比較で、
            おむつ・ベビーカー・抱っこ紐・チャイルドシートなど人気のベビー用品を
            ブランド横断で比較できます。エルゴ・コンビ・アップリカ・ピジョンなど主要ブランドを網羅。
          </p>

          {/* カテゴリ一覧（内部リンク） */}
          <nav aria-label="カテゴリ" className="mb-8">
            <h2 className="text-lg font-black mb-3">カテゴリから探す</h2>
            <ul className="flex flex-wrap gap-2">
              {CATEGORY_NAMES.map((name) => (
                <li key={name}>
                  <Link
                    href={`/category/${encodeURIComponent(name)}`}
                    className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-[#F4EFEB] text-[#5A4C4C] hover:bg-[#E8E1DC]"
                  >
                    {CAT_META[name]?.title?.split(/[比較|]/)[0]?.trim() || name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 人気商品（内部リンク + 構造化テキスト） */}
          {products.length > 0 && (
            <section>
              <h2 className="text-lg font-black mb-4">人気のベビー用品ランキング</h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => {
                  const price = getLowestPrice(p.shops);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/product/${encodeURIComponent(p.id)}`}
                        className="block bg-white rounded-2xl border border-[#F4EFEB] overflow-hidden hover:shadow-sm"
                      >
                        <div className="aspect-square bg-[#F9F6F3] p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getProxiedImage(p.image, 'card')}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-3">
                          {p.category && (
                            <span className="text-[10px] text-[#A5A19E] font-bold">{p.category}</span>
                          )}
                          <h3 className="text-xs font-bold leading-snug line-clamp-2 mb-1">{p.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-[#7B8E76]">
                              {price > 0 ? `¥${price.toLocaleString()}〜` : '価格をチェック'}
                            </span>
                            {p.rating > 0 && (
                              <span className="text-[10px] font-black text-[#D4AF37]">★ {p.rating}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </main>
      </div>
    </HomeClient>
  );
}
