import Link from 'next/link';

// SSRページ共通のシンプルなヘッダー（ロゴ → ホームSPAへ）
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#F4EFEB]">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-[#7B8E76] tracking-tight font-serif">
          Honest Baby<span className="text-[#F2ABAC] text-3xl leading-[0] relative top-1">.</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-white bg-[#7B8E76] px-4 py-2 rounded-full active:scale-95 transition-transform"
        >
          アプリで探す
        </Link>
      </div>
    </header>
  );
}
