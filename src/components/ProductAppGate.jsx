'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// アプリ読み込み中はブランドスプラッシュを表示（白画面防止）
const App = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-[#FFFDFB] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#F2ABAC]/20 border-t-[#F2ABAC] rounded-full animate-spin"></div>
    </div>
  ),
});

// 商品ページの表示モード振り分けゲート。
// - アプリ利用経験者（honestBaby* の localStorage がある端末）:
//   従来どおりその場でアプリを起動し、?product= 経由で商品モーダルを開く
// - 検索エンジン・初訪問者: 軽いSSRページ(children)をそのまま表示
// Googlebot は localStorage を持たないため常にSSR側を評価する
// （「HTMLの内容と描画後の画面が食い違う」問題も起きない）。
const hasUsedApp = () => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('honestBaby')) return true;
    }
  } catch { /* プライベートモード等でlocalStorage不可ならSSR表示 */ }
  return false;
};

export default function ProductAppGate({ productId, children }) {
  const [bootApp, setBootApp] = useState(false);

  useEffect(() => {
    if (!hasUsedApp()) return;
    // App側の既存の「?product=」読み取り処理に商品IDを引き継ぐ
    if (productId) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('product', productId);
        window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
      } catch { /* noop */ }
    }
    setBootApp(true);
  }, [productId]);

  return bootApp ? <App /> : children;
}
