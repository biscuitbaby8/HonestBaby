export default async function handler(req, res) {
  const { query } = req.query;
  const appId = process.env.VITE_RAKUTEN_APP_ID;
  const affiliateId = process.env.VITE_RAKUTEN_AFFILIATE_ID;
  
  if (!appId) {
    return res.status(500).json({ error: 'Missing Rakuten App ID in server environment variables' });
  }

  // Rakuten Ichiba Item Search API V2
  const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170426?applicationId=${appId}&keyword=${encodeURIComponent(query)}&hits=1&sort=%2BitemPrice&affiliateId=${affiliateId || ''}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
