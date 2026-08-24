import { request as httpsRequest } from 'node:https';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { checkRateLimit } from '@/lib/rateLimit';

// =============================================
// 管理者用: 外部データ源の疎通診断
//
// 楽天APIは過去に2回、原因の違う理由で止まっている（2026-02の旧APIドメイン
// 廃止、2026-08の資格情報エラー）。そのたびに「価格が更新されない」という
// 症状だけが見えて原因が分からない状態になっていたので、
// ブラウザから1クリックで生のエラーと対処法まで確認できるようにする。
//
// 使い方: https://honestbaby-care.com/api/admin-diag?pass=（管理パスワード）
//
// APIキーそのものは返さない（先頭数文字と長さだけ）。
// =============================================

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID || '';
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY || '';
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID || '';
const RAKUTEN_REFERER = process.env.RAKUTEN_REFERER || 'https://honestbaby-care.com';
const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID || process.env.VITE_YAHOO_CLIENT_ID || '';

// 値そのものは出さず「設定されているか・形式が合っているか」だけ見せる
function mask(v) {
  if (!v) return '（未設定）';
  return `${v.slice(0, 6)}…（全${v.length}文字）`;
}

function nodeHttpsGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: RAKUTEN_REFERER, Origin: RAKUTEN_REFERER },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ statusCode: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(new Error('タイムアウト')); });
    req.end();
  });
}

// 楽天APIの生レスポンスから「何をすれば直るか」を日本語で組み立てる。
// エラーコードの意味は楽天ウェブサービスの仕様に対応させている。
function diagnoseRakuten(statusCode, text) {
  if (statusCode === 200) return { ok: true, 診断: '正常です。' };

  const body = (text || '').slice(0, 400);
  const has = (kw) => body.includes(kw);

  if (!RAKUTEN_APP_ID) {
    return { ok: false, 診断: 'RAKUTEN_APP_ID が Vercel に設定されていません。', 対処: 'Vercel の Settings → Environment Variables に RAKUTEN_APP_ID を追加してください。' };
  }
  if (!RAKUTEN_ACCESS_KEY) {
    return { ok: false, 診断: 'RAKUTEN_ACCESS_KEY が Vercel に設定されていません。新・楽天APIは applicationId と accessKey の両方が必須です。', 対処: 'Vercel の Settings → Environment Variables に RAKUTEN_ACCESS_KEY（pk_ で始まる文字列）を追加して再デプロイしてください。' };
  }
  if (has('wrong_parameter') || has('must be present')) {
    return {
      ok: false,
      診断: 'applicationId か accessKey のどちらかが空・または形式違いとして扱われています。',
      対処: '楽天ウェブサービスのアプリ情報画面で、アプリID（UUID形式）とアクセスキー（pk_ で始まる）を再確認し、Vercel の環境変数を更新して再デプロイしてください。値の前後に空白や改行が混ざっていないかも確認してください。',
    };
  }
  if (has('API Configuration not found') || has('not_found')) {
    return {
      ok: false,
      診断: 'このアプリIDに対して、呼び出そうとしているAPIが有効化されていません（またはアプリが削除されています）。',
      対処: '楽天ウェブサービスの管理画面で対象アプリを開き、「楽天市場商品検索API」が利用可能な状態か確認してください。アプリが失効している場合は新規作成し、新しいアプリID／アクセスキーを Vercel に設定してください。',
    };
  }
  if (statusCode === 403) {
    return {
      ok: false,
      診断: `リクエスト元が許可されていません（Referer/Origin: ${RAKUTEN_REFERER}）。`,
      対処: '楽天ウェブサービスのアプリ設定にある「アプリURL」を https://honestbaby-care.com に合わせるか、環境変数 RAKUTEN_REFERER を登録済みURLに合わせてください。',
    };
  }
  if (statusCode === 429) {
    return { ok: false, 診断: 'レート制限に達しています。', 対処: '時間をおいて再確認してください。継続する場合は同期の間隔を広げる必要があります。' };
  }
  return { ok: false, 診断: `想定外のエラー（HTTP ${statusCode}）です。`, 対処: '下の 生レスポンス を確認してください。' };
}

