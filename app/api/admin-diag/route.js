import { request as httpsRequest } from 'node:https';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { checkRateLimit } from '@/lib/rateLimit';
import { RAKUTEN_VERSIONS, searchUrl, isVersionError } from '@/src/lib/rakutenApi';

// =============================================
// 管理者用: 外部データ源の疎通診断
//
// 楽天APIは過去2回、別々の理由で止まっている（2026-05の旧ドメイン廃止、
// 2026-08-17のAPIバージョン20220601廃止）。どちらも症状は
// 「価格が更新されない」だけで、原因の切り分けにコード側の調査が要った。
// ブラウザから1クリックで原因と対処まで分かるようにする。
//
// 使い方: https://honestbaby-care.com/api/admin-diag?pass=（管理パスワード）
//         生JSONが欲しい場合は &format=json を付ける
//
// APIキーそのものは返さない（先頭数文字と長さだけ）。
// =============================================

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID || '';
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY || '';
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID || '';
const RAKUTEN_REFERER = process.env.RAKUTEN_REFERER || 'https://honestbaby-care.com';
const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID || process.env.VITE_YAHOO_CLIENT_ID || '';

const SHOPS = ['楽天市場', 'Yahoo!ショッピング', 'Amazon'];

// 値そのものは出さず「設定されているか・形式が合っているか」だけ見せる
function mask(v) {
  if (!v) return '（未設定）';
  return `${v.slice(0, 6)}…（全${v.length}文字）`;
}

function nodeHttpsGet(url) {
  return new Promise((resolve) => {
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
    req.on('error', (e) => resolve({ statusCode: 0, text: `接続エラー: ${e.message}` }));
    req.setTimeout(12000, () => { req.destroy(); resolve({ statusCode: 0, text: 'タイムアウト' }); });
    req.end();
  });
}

// 全バージョンの試行結果から「何をすれば直るか」を組み立てる。
// バージョン単位で見るのが重要: 廃止済みバージョンも資格情報エラーも
// 同じ 400 + wrong_parameter を返すため、1バージョンだけ見ると区別できない。
function diagnoseRakuten(attempts) {
  const okAttempt = attempts.find((a) => a.statusCode === 200);
  if (okAttempt) {
    return {
      ok: true,
      診断: `正常です（バージョン ${okAttempt.version} が有効）。`,
      対処: RAKUTEN_VERSIONS[0] === okAttempt.version
        ? 'ありません。'
        : `src/lib/rakutenApi.js の候補の先頭を ${okAttempt.version} にすると無駄な試行が減ります。`,
    };
  }

  if (!RAKUTEN_APP_ID) {
    return { ok: false, 診断: 'RAKUTEN_APP_ID が Vercel に設定されていません。', 対処: 'Vercel の Settings → Environment Variables に RAKUTEN_APP_ID を追加して再デプロイしてください。' };
  }
  if (!RAKUTEN_ACCESS_KEY) {
    return { ok: false, 診断: 'RAKUTEN_ACCESS_KEY が設定されていません。新・楽天APIは applicationId と accessKey の両方が必須です。', 対処: 'Vercel の環境変数に RAKUTEN_ACCESS_KEY（pk_ で始まる文字列）を追加して再デプロイしてください。' };
  }

  const anyForbidden = attempts.find((a) => a.statusCode === 403);
  if (anyForbidden) {
    return {
      ok: false,
      診断: `リクエスト元が許可されていません（送信Referer: ${RAKUTEN_REFERER}）。`,
      対処: '楽天ウェブサービスのアプリ設定「許可されたWebサイト」を https://honestbaby-care.com に合わせるか、環境変数 RAKUTEN_REFERER を登録済みURLに合わせてください。',
    };
  }
  if (attempts.some((a) => a.statusCode === 429)) {
    return { ok: false, 診断: 'レート制限に達しています。', 対処: '時間をおいて再確認してください。続く場合は同期の間隔を広げる必要があります。' };
  }

  // 候補バージョンが全滅 = バージョンの問題ではなく資格情報かアプリ設定の問題
  if (attempts.every((a) => isVersionError(a.statusCode, a.text))) {
    return {
      ok: false,
      診断: `試したすべてのバージョン（${attempts.map((a) => a.version).join(' / ')}）が「API Configuration not found」で拒否されました。バージョンの問題ではなく、アプリID・アクセスキー・アプリの有効期限のいずれかです。`,
      対処: '楽天ウェブサービスのアプリ一覧 https://webservice.rakuten.co.jp/app/list で、①アプリの有効期限が切れていないか（切れていれば延長ボタン）②楽天市場商品検索APIが利用可能か ③アプリIDとアクセスキーが同じアプリのものか（別アプリの組み合わせだとこのエラーになります）を確認してください。',
    };
  }

  return {
    ok: false,
    診断: `想定外のエラーです（${attempts.map((a) => `v${a.version}:HTTP${a.statusCode}`).join(', ')}）。`,
    対処: '下の 生レスポンス を確認してください。',
  };
}

