import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// sync-products.js と同じルールを適用してDB内のsub_categoryを修正するユーティリティ
const RULES = {
  "車用品": [
    { match: /シートプロテクター|座席保護|シート保護|保護シート|保護マット|チェアプロテクター/, sub: "周辺グッズ" },
    { match: /シートカバー|チェアカバー|座席カバー/, sub: "周辺グッズ" },
    { match: /ミラー|カーミラー|後部座席ミラー/, sub: "周辺グッズ" },
    { match: /サンシェード|日よけ|UVカット|車用遮光|車用日除け/, sub: "周辺グッズ" },
    { match: /シートベルトカバー|シートベルトパッド|ベルトパッド/, sub: "周辺グッズ" },
    { match: /ネックピロー|ヘッドサポート|ヘッドレスト/, sub: "周辺グッズ" },
    { match: /収納|ポーチ|トレイ|オーガナイザー/, sub: "周辺グッズ" },
    { match: /ジュニアシート/, sub: "ジュニアシート" },
    { match: /新生児/, sub: "新生児用" },
    { match: /2way|2ウェイ|二way|コンバーチブル/, sub: "2wayタイプ" },
  ],
};

export default async function handler(req, res) {
  // 管理者のみ（簡易キー認証）
  if (req.headers['x-admin-key'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const category = req.query.category || '車用品';
  const rules = RULES[category];
  if (!rules) return res.status(400).json({ error: `No rules for category: ${category}` });

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sub_category')
    .eq('category', category);

  if (error) return res.status(500).json({ error: error.message });

  const updates = [];
  for (const p of products || []) {
    let newSub = '本体';
    for (const r of rules) {
      if (r.match.test(p.name)) { newSub = r.sub; break; }
    }
    if (newSub !== p.sub_category) {
      updates.push({ id: p.id, old: p.sub_category, new: newSub, name: p.name });
      await supabase.from('products').update({ sub_category: newSub }).eq('id', p.id);
    }
  }

  return res.json({ fixed: updates.length, updates });
}
