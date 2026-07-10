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

// --- 本体/付属品の誤マッチ防止 ---------------------------------------------
// Amazon検索は「最上位の出品」が本体とは限らず、本体の出品が無い商品では
// サンキャノピー・レインカバー等の付属品が最上位に来て、極端に安い価格が
// 「Amazonの本体価格」として表示されてしまう（例: ¥138,600のベビーカーに
// 対して付属品の¥6,600を表示）。sync-products の ACCESSORY_ONLY_KEYWORDS は
// 楽天/Yahooのseller選定にしか効かないため、Amazon専用の選定をここで行う。

// 「本体は含まれない」ことが明示された出品（常に除外）
const ACCESSORY_ONLY_PHRASES = [
  '本体は付属しません', '本体は含まれ', '本体別売', '本体なし', '本体は別売',
  '付属品のみ', '付属品単品', 'パーツのみ', '部品のみ', 'スペアのみ',
  '交換用のみ', '交換パーツのみ', 'カバーのみ', 'ケースのみ', '替えのみ',
];

// 付属品・周辺グッズを示す語。Amazonタイトルに含まれるのに、サイト側の
// 商品名に含まれない場合は「本体ではなく付属品」とみなして除外する
// （商品自体がカバー等の付属品なら商品名側にも同じ語があるので通る）。
const ACCESSORY_WORDS = [
  'カバー', 'キャノピー', 'ホルダー', 'フック', 'ライナー', 'フットマフ',
  'アダプター', 'アタッチメント', 'オーガナイザー', 'ポーチ', 'ケース',
  'クッション', 'パッド', 'マット', '蚊帳', 'モスキートネット', 'ボード',
  'ストラップ', 'スタンド', '収納バッグ', 'トラベルバッグ', '日よけ',
  '専用', '交換用', '替え', 'スペア', '付属品', 'パーツ', '部品', '互換',
];

// 基準価格（楽天/Yahooの既知最安値）に対する許容レンジ。
// 下限35%: 付属品は本体の1〜2割程度の価格帯なのでここで確実に落ちる。
// 正規のセールでも他モール最安の35%未満になることはまず無い。
// 上限4倍: 複数個セット等の別バリエーション誤マッチを防ぐ。
const PRICE_RATIO_MIN = 0.35;
const PRICE_RATIO_MAX = 4;

// 検索結果から「本体」とみなせる最初の1件を返す（無ければ null）。
// productName: サイト側の商品名（付属品語の照合に使う）
// referencePrice: 楽天/Yahoo等の既知最安値（0なら価格チェックはスキップ）
export function selectAmazonItem(items, { productName = '', referencePrice = 0 } = {}) {
  const pname = String(productName || '');
  const ref = Number(referencePrice) || 0;
  return (
    (items || []).find((it) => {
      const title = String(it?.name || '');
      const price = Number(it?.price) || 0;
      if (!(price > 0)) return false;
      if (ACCESSORY_ONLY_PHRASES.some((kw) => title.includes(kw))) return false;
      if (ACCESSORY_WORDS.some((kw) => title.includes(kw) && !pname.includes(kw))) return false;
      if (ref > 0 && (price < ref * PRICE_RATIO_MIN || price > ref * PRICE_RATIO_MAX)) return false;
      return true;
    }) || null
  );
}

// キーワードでAmazon商品を検索。戻り値 { items, eligible }。
// 既定5件: 最上位が付属品でも selectAmazonItem が後続候補から本体を選べるようにする。
export async function searchAmazonItems(keyword, itemCount = 5) {
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
        searchIndex: 'All',
        itemCount,
        partnerTag: PARTNER_TAG,
        partnerType: 'Associates',
        marketplace: MARKETPLACE,
        // 正しいenum値（lowerCamelCase・価格はoffersV2）。診断のitemsErrorで確定
        resources: ['itemInfo.title', 'offersV2.listings.price'],
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
        searchIndex: 'All',
        itemCount: 1,
        partnerTag: PARTNER_TAG,
        partnerType: 'Associates',
        marketplace: MARKETPLACE,
        resources: ['itemInfo.title', 'offersV2.listings.price'],
      }),
      signal: AbortSignal.timeout(6000),
    });
    out.itemsStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      out.itemsOk = true;
      out.eligible = true;
      out.itemCount = parseItems(data).length;
    } else {
      // 非2xxはAmazonのエラー本文を診断に含める（400の原因＝リクエスト形式か資格かを切り分ける）
      out.itemsError = (await res.text().catch(() => '')).slice(0, 1500);
    }
  } catch (e) {
    out.itemsStatus = e?.name === 'TimeoutError' ? 'timeout' : 'error';
  }
  return out;
}
