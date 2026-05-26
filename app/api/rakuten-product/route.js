export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const genreId = searchParams.get('genreId');
  const page = searchParams.get('page') || 1;

  const appId = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY || '';
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID || '';

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (!appId) {
    return Response.json({ error: 'Missing RAKUTEN_APP_ID' }, { status: 500, headers });
  }

  // 楽天 商品価格ナビ 製品検索API — ショップ出品ではなく「製品カタログ」を返す
  const params = new URLSearchParams({
    applicationId: appId,
    accessKey,
    hits: 30,
    page,
    ...(query && { keyword: query }),
    ...(genreId && { genreId }),
  });
  const url = `https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        Referer: request.headers.get('referer') || request.headers.get('origin') || 'https://honestbaby-care.com',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: response.status, headers });
    }
    const data = await response.json();

    const products = (data.Products || []).map((entry) => {
      const p = entry.Product;
      // showcaseItems = カタログに紐付くショップ出品（複数の場合あり）
      const showcaseItems = p.showcaseItems || [];
      const shops = showcaseItems.length > 0
        ? showcaseItems.map((s) => ({
            name: s.shopName || '楽天市場',
            price: s.itemPrice,
            url: s.affiliateUrl || s.itemUrl || p.productUrlPC,
            shipping: 0,
            points: 0,
          }))
        : [{ name: '楽天市場', price: p.productPriceMin, url: p.productUrlPC, shipping: 0, points: 0 }];

      return {
        id: `product-${p.productId}`,
        name: p.productName,
        price: p.productPriceMin,
        image: (p.mediumImageUrl || p.smallImageUrl || '').replace(/_ex=\d+x\d+/, '_ex=400x400'),
        url: p.productUrlPC,
        brand: '',
        rating: parseFloat(p.reviewAverage) || 4.5,
        reviewCount: p.reviewCount || 0,
        source: 'rakuten-product',
        shops,
      };
    });

    return Response.json({ products, count: data.count || 0 }, { status: 200, headers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers });
  }
}
