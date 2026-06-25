// =============================================
// 同一オリジン画像プロキシ
// 楽天・Yahoo の商品画像をサーバー側で取得して配信する。
//
// なぜ必要か:
//  - 外部CDNへ直接 <img src> でホットリンクすると、CDN側の制限や
//    画像サイズコードの当て推量（/i/j/・/i/k/ 等）で「一部表示されない」
//    「画質が荒い」問題が起き続けてきた（過去に複数回発生）。
//  - サーバー側で「高画質URL→存在確認→ダメなら確実なURL」とフォールバック
//    してから配信すれば、ブラウザは常に有効な画像を1枚だけ受け取れる。
//  - 同一オリジン(/api/img)なので CSP の img-src 'self' で常に許可される。
//
// 安全策: どの候補も取得できなければ元URLへ302リダイレクトするため、
// 最悪でも「従来どおり元画像を直接表示」に戻るだけで、現状より悪化しない。
// =============================================

export const runtime = 'nodejs';

// SSRF防止: 取得を許可するホスト（楽天サムネイル / Yahoo商品画像）のみ。
const ALLOWED_HOST_RE = [/(^|\.)yimg\.jp$/i, /(^|\.)rakuten\.co\.jp$/i];

function isAllowed(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_HOST_RE.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

// 画質優先で取得を試す候補URL一覧を作る（先頭から順に存在確認する）。
// v=card は一覧サムネ用（やや小さめ・軽い）、v=hero は詳細表示用（最大）。
function buildCandidates(rawUrl, variant) {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname;

    // --- Yahoo (item-shopping.c.yimg.jp/i/{size}/...) ---
    // サイズコード: g=確実に存在する中サイズ / j=API(exImage)が返す大きい画像。
    // j は存在しないショップもあるため「j→g」の順で確認し、確実なgへ必ず戻す。
    if (host.includes('yimg.jp')) {
      const big = rawUrl.replace(/\/i\/[a-z]\//, '/i/j/');
      const med = rawUrl.replace(/\/i\/[a-z]\//, '/i/g/');
      // 一覧サムネでも画質改善のため大きい方を優先（失敗時はgへ）。
      return Array.from(new Set([big, med, rawUrl]));
    }

    // --- 楽天 (thumbnail.image.rakuten.co.jp/...?_ex=WxH) ---
    // ?_ex= はCDNが元画像から動的リサイズするため任意サイズが安全。
    if (host.includes('rakuten.co.jp')) {
      const base = rawUrl.split('?_ex=')[0].split('?')[0];
      const size = variant === 'hero' ? '1000x1000' : '600x600';
      return Array.from(new Set([`${base}?_ex=${size}`, `${base}?_ex=600x600`, rawUrl]));
    }

    return [rawUrl];
  } catch {
    return [rawUrl];
  }
}

async function fetchImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // 一部CDNはUA無しを弾くため、ブラウザ相当のUAを送る。
        'User-Agent':
          'Mozilla/5.0 (compatible; HonestBabyImageProxy/1.0; +https://honestbaby-care.com)',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Yahoo等が「画像なし」を200+小さなダミー画像で返すケース(ソフト404)を弾く。
    if (buf.byteLength < 1000) return null;
    return { buf, contentType: ct };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get('url');
  const variant = searchParams.get('v') === 'hero' ? 'hero' : 'card';

  if (!src || !isAllowed(src)) {
    return new Response('Bad Request', { status: 400 });
  }

  for (const candidate of buildCandidates(src, variant)) {
    const img = await fetchImage(candidate);
    if (img) {
      return new Response(img.buf, {
        status: 200,
        headers: {
          'Content-Type': img.contentType,
          // 同一画像は長期キャッシュ（Vercel Edge/CDNが関数を再呼び出ししない）。
          'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
  }

  // すべて失敗 → 元URLへリダイレクト（従来動作に安全フォールバック）。
  return Response.redirect(src, 302);
}
