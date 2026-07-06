'use client';
import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';

const VOTES_KEY = 'honestBabyHelpfulVotes';

const hasVoted = (reviewId) => {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || '[]').includes(reviewId); } catch { return false; }
};
const markVoted = (reviewId) => {
  try {
    const list = JSON.parse(localStorage.getItem(VOTES_KEY) || '[]');
    localStorage.setItem(VOTES_KEY, JSON.stringify([...list, reviewId]));
  } catch { /* noop */ }
};

// 口コミの「役に立った」ボタン。SSR商品ページ・SPAの両方で使う。
// 二重投票はlocalStorageで抑止（楽観的にカウント加算し、API失敗でも戻さない軽量設計）。
export default function ReviewHelpfulButton({ reviewId, initialCount = 0 }) {
  const [count, setCount] = useState(Number(initialCount) || 0);
  const [voted, setVoted] = useState(() => (typeof window !== 'undefined' ? hasVoted(reviewId) : false));

  const vote = () => {
    if (voted || !reviewId) return;
    setVoted(true);
    setCount((c) => c + 1);
    markVoted(reviewId);
    fetch('/api/review-helpful', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId }),
    }).catch(() => { /* ベストエフォート */ });
  };

  return (
    <button
      onClick={vote}
      disabled={voted}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black transition-all active:scale-95 ${
        voted ? 'bg-[#EBF0EA] text-[#7B8E76]' : 'bg-[#F4EFEB] text-[#8E8282] hover:bg-[#EBF0EA] hover:text-[#7B8E76]'
      }`}
    >
      <ThumbsUp className={`w-3 h-3 ${voted ? 'fill-current' : ''}`} />
      役に立った{count > 0 ? ` ${count}` : ''}
    </button>
  );
}
