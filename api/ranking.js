export default async function handler(req, res) {
  const { genreId } = req.query;
  const appId = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY;
  
  if (!appId) {
    return res.status(500).json({ error: 'Missing Rakuten App ID' });
  }

  // 楽天市場ランキングAPI (最新版)
  // 新仕様では applicationId と accessKey の両方が必要な場合があります
  const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey || ''}&genreId=${genreId || '100533'}&affiliateId=${affiliateId || ''}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Items) {
      // 共通フォーマットに変換
      const products = data.Items.map(item => ({
        id: `ranking-${item.Item.itemCode}`,
        name: item.Item.itemName,
        price: item.Item.itemPrice,
        image: item.Item.mediumImageUrls[0]?.imageUrl || "",
        url: item.Item.affiliateUrl || item.Item.itemUrl,
        brand: "", // ランキングAPIにはブランド名が直接ないため、後でAI等で抽出
        category: "", // 呼び出し元が補完
        rating: parseFloat(item.Item.reviewAverage) || 4.5,
        shops: [{
          name: "楽天市場",
          price: item.Item.itemPrice,
          url: item.Item.itemUrl
        }]
      }));
      res.status(200).json({ products });
    } else {
      res.status(200).json({ products: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
