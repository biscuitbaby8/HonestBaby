import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.redirect(302, '/');

  const { data: p } = await supabase
    .from('products')
    .select('name, image_url, category')
    .eq('id', id)
    .single();

  if (!p) return res.redirect(302, '/');

  const title = escapeHtml(`${p.name} | HonestBaby`);
  const desc = escapeHtml(`${p.category}の価格比較・口コミ。ママパパのリアルなレビューと最安値をチェック。`);
  const image = escapeHtml(p.image_url || 'https://honestbaby-care.com/logo.png');
  const url = escapeHtml(`https://honestbaby-care.com/product/${id}`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.send(`<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="product">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0;url=${url}">
</head><body>リダイレクト中...</body></html>`);
}
