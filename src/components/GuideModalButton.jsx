'use client';
import { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';
import GuideContent from './GuideContent';

// カテゴリページ上部に置く「選び方ガイド」ボタン。
// 押すとボトムシート（PCは中央モーダル）でガイド全文を表示する。
// SEO用の本文はページ下部の CategoryGuide が担い、モーダル内容は
// 開いたときだけ描画するため初期HTMLの重複はない。
export default function GuideModalButton({ guide }) {
  const [open, setOpen] = useState(false);

  // モーダル表示中は背面のスクロールを止める
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!guide) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-[#FFF9E6] border border-[#F2E3AE] text-[#B8933D] text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-transform mb-4"
      >
        <Lightbulb className="w-3.5 h-3.5" strokeWidth={2.5} />
        選び方ガイドを見る
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center" role="dialog" aria-modal="true" aria-label={guide.heading}>
          {/* 背景（タップで閉じる） */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

          {/* 本体: モバイルはボトムシート、PCは中央カード */}
          <div className="relative w-full max-h-[80vh] overflow-y-auto bg-white rounded-t-[2rem] p-6 pb-10 lg:max-w-2xl lg:rounded-[2rem] lg:pb-6">
            <button
              onClick={() => setOpen(false)}
              aria-label="閉じる"
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F4EFEB] text-[#8E8282] active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <div className="pr-8">
              <GuideContent guide={guide} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
