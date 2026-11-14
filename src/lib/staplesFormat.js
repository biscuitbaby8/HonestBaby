// 定番おむつページの表示用ヘルパー（サーバー/クライアント両用）
export const MALL_LABEL = { rakuten: '楽天市場', yahoo: 'Yahoo!ショッピング' };
export const MALL_SHORT = { rakuten: '楽天', yahoo: 'Yahoo!' };
export const SHIPPING_LABEL = { free: '送料無料', cond: '条件付き送料無料', paid: '送料別' };

// 単価は小数1桁まで（おむつは1枚あたり数十円で、整数だと差が見えない）
export const fmtUnit = (v) => `¥${(Math.round(Number(v) * 10) / 10).toFixed(1)}`;
export const fmtYen = (v) => `¥${Number(v).toLocaleString()}`;

export const fmtDateJa = (iso) => {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
};
