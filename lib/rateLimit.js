// メモリ内の簡易レート制限。
// Vercelの各サーバーレスインスタンス内でのみ有効（インスタンスをまたいだ厳密な制限はできない）が、
// 単一IPからの連続リクエスト（総当たり・外部APIの濫用）を抑える目的には十分。
const buckets = new Map();

function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function pruneExpired(now) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

/**
 * @param {Request} request
 * @param {{ limit: number, windowMs: number, prefix?: string, headers?: Record<string,string> }} options
 * @returns {Response|null} 制限超過時はそのまま返せる429レスポンス、許可時はnull
 */
export function checkRateLimit(request, { limit, windowMs, prefix = '', headers = {} }) {
  const now = Date.now();
  if (buckets.size > 5000) pruneExpired(now);

  const key = `${prefix}:${getClientIp(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count++;
  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return Response.json(
      { error: 'リクエストが多すぎます。しばらくしてから再度お試しください。' },
      { status: 429, headers: { ...headers, 'Retry-After': String(retryAfter) } }
    );
  }
  return null;
}
