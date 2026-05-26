import { createClient } from '@supabase/supabase-js';

// サーバー専用 Supabase クライアント（読み取り用）。
// SSR ページ（app/category, app/product）から商品データを取得する。
// service key が無ければ anon key にフォールバック。

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://placeholder.supabase.co';

const key =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'placeholder_key';

export const supabaseServer = createClient(url, key, {
  auth: { persistSession: false },
});
