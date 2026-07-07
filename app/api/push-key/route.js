// Web Push の VAPID 公開鍵を返す（公開鍵は公開して問題ない値）。
// クライアントのビルド時環境変数（NEXT_PUBLIC_*）に依存すると、
// 未設定時に購読が黙って失敗するため、サーバーの実行時環境変数から配る。
export async function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
  return Response.json(
    { key },
    { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } }
  );
}