export async function GET(request) {
  const limited = checkRateLimit(request, { limit: 10, windowMs: 5 * 60 * 1000, prefix: 'admin-diag' });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || searchParams.get('pass') !== expected) {
    return Response.json({ error: 'パスワードが正しくありません' }, { status: 401 });
  }

  // --- 楽天: 実際に1回だけ検索APIを叩く（DBには何も書かない） ---
  let rakuten;
  try {
    const url = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601'
      + `?applicationId=${encodeURIComponent(RAKUTEN_APP_ID)}`
      + `&accessKey=${encodeURIComponent(RAKUTEN_ACCESS_KEY)}`
      + `&keyword=${encodeURIComponent('紙おむつ')}&hits=1`
      + `&affiliateId=${encodeURIComponent(RAKUTEN_AFFILIATE_ID)}`;
    const { statusCode, text } = await nodeHttpsGet(url);
    rakuten = {
      HTTPステータス: statusCode,
      アプリID: mask(RAKUTEN_APP_ID),
      アプリIDの形式: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(RAKUTEN_APP_ID)
        ? 'UUID形式（新API用・OK）'
        : /^\d{19}$/.test(RAKUTEN_APP_ID) ? '数字19桁（旧API用のIDです。新APIでは使えません）' : '想定外の形式',
      アクセスキー: mask(RAKUTEN_ACCESS_KEY),
      アクセスキーの形式: RAKUTEN_ACCESS_KEY.startsWith('pk_') ? 'pk_ で始まる（OK）' : 'pk_ で始まっていません',
      送信Referer: RAKUTEN_REFERER,
      ...diagnoseRakuten(statusCode, text),
      生レスポンス: (text || '').slice(0, 400),
    };
  } catch (e) {
    rakuten = { HTTPステータス: null, ok: false, 診断: `接続できませんでした: ${e.message}`, 対処: '時間をおいて再確認してください。' };
  }

  // --- Yahoo: 同じく1回だけ ---
  let yahoo;
  try {
    if (!YAHOO_CLIENT_ID) {
      yahoo = { ok: false, 診断: 'YAHOO_CLIENT_ID が設定されていません。' };
    } else {
      const res = await fetch(
        'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch'
        + `?appid=${encodeURIComponent(YAHOO_CLIENT_ID)}&query=${encodeURIComponent('紙おむつ')}&results=1`
      );
      const text = await res.text();
      yahoo = {
        HTTPステータス: res.status,
        クライアントID: mask(YAHOO_CLIENT_ID),
        ok: res.ok,
        診断: res.ok ? '正常です。' : '取得に失敗しています。',
        生レスポンス: text.slice(0, 300),
      };
    }
  } catch (e) {
    yahoo = { ok: false, 診断: `接続できませんでした: ${e.message}` };
  }

  // --- 実際に価格が記録できているか（APIが通っていても書けていなければ意味がない） ---
  let 記録状況 = {};
  try {
    const { data } = await supabaseServer
      .from('price_history')
      .select('shop_name, recorded_on')
      .gte('recorded_on', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
    const latest = {};
    for (const r of data || []) {
      if (!latest[r.shop_name] || r.recorded_on > latest[r.shop_name]) latest[r.shop_name] = r.recorded_on;
    }
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    for (const [shop, day] of Object.entries(latest)) {
      const days = Math.round((Date.parse(today) - Date.parse(day)) / 86400000);
      記録状況[shop] = `最終記録 ${day}（${days}日前）${days <= 1 ? ' ✅' : ' ⚠️ 更新が止まっています'}`;
    }
    for (const shop of ['楽天市場', 'Yahoo!ショッピング', 'Amazon']) {
      if (!記録状況[shop]) 記録状況[shop] = '直近30日の記録なし ⚠️';
    }
  } catch (e) {
    記録状況 = { エラー: e.message };
  }

  const 総合 = rakuten.ok && yahoo.ok ? '✅ 外部APIは両方とも正常です' : '⚠️ 問題があります。下の「対処」を確認してください';

  return Response.json(
    { 総合, 楽天: rakuten, Yahoo: yahoo, 価格記録状況: 記録状況, 確認時刻: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
