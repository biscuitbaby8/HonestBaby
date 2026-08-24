// /api/track が受け取るイベントの検証。
// 外部から任意のJSONが飛んでくる口なので、想定内の形だけを通す。
// ルート側に置くと単体テストから読み込めない（@/ エイリアスが解決できない）ため
// 依存の無いモジュールとして切り出している。

export const EVENT_TYPES = new Set(['impression', 'click', 'outbound']);
export const SHOPS = new Set(['rakuten', 'yahoo', 'amazon', 'iherb']);
export const SURFACES = new Set(['home', 'category', 'search', 'product', 'unknown']);
export const MAX_EVENTS = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 1件のイベントを検証して、DBに入れられる形に正規化する。
 * 通せない場合は null を返す。
 * session_id は必ずサーバー側で決めた値を使う（クライアント指定は無視）。
 */
export function sanitizeEvent(raw, sessionId) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const productId = String(raw.productId || '');
  if (!UUID_RE.test(productId)) return null;

  const eventType = String(raw.eventType || '');
  if (!EVENT_TYPES.has(eventType)) return null;

  const surface = SURFACES.has(raw.surface) ? raw.surface : 'unknown';
  const position =
    Number.isInteger(raw.position) && raw.position > 0 && raw.position <= 5000
      ? raw.position
      : null;
  // shop は outbound のときだけ意味を持つ
  const shop = eventType === 'outbound' && SHOPS.has(raw.shop) ? raw.shop : null;

  return {
    product_id: productId,
    event_type: eventType,
    surface,
    position,
    shop,
    session_id: sessionId,
  };
}

/** session_id は端末生成の乱数。長さだけ検証し、中身は問わない。 */
export function isValidSessionId(sid) {
  return typeof sid === 'string' && sid.length >= 8 && sid.length <= 64;
}
