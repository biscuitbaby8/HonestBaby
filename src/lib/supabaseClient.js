import { createClient } from '@supabase/supabase-js';

// URLの末尾に /rest/v1 や / が含まれている場合に自動で削除して接続エラーを防ぐ
const cleanUrl = (url) => {
  if (!url) return '';
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseUrl = cleanUrl(rawUrl);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

if (supabaseUrl === 'https://placeholder-project.supabase.co' || !supabaseUrl) {
  console.warn(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が環境変数に設定されていません。\n' +
    'Supabase ダッシュボード → Settings → API から取得してください。'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
    }
  }
);
