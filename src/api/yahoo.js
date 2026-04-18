/**
 * Yahoo!ショッピングAPIクライアント
 */

const CLIENT_ID = import.meta.env.VITE_YAHOO_CLIENT_ID;

// Vercel Serverless Function経由でCORSを回避
const BASE_URL = 'https://honest-baby.vercel.app/api/yahoo';

export const searchYahooProducts = async (keyword) => {
  if (!keyword) return [];

  const params = new URLSearchParams({
    query: keyword,
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      console.error('Yahoo Proxy responded with:', response.status);
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
