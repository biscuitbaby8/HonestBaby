import { request as httpsRequest } from 'node:https';
import { checkRateLimit } from '@/lib/rateLimit';

// 新・楽天API(openapi.rakuten.co.jp)は Referer と Origin の両方が
// アプリ登録時の「許可するWebサイト」と一致しないと
// REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING (403) になる。
// fetch() は Referer/Origin を「禁止ヘッダー」として実際には送信しないため、
// node:https を直接使ってヘッダーを確実に送る。
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

function getCreds() {
  return {
    appId: process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID,
    accessKey: process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY || '',
    affiliateId: process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID || '',
  };
}

// 市場網羅型ランキング取得エンジン用: 複数ソート×複数ページをサーバー側で
// 並列取得しマージ（APIキーをクライアントに渡さないため）
async function fetchBatchItems({ appId, accessKey, affiliateId, keyword, genreId, skipGenreId }) {
  const SORTS = ['-reviewCount', 'standard', '-reviewAverage'];
  const fetches = SORTS.flatMap(sort =>
    [1, 2, 3].map(async (page) => {
      const genreParam = (genreId && !skipGenreId) ? `&genreId=${genreId}` : '';
      const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?applicationId=${appId}&accessKey=${accessKey}&keyword=${encodeURIComponent(keyword)}&sort=${sort}&hits=30&page=${page}&availability=1${genreParam}&affiliateId=${affiliateId}`;
      try {
        const { statusCode, text } = await nodeHttpsGet(url);
        if (statusCode !== 200) return [];
        const data = JSON.parse(text);
        return data.Items || [];
      } catch {
        return [];
      }
    })
  );
  const results = await Promise.all(fetches);
  const seen = new Set();
  return results.flat().filter((item) => {
    const code = item?.Item?.itemCode;
    if (!code) return true;
    if (seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const query = searchParams.get('query');
  const noFilter = searchParams.get('noFilter');
  const shopCode = searchParams.get('shopCode');

  const { appId, accessKey, affiliateId } = getCreds();

  const headers = {
    'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
  };

  const limited = checkRateLimit(request, { limit: 30, windowMs: 60 * 1000, prefix: 'rakuten', headers });
  if (limited) return limited;

  if (!appId) {
    return Response.json(
      { error: 'Missing Rakuten App ID (RAKUTEN_APP_ID or VITE_RAKUTEN_APP_ID) in server environment variables' },
      { status: 500, headers }
    );
  }

  // ジャンル別ランキング（市場網羅エンジンの最終フォールバック・AIチャットの商品提案で使用）
  if (mode === 'ranking') {
    const genreId = searchParams.get('genreId') || '100533';
    const url = `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey}&genreId=${genreId}&affiliateId=${affiliateId}`;
    try {
      const { statusCode, text } = await nodeHttpsGet(url);
      if (statusCode !== 200) return Response.json({ error: text }, { status: statusCode, headers });
      const data = JSON.parse(text);
      return Response.json({ Items: data.Items || [] }, { status: 200, headers });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500, headers });
    }
  }

  // 複数ソート×複数ページの並列検索結果をマージ（市場網羅型ランキング取得エンジンで使用）
  if (mode === 'batch') {
    const keyword = searchParams.get('keyword') || '';
    const genreId = searchParams.get('genreId') || '';
    const skipGenreId = searchParams.get('skipGenreId') === '1';
    try {
      const items = await fetchBatchItems({ appId, accessKey, affiliateId, keyword, genreId, skipGenreId });
      return Response.json({ Items: items }, { status: 200, headers });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500, headers });
    }
  }

  // 一般検索: ベビー用品ジャンル(566382)に限定 + 価格フィルタ
  // noFilter=1 (クロスプラットフォーム価格比較用): フィルタなし
  // noGenre=1 (ジャンル絞りで0件だった時の再検索用): ジャンル制限だけ外し価格下限は維持
  //  → グーン トイ・ストーリー柄のおむつ等、ジャンル登録の都合で 566382 の
  //     絞り込みから漏れる商品を拾えるようにする。
  const noGenre = searchParams.get('noGenre');
  const filterParams = noFilter === '1'
    ? ''
    : noGenre === '1'
      ? '&minPrice=500'
      : '&genreId=566382&minPrice=500';
  const shopCodeParam = shopCode ? `&shopCode=${encodeURIComponent(shopCode)}` : '';
  const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?applicationId=${appId}&accessKey=${accessKey || ''}&keyword=${encodeURIComponent(query || '')}&hits=30&sort=standard&availability=1${filterParams}${shopCodeParam}&affiliateId=${affiliateId || ''}`;

  try {
    const { statusCode, text } = await nodeHttpsGet(url);
    if (statusCode !== 200) {
      return Response.json({ error: text }, { status: statusCode, headers });
    }
    const data = JSON.parse(text);

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