// ショップごとに最新の記録日を1行だけ取る。
// 全件selectしてJS側で最大を取ると supabase-js の1000行上限に切られて
// 「更新が止まっている」と誤診するため、必ずショップ単位で order+limit(1) にする。
async function latestRecordedOn(shop) {
  const { data } = await supabaseServer
    .from('price_history')
    .select('recorded_on')
    .eq('shop_name', shop)
    .order('recorded_on', { ascending: false })
    .limit(1);
  return data?.[0]?.recorded_on || null;
}

export async function GET(request) {
  const limited = checkRateLimit(request, { limit: 10, windowMs: 5 * 60 * 1000, prefix: 'admin-diag' });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || searchParams.get('pass') !== expected) {
    return Response.json({ error: 'パスワードが正しくありません' }, { status: 401 });
  }

  // --- 楽天: バージョン候補を順に叩いて、どれが生きているか特定する（DBには書かない） ---
  const params = `applicationId=${encodeURIComponent(RAKUTEN_APP_ID)}`
    + `&accessKey=${encodeURIComponent(RAKUTEN_ACCESS_KEY)}`
    + `&keyword=${encodeURIComponent('紙おむつ')}&hits=1`
    + `&affiliateId=${encodeURIComponent(RAKUTEN_AFFILIATE_ID)}`;

  const attempts = [];
  for (const version of RAKUTEN_VERSIONS) {
    const { statusCode, text } = await nodeHttpsGet(searchUrl(version, params));
    attempts.push({ version, statusCode, text });
    if (statusCode === 200) break; // 通ったらそれ以上叩かない
  }

  const rakuten = {
    アプリID: mask(RAKUTEN_APP_ID),
    アプリIDの形式: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(RAKUTEN_APP_ID)
      ? 'UUID形式（新API用・OK）'
      : /^\d{19}$/.test(RAKUTEN_APP_ID) ? '数字19桁（旧API用のIDです。新APIでは使えません）' : '想定外の形式',
    アクセスキー: mask(RAKUTEN_ACCESS_KEY),
    アクセスキーの形式: RAKUTEN_ACCESS_KEY.startsWith('pk_') ? 'pk_ で始まる（OK）' : 'pk_ で始まっていません',
    送信Referer: RAKUTEN_REFERER,
    バージョン別結果: attempts.map((a) => `${a.version} → HTTP ${a.statusCode}`),
    ...diagnoseRakuten(attempts),
    生レスポンス: attempts.map((a) => `[${a.version}] ${String(a.text).slice(0, 200)}`).join('\n'),
  };

  // --- Yahoo ---
  let yahoo;
  if (!YAHOO_CLIENT_ID) {
    yahoo = { ok: false, 診断: 'YAHOO_CLIENT_ID が設定されていません。', 対処: 'Vercel の環境変数に追加してください。' };
  } else {
    try {
      const res = await fetch(
        'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch'
        + `?appid=${encodeURIComponent(YAHOO_CLIENT_ID)}&query=${encodeURIComponent('紙おむつ')}&results=1`
      );
      const text = await res.text();
      yahoo = {
        クライアントID: mask(YAHOO_CLIENT_ID),
        HTTPステータス: res.status,
        ok: res.ok,
        診断: res.ok ? '正常です。' : '取得に失敗しています。',
        対処: res.ok ? 'ありません。' : '下の 生レスポンス を確認してください。',
        生レスポンス: text.slice(0, 200),
      };
    } catch (e) {
      yahoo = { ok: false, 診断: `接続できませんでした: ${e.message}`, 対処: '時間をおいて再確認してください。' };
    }
  }

  // --- 実際に価格が記録できているか（APIが通っていても書けていなければ意味がない） ---
  const 価格記録状況 = {};
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  for (const shop of SHOPS) {
    try {
      const day = await latestRecordedOn(shop);
      if (!day) { 価格記録状況[shop] = '記録なし ⚠️'; continue; }
      const days = Math.round((Date.parse(today) - Date.parse(day)) / 86400000);
      価格記録状況[shop] = `最終記録 ${day}（${days}日前）${days <= 1 ? ' ✅' : ' ⚠️ 更新が止まっています'}`;
    } catch (e) {
      価格記録状況[shop] = `確認できませんでした: ${e.message}`;
    }
  }

  const 総合 = rakuten.ok && yahoo.ok
    ? '✅ 外部APIは両方とも正常です'
    : '⚠️ 問題があります。下の「対処」を確認してください';

  const result = { 総合, 楽天: rakuten, Yahoo: yahoo, 価格記録状況, 確認時刻: new Date().toISOString() };

  // 既定はHTML。Response.json() は charset を付けないため、
  // スマホのブラウザによっては日本語が文字化けして読めなかった。
  if (searchParams.get('format') === 'json') {
    return Response.json(result, {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  return new Response(renderHtml(result), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function section(title, obj) {
  const rows = Object.entries(obj)
    .filter(([k]) => k !== 'ok')
    .map(([k, v]) => {
      const val = Array.isArray(v) ? v.join('\n') : String(v);
      const cls = k === '診断' ? ' class="d"' : k === '対処' ? ' class="a"' : '';
      return `<tr><th>${esc(k)}</th><td${cls}><pre>${esc(val)}</pre></td></tr>`;
    })
    .join('');
  const badge = obj.ok === true ? '✅' : obj.ok === false ? '⚠️' : '';
  return `<h2>${badge} ${esc(title)}</h2><table>${rows}</table>`;
}

function renderHtml(r) {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>データ源の診断 | HonestBaby</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans",sans-serif;margin:0;padding:16px;background:#FAF8F6;color:#3D3535;line-height:1.6}
h1{font-size:18px;margin:0 0 4px}
h2{font-size:15px;margin:24px 0 8px;padding-bottom:6px;border-bottom:2px solid #EFE8E2}
.sum{font-size:15px;font-weight:700;padding:12px;border-radius:12px;background:#fff;border:1px solid #EFE8E2}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #EFE8E2}
th{text-align:left;padding:8px 10px;font-size:12px;color:#7A6E6E;width:34%;vertical-align:top;border-top:1px solid #F4EFEB;font-weight:700}
td{padding:8px 10px;font-size:13px;border-top:1px solid #F4EFEB;vertical-align:top}
tr:first-child th,tr:first-child td{border-top:none}
pre{margin:0;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
td.d pre{font-family:inherit;font-size:13px;font-weight:700}
td.a pre{font-family:inherit;font-size:13px;background:#FFF7E8;padding:8px;border-radius:8px;border:1px solid #F2E3C4}
.t{color:#9A8F8F;font-size:11px;margin-top:20px}
</style></head><body>
<h1>データ源の診断</h1>
<p class="sum">${esc(r.総合)}</p>
${section('楽天', r.楽天)}
${section('Yahoo!ショッピング', r.Yahoo)}
${section('価格記録の鮮度', r.価格記録状況)}
<p class="t">確認時刻: ${esc(r.確認時刻)} ／ 生JSONは末尾に <code>&amp;format=json</code> を付けてください</p>
</body></html>`;
}
