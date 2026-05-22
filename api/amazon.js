import amazonPaapi from 'amazon-paapi';

// Amazon PA-API v5 ラッパー
// 環境変数:
//   AMAZON_ACCESS_KEY     - PA-APIのアクセスキー
//   AMAZON_SECRET_KEY     - PA-APIのシークレットキー
//   AMAZON_PARTNER_TAG    - アソシエイトタグ（例: honestbaby-22）

function isConfigured() {
  return !!(process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY && process.env.AMAZON_PARTNER_TAG);
}

function commonParams() {
  return {
    AccessKey: process.env.AMAZON_ACCESS_KEY,
    SecretKey: process.env.AMAZON_SECRET_KEY,
    PartnerTag: process.env.AMAZON_PARTNER_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.co.jp',
  };
}

/**
 * キーワードで Amazon 商品を検索し、最上位ヒットを返す。
 * @param {string} keyword
 * @returns {Promise<{title, price, url, image}|null>}
 */
export async function searchAmazonItem(keyword) {
  if (!isConfigured()) return null;
  try {
    const requestParameters = {
      Keywords: keyword,
      SearchIndex: 'All',
      ItemCount: 1,
      Resources: [
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'Images.Primary.Medium',
        'Images.Primary.Large',
      ],
    };
    const data = await amazonPaapi.SearchItems(commonParams(), requestParameters);
    const item = data?.SearchResult?.Items?.[0];
    if (!item) return null;
    return {
      title: item.ItemInfo?.Title?.DisplayValue || keyword,
      price: item.Offers?.Listings?.[0]?.Price?.Amount || null,
      url: item.DetailPageURL || `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${process.env.AMAZON_PARTNER_TAG}`,
      image: item.Images?.Primary?.Large?.URL || item.Images?.Primary?.Medium?.URL || null,
    };
  } catch (e) {
    console.warn('Amazon PA-API error:', e?.message || e);
    return null;
  }
}

// HTTP エンドポイント: GET /api/amazon?keyword=XXX
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (!isConfigured()) {
    return res.status(503).json({
      error: 'Amazon PA-API not configured',
      message: 'Set AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG environment variables.',
    });
  }

  const keyword = req.query.keyword;
  if (!keyword) return res.status(400).json({ error: 'keyword required' });

  const result = await searchAmazonItem(keyword);
  if (!result) return res.status(404).json({ error: 'No item found' });
  return res.status(200).json(result);
}
