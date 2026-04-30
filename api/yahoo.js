export default async function handler(req, res) {
  const { query } = req.query;
  const clientId = process.env.YAHOO_CLIENT_ID || process.env.VITE_YAHOO_CLIENT_ID;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (!clientId) {
    return res.status(500).json({ error: 'Missing Yahoo Client ID (YAHOO_CLIENT_ID)' });
  }

  // Yahoo Shopping API V3 (ItemSearch) - 30件取得、価格昇順
  const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${clientId}&query=${encodeURIComponent(query || '')}&results=30&sort=%2Bprice`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();

    // フロントエンドが扱いやすい共通フォーマットに変換
    const products = (data.hits || []).map(item => ({
      id: `yahoo-${item.code || Math.random()}`,
      name: item.name,
      price: item.price,
      image: item.image?.medium || item.image?.small || '',
      url: item.url,
      brand: item.seller?.name || item.brand?.name || 'Yahoo!ショッピング',
      rating: item.review?.rate || 4.5,
      source: 'yahoo',
      shops: [{
        name: 'Yahoo!ショッピング',
        price: item.price,
        url: item.url,
        shipping: item.shipping?.code === 0 ? 0 : (item.shipping?.name || ''),
        points: item.point?.amount || 0
      }]
    }));

    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
