import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product } = req.body;

  if (!product || !product.name) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  try {
    // 1. 商品の重複チェック (名前または楽天のitemCodeなどで判定)
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('name', product.name)
      .single();

    if (existing) {
      return res.status(200).json({ message: 'Already exists', id: existing.id });
    }

    // 2. 新規登録
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        category: product.category || '未分類',
        brand: product.brand || '不明',
        image_url: product.image,
        description: product.aiAnalysis || '',
        rating: product.rating || 4.5,
        reviews_count: 10,
        is_market_wide: true // 自動登録フラグ
      }])
      .select();

    if (error) throw error;

    // 3. 価格情報も初期登録
    if (product.shops && product.shops.length > 0) {
      const productId = data[0].id;
      const shopInserts = product.shops.map(s => ({
        product_id: productId,
        shop_name: s.name,
        shop_type: s.name.includes('楽天') ? 'rakuten' : s.name.includes('Yahoo') ? 'yahoo' : 'amazon',
        lowest_price: s.price,
        url: s.url
      }));

      await supabase.from('shops_prices').insert(shopInserts);
    }

    res.status(201).json({ message: 'Registered', id: data[0].id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
}
