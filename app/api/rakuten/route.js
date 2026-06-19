export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const noFilter = searchParams.get('noFilter');
  const shopCode = searchParams.get('shopCode');

  const appId = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
  };

  if (!appId) {
    return Response.json(
      { error: 'Missing Rakuten App ID (RAKUTEN_APP_ID or VITE_RAKUTEN_APP_ID) in server environment variables' },
      { status: 500, headers }
    );
  }

  // 一般検索: ベビー用品ジャンル(566382)に限定 + 価格フィルタ
  // noFilter=1 (クロスプラットフォーム価格比較用): フィルタなし
  const filterParams = noFilter === '1' ? '' : '&genreId=566382&minPrice=500';
  const shopCodeParam = shopCode ? `&shopCode=${encodeURIComponent(shopCode)}` : '';
  const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?applicationId=${appId}&accessKey=${accessKey || ''}&keyword=${encodeURIComponent(query || '')}&hits=30&sort=standard&availability=1${filterParams}${shopCodeParam}&affiliateId=${affiliateId || ''}`;

  const clientReferer =
    request.headers.get('referer') || request.headers.get('origin') || 'https://honestbaby-care.com';

  try {
    const response = await fetch(url, {
      headers: { Referer: clientReferer, 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: response.status, headers });
    }
    const data = await response.json();

    const products = (data.Items || []).map((item) => ({
      id: `rakuten-${item.Item.itemCode}`,
      name: item.Item.itemName,
      price: item.Item.itemPrice,
      image: (item.Item.largeImageUrls?.[0]?.imageUrl || item.Item.mediumImageUrls?.[0]?.imageUrl || '').replace(/_ex=\d+x\d+/, '_ex=800x800'),
      url: item.Item.affiliateUrl || item.Item.itemUrl,
      brand: item.Item.shopName || '楽天市場',
      rating: parseFloat(item.Item.reviewAverage) || 4.5,
      source: 'rakuten',
      shops: [{
        name: '楽天市場',
        price: item.Item.itemPrice,
        url: item.Item.affiliateUrl || item.Item.itemUrl,
        shipping: item.Item.postageFlag === 1 ? 0 : null,
        points: item.Item.pointRate || 0,
      }],
    }));
    return Response.json({ products }, { status: 200, headers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers });
  }
}
