export default async function handler(req, res) {
  const { query } = req.query;
  const clientId = process.env.VITE_YAHOO_CLIENT_ID;
  
  if (!clientId) {
    return res.status(500).json({ error: 'Missing Yahoo Client ID in server environment variables' });
  }

  // Yahoo Shopping API V3 (ItemSearch)
  const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${clientId}&query=${encodeURIComponent(query)}&results=1&sort=%2Bprice`;

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
