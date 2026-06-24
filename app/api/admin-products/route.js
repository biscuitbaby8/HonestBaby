import { supabaseServer as supabase } from '@/src/lib/supabaseServer';

function auth(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { action, password, id, rakuten_item_code } = body || {};

  if (!auth(password)) {
    return Response.json({ error: 'パスワードが正しくありません' }, { status: 401 });
  }

  if (action !== 'block' && action !== 'unblock') {
    return Response.json({ error: '不明なaction' }, { status: 400 });
  }
  if (!id && !rakuten_item_code) {
    return Response.json({ error: 'idまたはrakuten_item_codeが必要です' }, { status: 400 });
  }

  const is_blocked = action === 'block';

  try {
    const updates = [];
    if (id) {
      updates.push(supabase.from('products').update({ is_blocked }).eq('id', id));
    }
    if (rakuten_item_code) {
      updates.push(supabase.from('products').update({ is_blocked }).eq('rakuten_item_code', rakuten_item_code));
    }
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;

    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
