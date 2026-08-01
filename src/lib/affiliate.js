// ValueCommerce 直リンク変換。対応ドメイン（Yahoo!ショッピング・提携公式EC）の
// URLを ck.jp.ap.valuecommerce.com 経由の成果計測URLに変換する。
// SPA（App.jsx）とSSR商品ページの両方で使う（NEXT_PUBLIC_はビルド時に両方へ展開される）。
const VC_SID = process.env.NEXT_PUBLIC_VC_SID || '3768537';
const VC_DOMAIN_PIDS = {
  'dadway-onlineshop.com': process.env.NEXT_PUBLIC_VC_PID_DADWAY || '892608374',
  'ergobaby.jp': process.env.NEXT_PUBLIC_VC_PID_ERGOBABY || '892609670',
  'shopping.yahoo.co.jp': process.env.NEXT_PUBLIC_VC_PID_YAHOO || '892613329',
};

export const toVCUrl = (url) => {
  if (!url || url === '#') return url;
  try {
    const normalized = url.startsWith('//') ? 'https:' + url : url;
    const hostname = new URL(normalized).hostname;
    const pid = Object.entries(VC_DOMAIN_PIDS).find(([domain]) => hostname.includes(domain))?.[1];
    if (!pid) return url;
    return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${VC_SID}&pid=${pid}&vc_url=${encodeURIComponent(normalized)}`;
  } catch {
    return url;
  }
};

// Amazonアソシエイトの検索結果リンク（PA-API導入までの暫定形）。
// SPAの商品モーダルとSSR商品ページで共用する。
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || 'honestbaby-22';
export const getAmazonUrl = (keyword) =>
  `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${AMAZON_TAG}`;

// Amazonのセール会場（タイムセール一覧）へのタグ付きリンク
export const getAmazonDealsUrl = () => `https://www.amazon.co.jp/deals?tag=${AMAZON_TAG}`;

// Yahoo!ショッピングの検索／トップ。ValueCommerce に shopping.yahoo.co.jp の
// PID があるため toVCUrl を通すと成果計測される。
export const getYahooSearchUrl = (keyword) =>
  toVCUrl(`https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(keyword)}`);
export const getYahooTopUrl = () => toVCUrl('https://shopping.yahoo.co.jp/');

// 楽天の検索ページへ直接リンクするヘルパーは意図的に持たない。
// 楽天は商品ごとのアフィリエイトURLをAPIから受け取る方式で、検索ページ用の
// アフィリエイト経路が無いため、外部へ直リンクすると成果が付かないまま
// 送客することになる。楽天へは商品ページ経由（APIのアフィリエイトURL）で流す。

// Amazon商品URLにアソシエイトタグが無ければ付与する
// （Creators APIのdetailPageUrlにタグが含まれない場合の保険）
export const withAmazonTag = (url) => {
  try {
    const u = new URL(url);
    if (!u.searchParams.get('tag')) u.searchParams.set('tag', AMAZON_TAG);
    return u.toString();
  } catch {
    return url;
  }
};

// iHerb（Partnerize経由）のアフィリエイトトラッキングURLを付与する。
// Camref未設定（審査待ち）の間は元URLをそのまま返す安全側フォールバック。
export function addIherbAffiliate(rawUrl) {
  const camref = process.env.IHERB_CAMREF_ID;
  if (!camref || !rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (!/(^|\.)iherb\.com$/i.test(u.hostname)) return rawUrl;
    return `https://prf.hn/click/camref:${encodeURIComponent(camref)}/destination:${encodeURIComponent(rawUrl)}`;
  } catch {
    return rawUrl;
  }
}
