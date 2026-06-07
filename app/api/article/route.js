import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder_key'
);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // headings
    if (/^### /.test(line)) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (/^## /.test(line)) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (/^# /.test(line)) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }

    // list items
    if (/^- /.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }

    // horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<hr>');
      continue;
    }

    // blank line
    if (line.trim() === '') {
      if (inList) { out.push('</ul>'); inList = false; }
      continue;
    }

    if (inList) { out.push('</ul>'); inList = false; }
    out.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inList) out.push('</ul>');
  return out.join('\n');
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#FF6B6B;font-weight:700;text-decoration:underline;" target="_blank" rel="noopener">$1</a>');
}

function notFoundHtml() {
  return `<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8"><title>記事が見つかりません | HonestBaby</title>
<meta http-equiv="refresh" content="3;url=https://honestbaby-care.com/">
</head><body style="font-family:sans-serif;text-align:center;padding:4rem;background:#FFF5E4;">
<h2 style="color:#1A1A2E;">記事が見つかりませんでした</h2>
<p style="color:#888;">3秒後にトップページへ移動します。</p>
</body></html>`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) {
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  const { data: article, error } = await supabase
    .from('articles')
    .select('title, meta_description, content, published')
    .eq('slug', slug)
    .single();

  if (error || !article || !article.published) {
    return new Response(notFoundHtml(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const title = escapeHtml(article.title);
  const desc = escapeHtml(article.meta_description || article.title);
  const bodyHtml = markdownToHtml(article.content);

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | HonestBaby</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title} | HonestBaby">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://honestbaby-care.com/article/${escapeHtml(slug)}">
<meta property="og:image" content="https://honestbaby-care.com/logo.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://honestbaby-care.com/article/${escapeHtml(slug)}">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#FFF5E4;color:#1A1A2E;font-family:'Noto Sans JP','Hiragino Sans',sans-serif;line-height:1.8;-webkit-font-smoothing:antialiased}
header{background:#fff;border-bottom:2px solid #FF6B6B;padding:1rem 1.5rem;display:flex;align-items:center;gap:1rem}
header a{color:#FF6B6B;text-decoration:none;font-weight:900;font-size:1.1rem;letter-spacing:-0.02em}
.breadcrumb{font-size:0.7rem;color:#A5A19E;margin-top:0.25rem}
main{max-width:720px;margin:0 auto;padding:2rem 1.5rem 4rem}
h1{font-size:1.6rem;font-weight:900;color:#1A1A2E;margin:0 0 1rem;line-height:1.3}
h2{font-size:1.25rem;font-weight:900;color:#1A1A2E;margin:2rem 0 0.75rem;padding-bottom:0.4rem;border-bottom:2px solid #FF6B6B}
h3{font-size:1rem;font-weight:700;color:#1A1A2E;margin:1.5rem 0 0.5rem}
p{margin:0.75rem 0;font-size:0.95rem;color:#3A3A3A}
ul{margin:0.75rem 0 0.75rem 1.5rem}
li{margin:0.4rem 0;font-size:0.95rem;color:#3A3A3A}
strong{font-weight:700;color:#1A1A2E}
code{background:#F4EFEB;padding:0.1em 0.4em;border-radius:4px;font-size:0.85em;font-family:monospace}
hr{border:none;border-top:1px solid #F4EFEB;margin:2rem 0}
.cta{background:#FF6B6B;color:#fff;display:block;text-align:center;padding:1.2rem 2rem;border-radius:2rem;text-decoration:none;font-weight:900;font-size:1rem;margin:3rem 0 1rem;box-shadow:0 4px 12px rgba(255,107,107,0.3);transition:transform 0.15s}
.cta:hover{transform:scale(1.02)}
footer{text-align:center;padding:2rem;font-size:0.75rem;color:#A5A19E;border-top:1px solid #F4EFEB}
</style>
</head>
<body>
<header>
<div>
<a href="https://honestbaby-care.com/">🍼 HonestBaby</a>
<div class="breadcrumb">ベビー用品比較 &rsaquo; 記事・ガイド &rsaquo; ${title}</div>
</div>
</header>
<main>
<h1>${title}</h1>
${bodyHtml}
<a class="cta" href="https://honestbaby-care.com/">HonestBaby で商品を比較・検索する →</a>
</main>
<footer>© HonestBaby | <a href="https://honestbaby-care.com/privacy" style="color:#A5A19E">プライバシーポリシー</a></footer>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
