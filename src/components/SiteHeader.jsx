import Link from 'next/link';
import SiteSearchBar from './SiteSearchBar';

// SSRページ共通のシンプルなヘッダー（ロゴ → ホームSPAへ／検索バー常設）
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#F4EFEB]">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-black text-[#7B8E76] tracking-tight font-serif flex-shrink-0">
          Honest Baby<span className="text-[#F2ABAC] text-3xl leading-[0] relative top-1">.</span>
        </Link>
        <div className="flex-1 max-w-xs hidden sm:block">
          <SiteSearchBar />
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-white bg-[#7B8E76] px-4 py-2 rounded-full active:scale-95 transition-transform flex-shrink-0"
        >
          ホームに戻る
        </Link>
      </div>
      <div className="max-w-5xl mx-auto px-4 pb-3 sm:hidden">
        <SiteSearchBar />
      </div>
    </header>
  );
}
