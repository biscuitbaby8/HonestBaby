'use client';
import { useState, useEffect, useMemo } from 'react';
import { CATEGORY_TREE, DIAPER_SIZE_BY_AGE, getLowestPrice } from '../lib/products';
import { CATEGORY_GUIDES } from '../lib/categoryGuides';
import ProductCardLink from './ProductCardLink';

// subs は string | { name, subsubs? } の混在
const getSubName = (sub) => (typeof sub === 'string' ? sub : sub.name);

export default function CategoryClient({ products, cat }) {
  const [subCat, setSubCat] = useState('すべて');
  const [subSubCat, setSubSubCat] = useState('すべて');
  const [sortOrder, setSortOrder] = useState('standard');

  // サーバーレンダリング対象のためlocalStorageは初期値に使えず、useEffectで読み込む
  const [babyInfo, setBabyInfo] = useState(null);
  useEffect(() => {
    try { setBabyInfo(JSON.parse(localStorage.getItem('honestBabyBabyInfo') || 'null')); } catch { setBabyInfo(null); }
  }, []);
  const babyAgeMonths = useMemo(() => {
    if (!babyInfo) return null;
    const now = new Date();
    return (now.getFullYear() - babyInfo.birthYear) * 12 + (now.getMonth() + 1 - babyInfo.birthMonth);
  }, [babyInfo]);
  const babyAgeLabel = babyAgeMonths != null
    ? babyAgeMonths < 12
      ? `${babyAgeMonths}ヶ月`
      : `${Math.floor(babyAgeMonths / 12)}歳${babyAgeMonths % 12 ? `${babyAgeMonths % 12}ヶ月` : ''}`
    : null;
  const diaperSizeEntry = cat === 'おむつ' && babyAgeMonths != null
    ? DIAPER_SIZE_BY_AGE.find((e) => babyAgeMonths < e.maxM)
    : null;

  const catEntry = CATEGORY_TREE.find((c) => c.name === cat);
  const subs = catEntry?.subs || [];
  const subNames = subs.map(getSubName);

  const currentSubEntry = subs.find((s) => getSubName(s) === subCat);
  const subsubs = currentSubEntry?.subsubs || [];

  const guide = CATEGORY_GUIDES[cat];

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchSub = subCat === 'すべて' || p.subCategory === subCat;
      const matchSubSub = subSubCat === 'すべて' || p.subSubCategory === subSubCat;
      return matchSub && matchSubSub;
    });
    if (sortOrder === 'popular')
      return [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortOrder === 'price_asc')
      return [...result].sort((a, b) => getLowestPrice(a.shops) - getLowestPrice(b.shops));
    if (sortOrder === 'price_desc')
      return [...result].sort((a, b) => getLowestPrice(b.shops) - getLowestPrice(a.shops));
    return result; // standard = サーバー順（popularity_rank）
  }, [products, subCat, subSubCat, sortOrder]);

  return (
    <>
      {/* おむつカテゴリ：月齢別サイズ提案バナー */}
      {diaperSizeEntry && (
        <div className="flex items-center justify-between bg-[#FFF5F5] border border-[#FFEBEB] rounded-2xl px-4 py-3 mb-4">
          <p className="text-xs font-bold text-[#5A4C4C] leading-snug">
            {babyInfo.name || 'お子さま'}（{babyAgeLabel}）は<br />
            <span className="text-[#F2ABAC] font-black">{diaperSizeEntry.label}頃</span>が目安です
          </p>
          <button
            onClick={() => {
              if (diaperSizeEntry.sub) setSubCat(diaperSizeEntry.sub);
              setSubSubCat(diaperSizeEntry.size);
            }}
            className="bg-[#F2ABAC] text-white text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-transform whitespace-nowrap ml-3"
          >
            {diaperSizeEntry.label}を見る
          </button>
        </div>
      )}

      {/* サブカテゴリタブ */}
      {subNames.length > 0 && (
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
            {['すべて', ...subNames].map((sub) => (
              <button
                key={sub}
                onClick={() => { setSubCat(sub); setSubSubCat('すべて'); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  subCat === sub ? 'bg-[#5A4C4C] text-white shadow-sm' : 'bg-[#F0EBE6] text-[#7B8E76]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* サブサブカテゴリタブ */}
      {subsubs.length > 0 && (
        <div className="mb-5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
            {['すべて', ...subsubs].map((subsub) => (
              <button
                key={subsub}
                onClick={() => setSubSubCat(subsub)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  subSubCat === subsub ? 'bg-[#7B8E76] text-white shadow-sm' : 'bg-[#EBF0EA] text-[#5A4C4C]'
                }`}
              >
                {subsub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ソートボタン */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 mb-4 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
        {[
          { key: 'standard', label: '標準' },
          { key: 'popular', label: '評価順' },
          { key: 'price_asc', label: '価格↑' },
          { key: 'price_desc', label: '価格↓' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSortOrder(s.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              sortOrder === s.key ? 'bg-[#5A4C4C] text-white shadow-sm' : 'bg-[#F0EBE6] text-[#7B8E76]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 商品グリッド */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#A5A19E]">
          <p className="text-sm font-bold">条件に合う商品が見つかりません。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((p) => (
            <ProductCardLink key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* 選び方ガイド本文（薄いコンテンツ対策・SEO用） */}
      {guide && (
        <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-10">
          <h2 className="text-base font-black text-[#5A4C4C] mb-3">{guide.heading}</h2>
          <p className="text-xs text-[#8E8282] font-bold leading-relaxed mb-5">{guide.intro}</p>

          {guide.types?.length > 0 && (
            <div className="space-y-3 mb-6">
              {guide.types.map((t) => (
                <div key={t.name}>
                  <p className="text-xs font-black text-[#7B8E76] mb-1">{t.name}</p>
                  <p className="text-xs text-[#8E8282] leading-relaxed">{t.body}</p>
                </div>
              ))}
            </div>
          )}

          {guide.checklist?.length > 0 && (
            <div>
              <p className="text-xs font-black text-[#5A4C4C] mb-2">忖度なしチェックポイント</p>
              <ul className="space-y-1.5">
                {guide.checklist.map((item, i) => (
                  <li key={i} className="text-xs text-[#8E8282] leading-relaxed flex gap-1.5">
                    <span className="text-[#7B8E76] font-black">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  );
}
