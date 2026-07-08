import { searchAmazonItems } from '@/lib/amazonApi';
import { checkRateLimit } from '@/lib/rateLimit';

// SPA（商品モーダル）用のAmazon商品検索プロキシ。
// 認証情報はサーバー内に閉じ、資格未達時は { eligible: false } を返す
// （クライアント側は従来のタグ付き検索リンクへフォールバック）。
export async function GET(request) {
  const limited = checkRateLimit(request, { limit: 30, windowMs: 5 * 60 * 1000, prefix: 'amazon-search' });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').slice(0, 100).trim();
  if (!q) return Response.json({ items: [], eligible: false }, { status: 200 });

  const result = await searchAmazonItems(q);
  return Response.json(result, {
    status: 200,
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  });
}
