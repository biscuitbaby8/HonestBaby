/**
 * Yahoo! Shopping API client (v3)
 * Doc: https://developer.yahoo.co.jp/webapi/shopping/shopping/v3/itemsearch.html
 */

const CLIENT_ID = import.meta.env.VITE_YAHOO_CLIENT_ID;
const BASE_URL = 'https://shopping.yahooapis.jp/ShoppingWebApi/v3/itemSearch';

export const searchYahooProducts = async (query) => {
  if (!CLIENT_ID) {
    console.error('Yahoo Client ID is missing. Check your .env file.');
    return [];
  }

  const params = new URLSearchParams({
    appid: CLIENT_ID,
    query: query,
    results: 5, // Limit for comparison
    sort: '+price', // Sort by ascending price
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Yahoo API error');
    const data = await response.json();
    
    return data.hits.map(hit => ({
      id: `y-${hit.index}`,
      name: hit.name,
      price: hit.price,
      shipping: hit.shipping.code === 0 ? 0 : 500, // Code 0 is free shipping in many cases
      points: Math.floor(hit.price * 0.01), // Basic 1% point
      link: hit.url,
      imageUrl: hit.image.medium,
      shopName: hit.seller.name
    }));
  } catch (error) {
    console.error('Failed to fetch from Yahoo API:', error);
    return [];
  }
};
