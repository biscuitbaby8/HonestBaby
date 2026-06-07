import { supabaseServer as supabase } from '@/src/lib/supabaseServer';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function auth(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { action, password, ...params } = body || {};

  if (!auth(password)) {
    return Response.json({ error: 'パスワードが正しくありません' }, { status: 401, headers: CORS });
  }

  try {
    if (action === 'list') {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, published, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return Response.json({ articles: data }, { status: 200, headers: CORS });
    }

    if (action === 'save') {
      const { slug, title, meta_description, content, published } = params;
      if (!slug || !title || !content) {
        return Response.json({ error: 'slug・title・contentは必須です' }, { status: 400, headers: CORS });
      }
      const { data, error } = await supabase
        .from('articles')
        .upsert({ slug, title, meta_description, content, published: published ?? true }, { onConflict: 'slug' })
        .select('id, slug, title, published')
        .single();
      if (error) throw error;
      return Response.json({ article: data }, { status: 200, headers: CORS });
    }

    if (action === 'toggle') {
      const { id, published } = params;
      const { error } = await supabase
        .from('articles')
        .update({ published })
        .eq('id', id);
      if (error) throw error;
      return Response.json({ ok: true }, { status: 200, headers: CORS });
    }

    if (action === 'delete') {
      const { id } = params;
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return Response.json({ ok: true }, { status: 200, headers: CORS });
    }

    return Response.json({ error: '不明なaction' }, { status: 400, headers: CORS });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: CORS });
  }
}
