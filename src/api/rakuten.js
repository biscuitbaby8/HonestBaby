/**
 * Rakuten Ichiba Item Search API client (Standard 2026)
 * Doc: https://openapi.rakuten.co.jp/
 */

const APP_ID = import.meta.env.VITE_RAKUTEN_APP_ID;
const ACCESS_KEY = import.meta.env.VITE_RAKUTEN_ACCESS_KEY; // Required for UUID IDs
const AFFILIATE_ID = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID;

// Modern OpenAPI endpoint (v1)
const BASE_URL = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401';

async function fetchRakuten(params) {
  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Rakuten API Error (${response.status}):`, errorText);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error('Rakuten fetch failed:', e);
    return null;
  }
}

function buildParams(extra = {}) {
  const params = new URLSearchParams({
    applicationId: APP_ID,
    format: 'json',
    ...extra,
  });
  
  // UUID apps require accessKey
  if (ACCESS_KEY) {
    params.set('accessKey', ACCESS_KEY);
  }
  
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
    console.error('Rakuten Application ID is missing.');
    return [];
  }

  const params = buildParams({
    keyword: keyword || 'ベビー用品',
    hits: hits.toString(),
    sort: sort,
    imageFlag: '1',
  });
  
  if (categoryId) params.set('genreId', categoryId);

  try {
    const data = await fetchRakuten(params);
    if (!data) return [];
    return (data.Items || []).map(item => normalizeItem(item, categoryId));
  } catch (error) {
    console.error('Error in searchRakutenProducts:', error);
    return [];
  }
};

export const getProductById = async (id) => {
  if (!id.startsWith('r-')) return null;
  if (!APP_ID) return null;

  const itemCode = id.replace('r-', '');
  const params = buildParams({ itemCode });

  try {
    const data = await fetchRakuten(params);
    const info = data?.Items?.[0];
    if (!info) return null;
    return normalizeItem(info, '');
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};
