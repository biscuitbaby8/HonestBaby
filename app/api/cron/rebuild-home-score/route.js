import { createClient } from '@supabase/supabase-js';
import { demandScore, passesPickupGate, diversify } from '@/src/lib/products';
import { isProductIndexable } from '@/src/lib/seo';

// =============================================
// ホームの並び順スコアを日次で再計算する（Vercel Cron）
//
// 並び順の計算をブラウザ任せにしていると、SSRホーム（クローラーが最初に
// 読むHTML）に一切効かない。ここで products.home_score / home_rank を
// 更新し、SSR・SPAの両方が同じ順序を使えるようにする。
//
// L1（需要スコア）は src/lib/products.js の demandScore をそのまま呼ぶ。
// SQLで書き直すと式が二重管理になり、片方だけ直して食い違うため。
//
// L2（HonestBaby独自の加点）はここでしか作れない。価格履歴の集計が要る。
// なお当初計画にあった「2モール以上で比較できる」加点は不採用にした。
// 実測で該当が3,840件中65件(1.7%)しかなく、順位を動かす力が無いため。
// =============================================

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'
);

// L2の加点幅。L1は概ね 0〜1 に収まるので、加点は最大でも 0.12 に抑える。
// 「買い時だから」だけで無関係な商品が上位に来ると、ホームの意味が変わってしまう。
const BONUS_PRICE_DROP = 0.06;   // 直近14日で値下がりした
const BONUS_AT_LOW     = 0.06;   // 90日の最安値圏にいる

