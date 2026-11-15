// 定番おむつページの表示用ヘルパー（サーバー/クライアント両用）
export const MALL_LABEL = { rakuten: '楽天市場', yahoo: 'Yahoo!ショッピング' };
export const MALL_SHORT = { rakuten: '楽天', yahoo: 'Yahoo!' };
export const SHIPPING_LABEL = { free: '送料無料', cond: '条件付き送料無料', paid: '送料別' };

import { GROUPS } from './staples';

// 単価の表示。おむつは1枚あたり小数1桁、おしりふきは小数2桁、
// 粉ミルクは100gあたりの整数円（保存値は1gあたりなので100倍する）。
export const fmtUnit = (v, group = 'omutsu') => {
  const g = GROUPS[group] || GROUPS.omutsu;
  return `¥${(Number(v) * g.scale).toFixed(g.decimals)}`;
};
export const perLabel = (group = 'omutsu') => (GROUPS[group] || GROUPS.omutsu).perLabel;
// 文中で使う言い方（「1枚あたり」「100gあたり」）
export const perPhrase = (group = 'omutsu') => (group === 'milk' ? '100gあたり' : '1枚あたり');
export const fmtQty = (qty, group = 'omutsu') => {
  const g = GROUPS[group] || GROUPS.omutsu;
  return `${Number(qty).toLocaleString()}${g.qtyUnit}`;
};
export const fmtYen = (v) => `¥${Number(v).toLocaleString()}`;

export const fmtDateJa = (iso) => {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
};
