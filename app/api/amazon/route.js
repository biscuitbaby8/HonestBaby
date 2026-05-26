import amazonPaapi from 'amazon-paapi';

// Amazon PA-API v5 ラッパー
// 環境変数: AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY / AMAZON_PARTNER_TAG

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

async function searchAmazonItem(keyword) {
  if (!isConfigured()) return null;
  try {
    const requestParameters = {
      Keywords: keyword,
      SearchIndex: 'All',
      ItemCount: 1,
      Resources: ['ItemInfo.Title', 'Offers.Listings.Price', 'Images.Primary.Medium', 'Images.Primary.Large'],
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

export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (!isConfigured()) {
    return Response.json(
      {
        error: 'Amazon PA-API not configured',
        message: 'Set AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG environment variables.',
      },
      { status: 503, headers }
    );
  }

  const keyword = new URL(request.url).searchParams.get('keyword');
  if (!keyword) return Response.json({ error: 'keyword required' }, { status: 400, headers });

  const result = await searchAmazonItem(keyword);
  if (!result) return Response.json({ error: 'No item found' }, { status: 404, headers });
  return Response.json(result, { status: 200, headers });
}
