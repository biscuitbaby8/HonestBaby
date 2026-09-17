// 毎朝「本日の値下げTOP」を X へ自動投稿する Cron エンドポイント。
// Vercel Cron が Authorization: Bearer <CRON_SECRET> を付与する（他の cron と同じ認証）。
// X_* 環境変数が未設定なら投稿はスキップし、生成テキストのみ返す（休眠実装）。
import { fetchPriceDrops, buildDealsTweet } from '@/src/lib/deals';
import { postTweet, isXConfigured } from '@/src/lib/xClient';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deals = await fetchPriceDrops(5);
  const text = buildDealsTweet(deals);
  if (!text) {
    return Response.json({ ok: true, posted: false, reason: 'no_deals' });
  }

  // ?dry=1: 投稿せず本文だけ確認（動作確認用・CRON認証必須）
  if (searchParams.get('dry') === '1') {
    return Response.json({ ok: true, posted: false, dry: true, xConfigured: isXConfigured(), text });
  }

  const result = await postTweet(text);
  return Response.json({ ok: result.ok, posted: result.ok, text, result });
}
