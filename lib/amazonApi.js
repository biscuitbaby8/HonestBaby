// Amazon Creators API（PA-API 5.0の後継）クライアント。サーバー専用。
//
// 利用条件: 承認済みアソシエイト + 過去30日間に売上10件以上。
// 条件未達・認証情報未設定・APIエラーは全て { items: [], eligible: false } を
// 返す安全側フォールバックで、呼び出し側は従来の検索リンク表示に落ちる
// （休眠実装: Vercelに環境変数を設定し、資格が付与されると自動で有効化）。
//
// 環境変数:
//   AMZ_CREATORS_CLIENT_ID / AMZ_CREATORS_CLIENT_SECRET（Associate Centralで発行）
//   任意: AMZ_CREATORS_TOKEN_URL / AMZ_CREATORS_API_BASE（既定は日本向け）

const CLIENT_ID = process.env.AMZ_CREATORS_CLIENT_ID;
const CLIENT_SECRET = process.env.AMZ_CREATORS_CLIENT_SECRET;
const PARTNER_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || 'honestbaby-22';
// 極東リージョン（日本のアソシエイトアカウント）のLWAトークンエンドポイント
const TOKEN_URL = process.env.AMZ_CREATORS_TOKEN_URL || 'https://api.amazon.co.jp/auth/o2/token';
const API_BASE = process.env.AMZ_CREATORS_API_BASE || 'https://creatorsapi.amazon';
const MARKETPLACE = 'www.amazon.co.jp';

let tokenCache = { token: null, expiresAt: 0 };
let backoffUntil = 0; // 資格なし(401/403)・失敗時の再試行抑制

export function isAmazonApiConfigured() {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'creatorsapi::default',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const data = await res.json();
  // 期限の5分前に失効させて安全側に（トークンは通常1時間有効）
  const ttl = Math.max((Number(data.expires_in) || 3600) - 300, 60);
  tokenCache = { token: data.access_token, expiresAt: Date.now() + ttl * 1000 };
  return tokenCache.token;
}

const pick = (...vals) => vals.find((v) => v !== undefined && v !== null);

// レスポンス形はPA-API 5.0互換のlowerCamelCaseが基本だが、
// 新APIのため複数の候補パスを許容して防御的にパースする
function parseItems(data) {
  const arr = pick(data?.searchResult?.items, data?.itemsResult?.items, data?.items) || [];
  return arr
    .map((it) => {
      const name = pick(it?.itemInfo?.title?.displayValue, it?.title);
      const url = pick(it?.detailPageUrl, it?.detailPageURL, it?.url);
      const image = pick(
        it?.images?.primary?.medium?.url,
        it?.images?.primary?.large?.url,
        it?.image
      );
      const listing = pick(it?.offers?.listings?.[0], it?.offersV2?.listings?.[0]);
      const price = Number(pick(listing?.price?.amount, listing?.price?.money?.amount, it?.price)) || 0;
      return { name, url, image: image || null, price, asin: it?.asin || null };
    })
    .filter((x) => x.name && x.url);
}

// キーワードでAmazon商品を検索。戻り値 { items, eligible }。
export async function searchAmazonItems(keyword, itemCount = 3) {
  if (!isAmazonApiConfigured() || !keyword) return { items: [], eligible: false };
  if (Date.now() < backoffUntil) return { items: [], eligible: false };

  try {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/catalog/v1/searchItems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-marketplace': MARKETPLACE,
      },
      body: JSON.stringify({
        keywords: keyword,
        partnerTag: PARTNER_TAG,
        partnerType: 'Associates',
        itemCount,
        resources: ['itemInfo.title', 'images.primary.medium', 'offers.listings.price'],
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 401 || res.status === 403) {
      // 「アソシエイトは対象外」= 売上10件/30日の条件未達など。10分間は再試行しない
      backoffUntil = Date.now() + 10 * 60 * 1000;
      return { items: [], eligible: false };
    }
    if (!res.ok) return { items: [], eligible: false };

    const data = await res.json();
    return { items: parseItems(data), eligible: true };
  } catch {
    backoffUntil = Date.now() + 2 * 60 * 1000; // ネットワーク・トークン失敗は2分抑制
    return { items: [], eligible: false };
  }
}

// キー設定の検証用診断（管理者のみ /api/amazon?diag=1 から呼ぶ）。
// どの段階まで成功したかを真偽値・件数・HTTPステータスだけで返す（秘密情報は返さない）。
// 資格未達(401/403)とキー誤り(トークン401)を切り分けられるようにするのが目的。
export async function diagnoseAmazonApi(keyword = 'diaper') {
  const out = {
    configured: isAmazonApiConfigured(),
    tokenOk: false,
    tokenStatus: null,
    itemsOk: false,
    itemsStatus: null,
    eligible: false,
    itemCount: 0,
  };
  if (!out.configured) return out;

  // 診断は最新状態を見るためキャッシュ/バックオフを無視して実行
  let token;
  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'creatorsapi::default',
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5000),
    });
    out.tokenStatus = res.status;
    if (!res.ok) return out; // トークン失敗＝キーの値が誤り or リージョン不一致
    const data = await res.json();
    token = data.access_token;
    out.tokenOk = true;
  } catch (e) {
    out.tokenStatus = e?.name === 'TimeoutError' ? 'timeout' : 'error';
    return out;
  }

  try {
    const res = await fetch(`${API_BASE}/catalog/v1/searchItems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-marketplace': MARKETPLACE,
      },
      body: JSON.stringify({
        keywords: keyword,
        partnerTag: PARTNER_TAG,
        partnerType: 'Associates',
        itemCount: 1,
        resources: ['itemInfo.title', 'offers.listings.price'],
      }),
      signal: AbortSignal.timeout(6000),
    });
    out.itemsStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      out.itemsOk = true;
      out.eligible = true;
      out.itemCount = parseItems(data).length;
    }
    // 401/403 は「トークンは取れたが商品APIの資格未達」= 売上条件待ちの正常な休眠状態
  } catch (e) {
    out.itemsStatus = e?.name === 'TimeoutError' ? 'timeout' : 'error';
  }
  return out;
}
