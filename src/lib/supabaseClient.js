import { createClient } from '@supabase/supabase-js';

// URLの末尾に /rest/v1 や / が含まれている場合に自動で削除して接続エラーを防ぐ
const cleanUrl = (url) => {
  if (!url) return '';
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseUrl = cleanUrl(rawUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

if (supabaseUrl === 'https://placeholder-project.supabase.co' || !supabaseUrl) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が .env に設定されていません。\n' +
    'Supabase ダッシュボード → Settings → API から取得してください。'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
