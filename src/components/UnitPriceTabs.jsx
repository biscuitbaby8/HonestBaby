'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getProxiedImage, cleanProductName } from '../lib/products';

const fmtUnit = (v) => (v >= 100 ? `¥${Math.round(v).toLocaleString()}` : `¥${v.toFixed(1)}`);

// サブカテゴリ（おしりふき・テープタイプ等）をタブで切り替える。
// 全サブカテゴリのHTMLはサーバーで出力済みのまま保持し、非表示クラスで
// 切り替えるだけにする（クローラーには従来どおり全件が読めるHTMLとして届く）。
export default function UnitPriceTabs({ groups }) {
  const [active, setActive] = useState(groups[0]?.[0] || '');

  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 mb-5 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
        {groups.map(([sub, list]) => (
          <button
            key={sub}
            onClick={() => setActive(sub)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
              active === sub ? 'bg-[#5A4C4C] text-white shadow-sm' : 'bg-[#F0EBE6] text-[#7B8E76]'
            }`}
          >
            {sub}（{list.length}）
          </button>
        ))}
      </div>

      {groups.map(([sub, list]) => (
        <section key={sub} className={active === sub ? 'mb-10' : 'hidden'}>
          <h2 className="text-base font-black mb-1">{sub}の1枚あたり単価</h2>
          <p className="text-[11px] text-[#A5A19E] font-bold mb-3">{list.length}件を安い順に表示</p>
          <ol className="space-y-3">
            {list.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/product/${encodeURIComponent(p.id)}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-[#F4EFEB] p-3 hover:shadow-sm active:scale-[0.99] transition-all"
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full text-white text-xs font-black flex items-center justify-center ${
                      i === 0 ? 'bg-[#7B8E76]' : 'bg-[#D4CDC7]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-shrink-0 w-16 h-16 bg-[#F9F6F3] rounded-xl overflow-hidden">
                    <img
                      src={getProxiedImage(p.image, 'card')}
                      alt={p.name}
                      width={600}
                      height={600}
                      loading={i < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-snug line-clamp-2">{cleanProductName(p.name, 60)}</p>
                    <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                      <span className="text-sm font-black text-[#7B8E76]">
                        {fmtUnit(p.unitPrice)} / {p.qty.unit}
                      </span>
                      <span className="text-[10px] font-bold text-[#A5A19E]">
                        {p.qty.count}{p.qty.unit} ・ ¥{p.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}
