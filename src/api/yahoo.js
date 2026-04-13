/**
 * Yahoo!ショッピングAPIクライアント
 */

const CLIENT_ID = import.meta.env.VITE_YAHOO_CLIENT_ID;

// Yahoo!ショッピング商品検索API v3
const BASE_URL = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';

export const searchYahooProducts = async (keyword) => {
  if (!CLIENT_ID) {
    console.warn('Yahoo Client ID is missing. Setup VITE_YAHOO_CLIENT_ID.');
    return [];
  }

  const params = new URLSearchParams({
    appid: CLIENT_ID,
    query: keyword,
    results: '5',
    sort: '+price', // 安い順
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      console.error('Yahoo API responded with:', response.status);
      return [];
    }
    const data = await response.json();
    
    return (data.hits || []).map(hit => ({
      id: hit.code,
      name: hit.name,
      price: hit.price,
      url: hit.url,
      shopName: hit.seller?.name || '',
      image: hit.image?.medium || '',
    }));
  } catch (error) {
    console.error('Failed to fetch from Yahoo API:', error);
    return [];
  }
};
