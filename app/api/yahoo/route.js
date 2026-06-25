import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const noFilter = searchParams.get('noFilter');

  const clientId = process.env.YAHOO_CLIENT_ID || process.env.VITE_YAHOO_CLIENT_ID;
  const vcSid = process.env.VITE_VC_SID || process.env.NEXT_PUBLIC_VC_SID || '3768537';

  const headers = {
    'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
  };

  const limited = checkRateLimit(request, { limit: 30, windowMs: 60 * 1000, prefix: 'yahoo', headers });
  if (limited) return limited;

  if (!clientId) {
    return Response.json({ error: 'Missing Yahoo Client ID (YAHOO_CLIENT_ID)' }, { status: 500, headers });
  }

  // noFilter=1 のときはジャンル/価格フィルタを外す（クロスプラットフォーム比較用）
  const filterParams = noFilter === '1' ? '' : '&category_id=13457&price_from=500';
  const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${clientId}&query=${encodeURIComponent(query || '')}&results=30${filterParams}`;

  // Yahoo Shopping URL に ValueCommerce アフィリエイトパラメータを付与
  const addAffiliate = (rawUrl) => {
    if (!rawUrl) return rawUrl;
    try {
      if (!/yahoo\.co\.jp/.test(rawUrl)) return rawUrl;
      const sep = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${sep}sc_e=afvc_shp_${vcSid}`;
    } catch {
      return rawUrl;
    }
  };

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: response.status, headers });
    }
    const data = await response.json();

    const products = (data.hits || []).map((item) => ({
      id: `yahoo-${item.code || Math.random()}`,
      name: item.name,
      price: item.price,
      image: item.image?.large || item.image?.medium || item.image?.small || '',
      url: addAffiliate(item.url),
      brand: item.seller?.name || item.brand?.name || 'Yahoo!ショッピング',
      rating: item.review?.rate || 4.5,
      source: 'yahoo',
      shops: [{
        name: 'Yahoo!ショッピング',
        price: item.price,
        url: addAffiliate(item.url),
        shipping: item.shipping?.code === 0 ? 0 : (item.shipping?.name || ''),
        points: item.point?.amount || 0,
      }],
    }));

    return Response.json({ products }, { status: 200, headers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers });
  }
}
