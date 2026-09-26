'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

// SSRページ共通ヘッダー用の検索バー。入力してEnter/ボタンで
// ホームSPAの検索タブへ ?q= 付きで遷移する（App.jsx側の既存の
// ?q= ハンドラが検索を実行する）。空欄なら検索タブを開くだけ。
export default function SiteSearchBar() {
  const [value, setValue] = useState('');
  const router = useRouter();

  const submit = () => {
    const q = value.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/?tab=search');
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-[#F4EFEB] rounded-full pl-4 pr-1.5 py-1.5 shadow-[0_4px_14px_rgba(90,76,76,0.05)] focus-within:border-[#7B8E76] transition-colors">
      <Search className="w-4 h-4 text-[#A5A19E] flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="ブランド・型番・商品名で検索"
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs font-bold text-[#5A4C4C] placeholder:text-[#B3ABA5] placeholder:font-bold"
      />
      <button
        type="button"
        onClick={submit}
        aria-label="検索する"
        className="flex-shrink-0 text-[11px] font-black text-white bg-[#7B8E76] px-4 py-2 rounded-full active:scale-95 transition-transform"
      >
        検索
      </button>
    </div>
  );
}
