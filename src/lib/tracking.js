// 商品の表示・クリックを自前DBに記録するクライアント（Phase 4）
//
// 目的はランキング係数の裏取り。今の係数（満足度0.45 / レビュー数0.35 /
// モール人気順0.20、カテゴリ重み、月齢ブースト）はすべて推測値で、
// 実際にどれが押されたかを見ていない。
//
// 守ること:
// - 表示を絶対に壊さない。失敗しても握りつぶす。
// - 個人情報を送らない。session_id は端末生成の乱数のみ。
// - リクエストをまとめる。カード1枚ごとに通信しない。

const ENDPOINT = '/api/track';
const SESSION_KEY = 'honestBabySid';
const FLUSH_MS = 4000;
const MAX_BATCH = 60;

let queue = [];
let timer = null;
// 同じ商品×種類は1セッション1回だけ送る（サーバー側にも一意制約がある）
const sent = new Set();

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

// 端末ごとの乱数。ログイン情報とも広告IDとも紐づかない。
// 同じ人の重複表示を数えないためだけに使う。
function sessionId() {
  if (!isBrowser()) return null;
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = (crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`)
        .replace(/-/g, '')
        .slice(0, 32);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    // プライベートブラウジング等で localStorage が使えない場合は計測しない
    return null;
  }
}

function flush(useBeacon = false) {
  if (timer) { clearTimeout(timer); timer = null; }
  if (queue.length === 0) return;

  const sid = sessionId();
  if (!sid) { queue = []; return; }

  const payload = JSON.stringify({ sessionId: sid, events: queue.slice(0, MAX_BATCH) });
  queue = queue.slice(MAX_BATCH);

  try {
    // ページ離脱時は fetch が中断されるため sendBeacon を使う
    if (useBeacon && navigator?.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => { /* 計測の失敗で画面を壊さない */ });
  } catch {
    /* noop */
  }
}

function enqueue(event) {
  if (!isBrowser()) return;
  const key = `${event.eventType}:${event.productId}`;
  if (sent.has(key)) return;
  sent.add(key);

  queue.push(event);
  if (queue.length >= MAX_BATCH) { flush(); return; }
  if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
}

export function trackImpression(productId, { surface = 'home', position = null } = {}) {
  enqueue({ productId, eventType: 'impression', surface, position });
}

export function trackClick(productId, { surface = 'home', position = null } = {}) {
  enqueue({ productId, eventType: 'click', surface, position });
  // クリックは離脱を伴うことが多いので、溜めずにすぐ送る
  flush();
}

export function trackOutbound(productId, shop, { surface = 'product' } = {}) {
  enqueue({ productId, eventType: 'outbound', surface, shop });
  flush(true);
}

// 離脱時に取りこぼしを送る。visibilitychange は
// モバイルのタブ切り替え・アプリ切り替えでも発火する（pagehideより確実）。
export function installTrackingFlush() {
  if (!isBrowser()) return () => {};
  const onHide = () => { if (document.visibilityState === 'hidden') flush(true); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', () => flush(true));
  return () => document.removeEventListener('visibilitychange', onHide);
}
