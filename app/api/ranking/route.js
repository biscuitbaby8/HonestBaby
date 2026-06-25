import { request as httpsRequest } from 'node:https';
import { checkRateLimit } from '@/lib/rateLimit';

// /api/rakuten と同様、新・楽天APIはReferer/Originが一致しないと403になる。
// fetch()はこれらを禁止ヘッダーとして送信しないため node:https を使う。
const RAKUTEN_REFERER = process.env.RAKUTEN_REFERER || 'https://honestbaby-care.com';

function nodeHttpsGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': RAKUTEN_REFERER,
        'Origin': RAKUTEN_REFERER,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

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

  const limited = checkRateLimit(request, { limit: 30, windowMs: 60 * 1000, prefix: 'ranking', headers });
  if (limited) return limited;

  if (!appId) {
    return Response.json({ error: 'Missing Rakuten App ID' }, { status: 500, headers });
  }

  const url = `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey || ''}&genreId=${genreId || '100533'}&affiliateId=${affiliateId || ''}`;

  try {
    const { statusCode, text } = await nodeHttpsGet(url);
    if (statusCode !== 200) {
      return Response.json({ error: text }, { status: statusCode, headers });
    }
    const data = JSON.parse(text);

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
