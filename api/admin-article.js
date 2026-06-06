import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function auth(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, password, ...params } = req.body || {};

  if (!auth(password)) {
    return res.status(401).json({ error: 'パスワードが正しくありません' });
  }

  try {
    if (action === 'list') {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, published, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ articles: data });
    }

    if (action === 'save') {
      const { slug, title, meta_description, content, published } = params;
      if (!slug || !title || !content) {
        return res.status(400).json({ error: 'slug・title・contentは必須です' });
      }
      const { data, error } = await supabase
        .from('articles')
        .upsert({ slug, title, meta_description, content, published: published ?? true }, { onConflict: 'slug' })
        .select('id, slug, title, published')
        .single();
      if (error) throw error;
      return res.status(200).json({ article: data });
    }

    if (action === 'toggle') {
      const { id, published } = params;
      const { error } = await supabase
        .from('articles')
        .update({ published })
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'delete') {
      const { id } = params;
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: '不明なaction' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
