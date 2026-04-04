/**
 * Rakuten Ichiba Item Search API client
 * Doc: https://webservice.rakuten.co.jp/documentation/ichiba-item-search
 */

const BASE_URL = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170426';
const APP_ID = import.meta.env.VITE_RAKUTEN_APP_ID;

export const searchProducts = async ({ keyword, categoryId, hits = 20, sort = 'standard' }) => {
  if (!APP_ID) {
    console.error('Rakuten App ID is missing. Check your .env file.');
    return [];
  }

  const params = new URLSearchParams({
    applicationId: APP_ID,
    format: 'json',
    keyword: keyword || '',
    genreId: categoryId || '',
    hits: hits.toString(),
    sort: sort,
    imageFlag: '1',
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Rakuten API error: ${response.status}`);
    }
    const data = await response.json();
    
    // Transform Rakuten data format to HonestBaby common product format
    return (data.Items || []).map(item => {
      const info = item.Item;
      return {
        id: `r-${info.itemCode}`,
        name: info.itemName,
        price: info.itemPrice,
        image: info.mediumImageUrls[0]?.imageUrl || info.smallImageUrls[0]?.imageUrl,
        url: info.itemUrl,
        shopName: info.shopName,
        rating: parseFloat(info.reviewAverage) || 0,
        reviewCount: info.reviewCount,
        category: categoryId, // Pass back for filtering
        description: info.itemCaption,
        // Mocking specs for now as Rakuten doesn't always provide them in simple search
        specs: {
          jan: info.itemCode.split(':')[0], // Likely JAN prefix or similar
        }
      };
    });
  } catch (error) {
    console.error('Failed to fetch from Rakuten API:', error);
    return [];
  }
};

export const getProductById = async (id) => {
  if (!id.startsWith('r-')) return null;
  const itemCode = id.replace('r-', '');

  const params = new URLSearchParams({
    applicationId: APP_ID,
    format: 'json',
    itemCode: itemCode,
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const info = data.Items?.[0]?.Item;
    if (!info) return null;

    return {
      id: id,
      name: info.itemName,
      price: info.itemPrice,
      image: info.mediumImageUrls[0]?.imageUrl || info.smallImageUrls[0]?.imageUrl,
      url: info.itemUrl,
      shopName: info.shopName,
      rating: parseFloat(info.reviewAverage) || 0,
      reviewCount: info.reviewCount,
      description: info.itemCaption,
      specs: {
        jan: info.itemCode.split(':')[0],
      }
    };
  } catch (error) {
    console.error('Failed to get product details:', error);
    return null;
  }
};
