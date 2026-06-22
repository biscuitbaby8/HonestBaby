import { isAmazonConfigured, searchAmazonItems } from '@/lib/amazonApi';

// Amazon PA-API v5 ラッパー（/api/rakuten・/api/yahoo と同じ {products:[...]} 形式で返す）
// 環境変数: AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY / AMAZON_PARTNER_TAG

export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
  };

  // 未設定時もエラーにせず空配列を返す（呼び出し側の分岐を増やさないためのフェイルオープン）
  if (!isAmazonConfigured()) {
    return Response.json({ products: [] }, { status: 200, headers });
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('query') || searchParams.get('keyword');
  if (!keyword) return Response.json({ error: 'query required' }, { status: 400, headers });

  const items = await searchAmazonItems(keyword, 10);
  const products = items.map(item => ({
    id: `amazon-${item.asin || Math.random()}`,
    name: item.title,
    price: item.price,
    condition: item.condition,
    image: item.image,
    url: item.url,
    brand: 'Amazon.co.jp',
    rating: 0,
    source: 'amazon',
    shops: [{ name: 'Amazon.co.jp', price: item.price, url: item.url, shipping: 0, points: 0 }],
  }));

  return Response.json({ products }, { status: 200, headers });
}
