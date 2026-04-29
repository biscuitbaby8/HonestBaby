import https from 'node:https';

function httpsGet(url, referer) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'Referer': referer || 'https://honestbaby-care.com',
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const { genreId } = req.query;
  const appId = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY;

  if (!appId) {
    return res.status(500).json({ error: 'Missing Rakuten App ID' });
  }

  const url = `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey || ''}&genreId=${genreId || '100533'}&affiliateId=${affiliateId || ''}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  const clientReferer = req.headers['referer'] || req.headers['origin'] || 'https://honestbaby-care.com';

  try {
    const data = await httpsGet(url, clientReferer);

    if (data.Items) {
      const products = data.Items.map(item => ({
        id: `ranking-${item.Item.itemCode}`,
        name: item.Item.itemName,
        price: item.Item.itemPrice,
        image: item.Item.mediumImageUrls[0]?.imageUrl || "",
        url: item.Item.affiliateUrl || item.Item.itemUrl,
        brand: "",
        category: "",
        rating: parseFloat(item.Item.reviewAverage) || 4.5,
        shops: [{
          name: "楽天市場",
          price: item.Item.itemPrice,
          url: item.Item.affiliateUrl || item.Item.itemUrl
        }]
      }));
      res.status(200).json({ products });
    } else {
      console.error('Rakuten ranking API returned no Items:', JSON.stringify(data));
      res.status(200).json({ products: [], debug: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
