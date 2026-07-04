'use client';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { CATEGORY_TREE, CATEGORY_AGE_SUGGESTIONS, getLowestPrice } from '../lib/products';
import ProductCardLink from './ProductCardLink';

// subs は string | { name, subsubs? } の混在
const getSubName = (sub) => (typeof sub === 'string' ? sub : sub.name);

// サブカテゴリは URL（/category/[name]/[sub]）で表す。クローラーが辿れる
// 実リンクになり、サブカテゴリごとに検索ランディングページを持てる。
// サブサブ（サイズ・月齢）とソートは従来通りクライアント状態。
export default function CategoryClient({ products, cat, sub = null }) {
  const subCat = sub || 'すべて';
  const [subSubCat, setSubSubCat] = useState('すべて');
  const [sortOrder, setSortOrder] = useState('standard');

  // 月齢サジェストからの遷移（?ss=M など）でサブサブ初期値を受け取る
  useEffect(() => {
    try {
      const ss = new URLSearchParams(window.location.search).get('ss');
      if (ss) setSubSubCat(ss);
    } catch { /* noop */ }
  }, []);

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
  const ageSuggestions = CATEGORY_AGE_SUGGESTIONS[cat];
  const ageSuggestionEntry = ageSuggestions && babyAgeMonths != null
    ? ageSuggestions.find((e) => babyAgeMonths < e.maxM)
    : null;

  const catEntry = CATEGORY_TREE.find((c) => c.name === cat);
  const subs = catEntry?.subs || [];
  const subNames = subs.map(getSubName);

  const currentSubEntry = subs.find((s) => getSubName(s) === subCat);
  const subsubs = currentSubEntry?.subsubs || [];

  const subHref = (name) =>
    name === 'すべて'
      ? `/category/${encodeURIComponent(cat)}`
      : `/category/${encodeURIComponent(cat)}/${encodeURIComponent(name)}`;

  // 月齢サジェストの遷移先（sub指定ありならそのページへ、subsubは ?ss= で引き継ぐ）
  const suggestionHref = ageSuggestionEntry
    ? subHref(ageSuggestionEntry.sub || subCat) +
      (ageSuggestionEntry.subsub ? `?ss=${encodeURIComponent(ageSuggestionEntry.subsub)}` : '')
    : null;

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchSub = subCat === 'すべて' || p.subCategory === subCat;
      // sub_sub_category（サイズ/月齢）は未保存の商品が多いため、未保存なら除外せず通す
      const matchSubSub = subSubCat === 'すべて' || !p.subSubCategory || p.subSubCategory === subSubCat;
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
      {/* カテゴリ別：月齢提案バナー（おむつのサイズ、ベビーカー・車用品のタイプなど） */}
      {ageSuggestionEntry && (
        <div className="flex items-center justify-between bg-[#FFF5F5] border border-[#FFEBEB] rounded-2xl px-4 py-3 mb-4">
          <p className="text-xs font-bold text-[#5A4C4C] leading-snug">
            {babyInfo.name || 'お子さま'}（{babyAgeLabel}）には<br />
            <span className="text-[#F2ABAC] font-black">{ageSuggestionEntry.label}</span>がおすすめです
          </p>
          <Link
            href={suggestionHref}
            onClick={() => setSubSubCat(ageSuggestionEntry.subsub || 'すべて')}
            className="bg-[#F2ABAC] text-white text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-transform whitespace-nowrap ml-3"
          >
            {ageSuggestionEntry.label}を見る
          </Link>
        </div>
      )}

      {/* サブカテゴリタブ（実リンク: サブカテゴリページへ） */}
      {subNames.length > 0 && (
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
            {['すべて', ...subNames].map((name) => (
              <Link
                key={name}
                href={subHref(name)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  subCat === name ? 'bg-[#5A4C4C] text-white shadow-sm' : 'bg-[#F0EBE6] text-[#7B8E76]'
                }`}
              >
                {name}
              </Link>
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
    </>
  );
}
