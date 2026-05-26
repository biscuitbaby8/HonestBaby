export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const genreId = searchParams.get('genreId');

  const appId = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (!appId) {
    return Response.json({ error: 'Missing Rakuten App ID' }, { status: 500, headers });
  }

  const url = `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey || ''}&genreId=${genreId || '100533'}&affiliateId=${affiliateId || ''}`;

  const clientReferer =
    request.headers.get('referer') || request.headers.get('origin') || 'https://honestbaby-care.com';

  try {
    const response = await fetch(url, {
      headers: { Referer: clientReferer, 'User-Agent': 'Mozilla/5.0' },
    });
    const data = await response.json();

    if (data.Items) {
      const products = data.Items.map((item) => ({
        id: `ranking-${item.Item.itemCode}`,
        name: item.Item.itemName,
        price: item.Item.itemPrice,
        image: item.Item.mediumImageUrls[0]?.imageUrl || '',
        url: item.Item.affiliateUrl || item.Item.itemUrl,
        brand: '',
        category: '',
        rating: parseFloat(item.Item.reviewAverage) || 4.5,
        shops: [{
          name: '楽天市場',
          price: item.Item.itemPrice,
          url: item.Item.affiliateUrl || item.Item.itemUrl,
        }],
      }));
      return Response.json({ products }, { status: 200, headers });
    }
    console.error('Rakuten ranking API returned no Items:', JSON.stringify(data));
    return Response.json({ products: [], debug: data }, { status: 200, headers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers });
  }
}
