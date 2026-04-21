import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

if (supabaseUrl === 'https://placeholder-project.supabase.co') {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が .env に設定されていません。\n' +
    'Supabase ダッシュボード → Settings → API から取得してください。'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
