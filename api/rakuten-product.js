export default async function handler(req, res) {
  const { query, genreId, page = 1 } = req.query;
  const appId = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID || '';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (!appId) {
    return res.status(500).json({ error: 'Missing RAKUTEN_APP_ID' });
  }

  // 楽天 商品価格ナビ 製品検索API — ショップ出品ではなく「製品カタログ」を返す
  const params = new URLSearchParams({
    applicationId: appId,
    hits: 30,
    page,
    ...(query && { keyword: query }),
    ...(genreId && { genreId }),
  });
  const url = `https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Referer': req.headers['referer'] || req.headers['origin'] || 'https://honestbaby-care.com',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();

    const products = (data.Products || []).map(entry => {
      const p = entry.Product;
      // showcaseItems = カタログに紐付くショップ出品（複数の場合あり）
      const showcaseItems = p.showcaseItems || [];
      const shops = showcaseItems.length > 0
        ? showcaseItems.map(s => ({
            name: s.shopName || '楽天市場',
            price: s.itemPrice,
            url: s.affiliateUrl || s.itemUrl || p.productUrlPC,
            shipping: 0,
            points: 0
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
        shops
      };
    });

    return res.status(200).json({ products, count: data.count || 0 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
