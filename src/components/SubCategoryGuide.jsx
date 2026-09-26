import Link from 'next/link';
import { findTypeGuide, CATEGORY_GUIDES } from '../lib/categoryGuides';
import { getLowestPrice } from '../lib/products';

// サブカテゴリページ下部のSEO本文（サーバーコンポーネント）。
// 親カテゴリの選び方ガイドは商品0件時やJS無効クローラーにも届く必要があるが、
// サブカテゴリ側はガイドを持たないカテゴリも多いため、
// (1) 親ガイドの該当タイプ解説があれば流用し、(2) 実データ（件数・価格帯・人気ブランド）で
// 必ずページ固有の本文を確保する。どちらも無ければ何も表示しない。
export default function SubCategoryGuide({ cat, sub, products }) {
  const typeGuide = findTypeGuide(cat, sub);
  const checklist = (CATEGORY_GUIDES[cat]?.checklist || []).slice(0, 3);

  const prices = products
    .map((p) => getLowestPrice(p.shops))
    .filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const brandCounts = new Map();
  for (const p of products) {
    if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
  }
  const topBrands = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([b]) => b);

  if (!typeGuide && !checklist.length && !products.length) return null;

  return (
    <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-10">
      <h2 className="text-base font-black text-[#5A4C4C] mb-3">
        {cat}「{sub}」の選び方
      </h2>

      {typeGuide && (
        <p className="text-xs text-[#8E8282] leading-relaxed mb-4">{typeGuide.body}</p>
      )}

      {products.length > 0 && (
        <p className="text-xs text-[#8E8282] leading-relaxed mb-4">
          現在掲載中の{sub}は<span className="font-black text-[#5A4C4C]">{products.length}点</span>
          {minPrice > 0 && (
            <>
              。価格帯は<span className="font-black text-[#7B8E76]">¥{minPrice.toLocaleString()}〜¥{maxPrice.toLocaleString()}</span>
            </>
          )}
          {topBrands.length > 0 && (
            <>
              。よく選ばれているブランドは
              {topBrands.map((b, i) => (
                <span key={b}>
                  {i > 0 && '、'}
                  <Link href={`/brand/${encodeURIComponent(b)}`} className="text-[#7B8E76] font-black underline decoration-dotted underline-offset-2">
                    {b}
                  </Link>
                </span>
              ))}
              など。
            </>
          )}
        </p>
      )}

      {checklist.length > 0 && (
        <div>
          <p className="text-xs font-black text-[#5A4C4C] mb-2">選ぶときのポイント</p>
          <ul className="space-y-1.5">
            {checklist.map((item, i) => (
              <li key={i} className="text-xs text-[#8E8282] leading-relaxed flex gap-1.5">
                <span className="text-[#7B8E76] font-black">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
