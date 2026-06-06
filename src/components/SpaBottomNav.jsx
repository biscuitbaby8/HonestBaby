'use client';
import Link from 'next/link';
import { Home, Search, Gift, User, MessageCircle } from 'lucide-react';

// SSRページ用ボトムナビ（SPAの検索・ギフト等へのリンク）
export default function SpaBottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#F4EFEB] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
      style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }}>
      <Link href="/" className="flex flex-col items-center gap-1 text-[#D4CDC7] hover:text-[#7B8E76] transition-colors">
        <Home className="w-6 h-6" />
        <span className="text-[9px] font-black uppercase tracking-tighter">ホーム</span>
      </Link>
      <Link href="/?tab=search" className="flex flex-col items-center gap-1 text-[#D4CDC7] hover:text-[#7B8E76] transition-colors">
        <Search className="w-6 h-6" />
        <span className="text-[9px] font-black uppercase tracking-tighter">検索</span>
      </Link>
      <Link href="/?tab=ai"
        className="p-5 rounded-full bg-[#7B8E76] text-white shadow-lg shadow-[#7B8E76]/20 border-[4px] border-white transition-all active:scale-90">
        <MessageCircle className="w-5 h-5" />
      </Link>
      <Link href="/?tab=gift" className="flex flex-col items-center gap-1 text-[#D4CDC7] hover:text-[#7B8E76] transition-colors">
        <Gift className="w-6 h-6" />
        <span className="text-[9px] font-black uppercase tracking-tighter">ギフト</span>
      </Link>
      <Link href="/?tab=user" className="flex flex-col items-center gap-1 text-[#D4CDC7] hover:text-[#7B8E76] transition-colors">
        <User className="w-6 h-6" />
        <span className="text-[9px] font-black uppercase tracking-tighter">マイ</span>
      </Link>
    </nav>
  );
}
