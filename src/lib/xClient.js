// X（Twitter）へ投稿するサーバー専用クライアント。OAuth1.0a を Node 標準の crypto で署名（依存追加なし）。
// 環境変数が揃った時だけ有効化する休眠実装（未設定なら {ok:false, reason:'not_configured'}）。
//   X_API_KEY / X_API_SECRET（アプリの Consumer Key/Secret）
//   X_ACCESS_TOKEN / X_ACCESS_SECRET（投稿先アカウントの Access Token/Secret・Read and Write 権限）
import crypto from 'crypto';

// OAuth は厳密な RFC3986 パーセントエンコードを要求する
const enc = (s) =>
  encodeURIComponent(String(s)).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

export function isXConfigured() {
  return !!(
    process.env.X_API_KEY &&
    process.env.X_API_SECRET &&
    process.env.X_ACCESS_TOKEN &&
    process.env.X_ACCESS_SECRET
  );
}

function buildOAuthHeader(method, url, creds) {
  const oauth = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.token,
    oauth_version: '1.0',
  };
  // JSON ボディの POST /2/tweets では署名対象は oauth_* パラメータのみ（ボディは含めない）
  const paramString = Object.keys(oauth)
    .sort()
    .map((k) => `${enc(k)}=${enc(oauth[k])}`)
    .join('&');
  const baseString = [method.toUpperCase(), enc(url), enc(paramString)].join('&');
  const signingKey = `${enc(creds.apiSecret)}&${enc(creds.tokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  const all = { ...oauth, oauth_signature: signature };
  return (
    'OAuth ' +
    Object.keys(all)
      .sort()
      .map((k) => `${enc(k)}="${enc(all[k])}"`)
      .join(', ')
  );
}

export async function postTweet(text) {
  if (!isXConfigured()) return { ok: false, reason: 'not_configured' };
  const url = 'https://api.twitter.com/2/tweets';
  const creds = {
    apiKey: process.env.X_API_KEY,
    apiSecret: process.env.X_API_SECRET,
    token: process.env.X_ACCESS_TOKEN,
    tokenSecret: process.env.X_ACCESS_SECRET,
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: buildOAuthHeader('POST', url, creds),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 201 || res.status === 200) return { ok: true, id: data?.data?.id };
    // 秘密情報は返さない。ステータスと本文先頭のみ。
    return { ok: false, reason: `http_${res.status}`, detail: JSON.stringify(data).slice(0, 300) };
  } catch (e) {
    return { ok: false, reason: e?.name === 'TimeoutError' ? 'timeout' : 'error', detail: String(e?.message || e).slice(0, 200) };
  }
}
