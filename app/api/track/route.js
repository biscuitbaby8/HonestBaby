import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimit';

// =============================================
// 商品の表示・クリックを自前DBに記録する（Phase 4）
//
// ランキングの係数は今すべて推測値で、実際にどれが押されたかで
// 裏を取れていない。GA4へは既に送っているが、GA4のデータは
// ランキング計算から参照できないため、ここで自前に貯める。
//
// 設計上の約束:
// - 個人情報を受け取らない。session_id は端末が生成する乱数のみ。
// - 書き込み専用。読み出しのAPIは用意しない（RLSでも拒否している）。
// - 失敗してもクライアントは無視する。計測のために表示を壊さない。
// =============================================

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'
);

const EVENT_TYPES = new Set(['impression', 'click', 'outbound']);
const SHOPS = new Set(['rakuten', 'yahoo', 'amazon', 'iherb']);
const SURFACES = new Set(['home', 'category', 'search', 'product', 'unknown']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EVENTS = 60;

// 外部から来た値は一切信用せず、想定内の形だけを通す。
function sanitize(raw, sessionId) {
  if (!raw || typeof raw !== 'object') return null;
  const productId = String(raw.productId || '');
  if (!UUID_RE.test(productId)) return null;
  const eventType = String(raw.eventType || '');
  if (!EVENT_TYPES.has(eventType)) return null;

  const surface = SURFACES.has(raw.surface) ? raw.surface : 'unknown';
  const position = Number.isInteger(raw.position) && raw.position > 0 && raw.position <= 5000
    ? raw.position
    : null;
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

export async function POST(request) {
  // 1IPあたり1分30回。1回で最大60件送れるので通常利用には十分。
  const limited = checkRateLimit(request, { limit: 30, windowMs: 60 * 1000, prefix: 'track' });
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  // session_id はクライアント生成の乱数。長さだけ検証し、中身は問わない。
  const sessionId = String(body?.sessionId || '');
  if (sessionId.length < 8 || sessionId.length > 64) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const list = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS) : [];
  const rows = list.map((e) => sanitize(e, sessionId)).filter(Boolean);
  if (rows.length === 0) return Response.json({ ok: true, saved: 0 });

  // (product_id, session_id, event_type) に一意制約があり、
  // 同じ人の重複は無視される。ignoreDuplicates で衝突をエラーにしない。
  const { error } = await supabase
    .from('product_events')
    .upsert(rows, { onConflict: 'product_id,session_id,event_type', ignoreDuplicates: true });

  if (error) {
    // クライアントには詳細を返さない（テーブル構造の推測材料にしない）
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true, saved: rows.length });
}