// 価格履歴から「値下がり」「底値圏」を判定する。
// 同一ショップ内での比較にする。全ショップの最安値で比べると、
// 途中で別の安い店がマッチしただけのものを値下がりと誤認するため。
async function loadPriceSignals() {
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const byKey = new Map(); // `${product_id}|${shop_name}` -> [{d, price}]

  // price_history は数万行あるので範囲指定でページングして読む
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('price_history')
      .select('product_id, shop_name, price, recorded_on')
      .gte('recorded_on', since)
      .order('recorded_on', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) {
      const price = Number(r.price);
      if (!(price > 0)) continue;
      const key = `${r.product_id}|${r.shop_name}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ d: r.recorded_on, price });
    }
    if (data.length < PAGE) break;
  }

  const signals = new Map(); // product_id -> { dropped, atLow }
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

  for (const [key, rows] of byKey) {
    const productId = key.slice(0, key.indexOf('|'));
    if (rows.length < 2) continue;
    const latest = rows[rows.length - 1];
    const prices = rows.map((r) => r.price);
    const min90 = Math.min(...prices);
    const max90 = Math.max(...prices);
    const days = new Set(rows.map((r) => r.d)).size;

    // 14日以上前の記録のうち最も新しいものと比べる
    const older = rows.filter((r) => r.d <= cutoff);
    const base = older.length > 0 ? older[older.length - 1].price : null;

    // 下落率60%超は別バリアントの取り違えを疑い、加点しない（/price と同じ基準）
    const dropped = base != null && latest.price < base * 0.97 && latest.price > base * 0.4;

    // 「底値圏」は値動きが実際にある商品に限る。
    // 単純に latest <= min90*1.02 とすると、価格履歴がまだ47日ぶんしかなく
    // ほとんどの商品が動いていないため、実測で4,700件中4,589件(97.6%)が
    // 該当してしまい、全員に同じ加点が入るだけで順位が動かなかった。
    // 記録10日以上かつ変動幅5%以上に絞ると43件(0.9%)になり、指標として機能する。
    const atLow = days >= 10 && max90 >= min90 * 1.05 && latest.price <= min90 * 1.02;

    const cur = signals.get(productId) || { dropped: false, atLow: false, days: 0 };
    signals.set(productId, {
      dropped: cur.dropped || dropped,
      atLow: cur.atLow || atLow,
      // 複数ショップぶんの記録がある場合は最も長い方を採る
      days: Math.max(cur.days, days),
    });
  }
  return signals;
}

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log = [];
  try {
    // 1) 対象商品を全件読む（1000行上限があるのでページング）
    const products = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, category, rating, reviews_count, popularity_rank, image_url, shops:shops_prices(lowest_price)')
        .or('is_blocked.is.null,is_blocked.eq.false')
        .is('canonical_id', null)
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      products.push(...data);
      if (data.length < PAGE) break;
    }
    log.push(`対象商品: ${products.length}件`);

    // 2) 価格シグナル
    let signals = new Map();
    try {
      signals = await loadPriceSignals();
      log.push(`価格シグナルを算出: ${signals.size}件`);
    } catch (e) {
      // 価格履歴が読めなくてもL1だけで順位は付けられる。スコア更新自体は止めない。
      log.push(`⚠️ 価格シグナルの算出に失敗（L1のみで継続）: ${e.message}`);
    }

    // 3) スコア計算。demandScore はクライアントと同じ関数。
    //    クライアント側の形（reviewsCount / image）に合わせてから渡す。
    let dropped = 0;
    let atLow = 0;
    let indexableCount = 0;
    const scored = products.map((p) => {
      const shaped = {
        ...p,
        rating: Number(p.rating) || 0,
        reviewsCount: p.reviews_count,
        image: p.image_url,
        shops: (p.shops || []).map((s) => ({ lowestPrice: s.lowest_price })),
      };
      let score = demandScore(shaped);
      const sig = signals.get(p.id);
      if (sig?.dropped) { score += BONUS_PRICE_DROP; dropped++; }
      if (sig?.atLow) { score += BONUS_AT_LOW; atLow++; }
      // 足切りを通らない商品は必ず後ろへ回す（ホーム上位の質を守る）
      if (!passesPickupGate(shaped)) score -= 1;
      // 検索エンジンに見せてよいページか（SEO改善 02）。
      // ページ表示のたびに履歴を集計しないよう、ここで判定して列に持たせる。
      const hasPrice = (p.shops || []).some((s) => Number(s.lowest_price) > 0);
      const indexable = isProductIndexable(shaped, {
        historyDays: sig?.days || 0,
        hasPrice,
      });
      if (indexable) indexableCount++;

      // diversify はブランド判定に brand / name を使うのでそのまま渡す
      return { id: p.id, name: p.name, brand: p.brand, category: p.category, score, indexable };
    });
    log.push(`値下がり加点: ${dropped}件 / 底値圏加点: ${atLow}件`);
    log.push(`検索エンジンに見せる商品ページ: ${indexableCount}/${products.length}件`);

    scored.sort((a, b) => b.score - a.score);

    // home_rank にも多様性を効かせる。SSRホームは home_rank の上位24件を
    // そのまま出すため、スコア順のままだと重み1.30の「おむつ」だけで
    // 上位が埋まる（実測で上位14件中9件がおむつだった）。
    const ordered = diversify(scored);

    // 4) 書き戻し。upsert だと NOT NULL 列に引っかかるので個別 update を分割並列で。
    const CHUNK = 100;
    let updated = 0;
    for (let i = 0; i < ordered.length; i += CHUNK) {
      const chunk = ordered.slice(i, i + CHUNK);
      const results = await Promise.all(
        chunk.map((s, j) =>
          supabase.from('products')
            .update({
              home_score: Number(s.score.toFixed(6)),
              home_rank: i + j + 1,
              is_indexable: s.indexable,
            })
            .eq('id', s.id)
        )
      );
      updated += results.filter((r) => !r.error).length;
      const firstErr = results.find((r) => r.error);
      if (firstErr) log.push(`⚠️ 更新エラー: ${firstErr.error.message}`);
    }
    log.push(`✅ 更新: ${updated}/${ordered.length}件`);

    return Response.json({
      ok: true,
      total: ordered.length,
      updated,
      indexable: indexableCount,
      top10: ordered.slice(0, 10).map((s, i) => ({
        rank: i + 1,
        category: s.category,
        name: String(s.name).slice(0, 36),
        score: Number(s.score.toFixed(4)),
      })),
      log,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    log.push(`❌ ${e.message}`);
    return Response.json({ ok: false, error: e.message, log }, { status: 500 });
  }
}
