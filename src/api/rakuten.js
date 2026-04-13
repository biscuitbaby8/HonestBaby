/**
 * Rakuten Ichiba Item Search API client
 * ─ UUID形式のアプリIDに対応
 */

const APP_ID = import.meta.env.VITE_RAKUTEN_APP_ID;
const AFFILIATE_ID = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID;

// 新旧両方のエンドポイントを試す
const ENDPOINTS = [
  'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601',
  'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170426',
];

async function fetchWithFallback(params) {
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      }
      console.warn(`Endpoint ${endpoint} returned ${response.status}, trying next...`);
    } catch (e) {
      console.warn(`Endpoint ${endpoint} failed:`, e.message);
    }
  }
  throw new Error('All Rakuten API endpoints failed');
}

function buildParams(extra = {}) {
  const params = new URLSearchParams({
    applicationId: APP_ID,
    format: 'json',
    ...extra,
  });
  // affiliateIdは空文字を送らない
  if (AFFILIATE_ID) {
    params.set('affiliateId', AFFILIATE_ID);
  }
  return params;
}

function normalizeItem(item, categoryId) {
  const info = item.Item || item;
  const imageUrl = (
    info.mediumImageUrls?.[0]?.imageUrl ||
    info.smallImageUrls?.[0]?.imageUrl ||
    ''
  ).replace(/\?_ex=\d+x\d+/, '');

  return {
    id: `r-${info.itemCode}`,
    name: info.itemName,
    price: info.itemPrice,
    image: imageUrl,
    url: info.affiliateUrl || info.itemUrl,
    shopName: info.shopName,
    rating: parseFloat(info.reviewAverage) || 0,
    reviewCount: info.reviewCount || 0,
    category: categoryId || '',
    description: info.itemCaption || '',
  };
}

export const searchRakutenProducts = async ({ keyword, categoryId, hits = 20, sort = 'standard' }) => {
  if (!APP_ID) {
    console.error('楽天アプリIDが未設定です。.envファイルを確認してください。');
    return [];
  }

  const extra = {
    keyword: keyword || 'ベビー用品',
    hits: hits.toString(),
    sort,
    imageFlag: '1',
  };
  if (categoryId) extra.genreId = categoryId;

  try {
    const data = await fetchWithFallback(buildParams(extra));
    return (data.Items || []).map(item => normalizeItem(item, categoryId));
  } catch (error) {
    console.error('楽天API通信に失敗しました:', error);
    return [];
  }
};

export const getProductById = async (id) => {
  if (!id.startsWith('r-')) return null;
  if (!APP_ID) return null;

  const itemCode = id.replace('r-', '');

  try {
    const data = await fetchWithFallback(buildParams({
      itemCode,
    }));
    const info = data.Items?.[0];
    if (!info) return null;
    return normalizeItem(info, '');
  } catch (error) {
    console.error('商品詳細の取得に失敗しました:', error);
    return null;
  }
};
