export default async function handler(req, res) {
  const { query } = req.query;
  const appId = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY;

  if (!appId) {
    return res.status(500).json({ error: 'Missing Rakuten App ID (RAKUTEN_APP_ID or VITE_RAKUTEN_APP_ID) in server environment variables' });
  }

  const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401?applicationId=${appId}&accessKey=${accessKey || ''}&keyword=${encodeURIComponent(query || '')}&hits=15&sort=%2BitemPrice&affiliateId=${affiliateId || ''}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  const clientReferer = req.headers['referer'] || req.headers['origin'] || 'https://honestbaby-care.com';

  try {
    const response = await fetch(url, {
      headers: { 'Referer': clientReferer, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();

    const products = (data.Items || []).map(item => ({
      id: `rakuten-${item.Item.itemCode}`,
      name: item.Item.itemName,
      price: item.Item.itemPrice,
      image: item.Item.mediumImageUrls?.[0]?.imageUrl || '',
      url: item.Item.affiliateUrl || item.Item.itemUrl,
      brand: item.Item.shopName || '',
      rating: parseFloat(item.Item.reviewAverage) || 4.5,
      source: 'rakuten',
      shops: [{
        name: '楽天市場',
        price: item.Item.itemPrice,
        url: item.Item.affiliateUrl || item.Item.itemUrl,
        shipping: item.Item.postageFlag === 1 ? 0 : null,
        points: item.Item.pointRate || 0
      }]
    }));
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
