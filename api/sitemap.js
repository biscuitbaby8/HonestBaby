import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const { data: products } = await supabase
    .from('products')
    .select('id, last_synced_at')
    .or('is_blocked.is.null,is_blocked.eq.false')
    .order('popularity_rank');

  const staticUrls = [
    { loc: 'https://honestbaby-care.com/', changefreq: 'daily', priority: '1.0' },
    { loc: 'https://honestbaby-care.com/favorites', changefreq: 'monthly', priority: '0.5' },
  ];

  const staticXml = staticUrls.map(u =>
    `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  );

  const productXml = (products || []).map(p => {
    const lastmod = (p.last_synced_at || new Date().toISOString()).slice(0, 10);
    return `  <url>
    <loc>https://honestbaby-care.com/product/${p.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticXml, ...productXml].join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.send(xml);
}
