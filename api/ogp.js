import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CAT_META = {
  'おむつ':     { title: 'おむつ比較・おすすめランキング | HonestBaby', desc: 'テープ・パンツ・布おむつをパパママの口コミと価格で徹底比較。' },
  'ベビーカー': { title: 'ベビーカー比較・おすすめランキング | HonestBaby', desc: 'A型・B型・バギー・二人乗りをタイプ別に徹底比較。最安値もチェック。' },
  '抱っこ紐':   { title: '抱っこ紐比較・おすすめランキング | HonestBaby', desc: 'エルゴ・コニー・スリングなど人気ブランドを口コミ・価格で比較。' },
  'ウェア':     { title: 'ベビー服・ウェア比較 | HonestBaby', desc: 'ロンパース・カバーオール・肌着をブランド・価格で比較。' },
  'ミルク・授乳': { title: 'ミルク・授乳グッズ比較 | HonestBaby', desc: '哺乳瓶・粉ミルク・搾乳器をパパママの口コミで比較。' },
  '離乳食・食器': { title: '離乳食・食器比較 | HonestBaby', desc: 'ベビーフード・食器セット・ベビーチェアを口コミ・価格で比較。' },
  '寝具・ベッド': { title: 'ベビーベッド・寝具比較 | HonestBaby', desc: 'ベビーベッド・ベビー布団・スリーパーを安全性・価格で比較。' },
  'おもちゃ':   { title: 'ベビーおもちゃ比較・おすすめ | HonestBaby', desc: '知育玩具・メリー・ぬいぐるみを月齢・口コミで比較。' },
  '安全グッズ': { title: 'ベビー安全グッズ比較 | HonestBaby', desc: 'ベビーゲート・コーナーガード・ベビーモニターを口コミ・価格で比較。' },
  'お風呂用品': { title: 'ベビーお風呂用品比較 | HonestBaby', desc: 'ベビーバス・ソープ・保湿クリームを口コミ・価格で比較。' },
  'トイレ用品': { title: 'トイトレグッズ比較 | HonestBaby', desc: '補助便座・おまる・おしりふきをパパママの口コミで比較。' },
  '車用品':     { title: 'チャイルドシート比較・おすすめ | HonestBaby', desc: '新生児用・1歳以上・ジュニアシートを安全性・価格で徹底比較。' },
  'マタニティ': { title: 'マタニティグッズ比較 | HonestBaby', desc: 'マタニティウェア・腹帯・葉酸サプリを口コミ・価格で比較。' },
  'ギフトセット': { title: '出産祝い・ベビーギフト比較 | HonestBaby', desc: '出産祝い・誕生日ギフト・名入れギフトをシーン別に比較。' },
};

async function handleCategory(cat, res) {
  const meta = CAT_META[cat];
  if (!meta) return res.redirect(302, '/');

  const title = escapeHtml(meta.title);
  const desc = escapeHtml(meta.desc);
  const image = 'https://honestbaby-care.com/logo.png';
  const url = escapeHtml(`https://honestbaby-care.com/?cat=${encodeURIComponent(cat)}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta.title,
    description: meta.desc,
    url: `https://honestbaby-care.com/?cat=${encodeURIComponent(cat)}`,
    image,
  };

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.send(`<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<meta http-equiv="refresh" content="0;url=${url}">
</head><body>リダイレクト中...</body></html>`);
}

async function handleProduct(id, res) {
  const { data: p } = await supabase
    .from('products')
    .select('name, image_url, category, brand, rating, reviews_count, price')
    .eq('id', id)
    .single();

  if (!p) return res.redirect(302, '/');

  const title = escapeHtml(`${p.name} | HonestBaby`);
  const desc = escapeHtml(`${p.category}の価格比較・口コミ。ママパパのリアルなレビューと最安値をチェック。`);
  const image = escapeHtml(p.image_url || 'https://honestbaby-care.com/logo.png');
  const url = escapeHtml(`https://honestbaby-care.com/product/${id}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.image_url || 'https://honestbaby-care.com/logo.png',
    description: `${p.category}の価格比較・口コミ。ママパパのリアルなレビューと最安値をチェック。`,
    url: `https://honestbaby-care.com/product/${id}`,
    ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    ...(p.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: p.rating,
        reviewCount: p.reviews_count || 1,
        bestRating: 5,
        worstRating: 1,
      }
    } : {}),
    ...(p.price ? {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'JPY',
        lowPrice: p.price,
        offerCount: 3,
        availability: 'https://schema.org/InStock',
      }
    } : {}),
  };

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
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<meta http-equiv="refresh" content="0;url=${url}">
</head><body>リダイレクト中...</body></html>`);
}

export default async function handler(req, res) {
  const { id, cat } = req.query;
  if (cat) return handleCategory(cat, res);
  if (id) return handleProduct(id, res);
  return res.redirect(302, '/');
}
