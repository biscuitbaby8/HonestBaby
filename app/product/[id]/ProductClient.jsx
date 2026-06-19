'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const App = dynamic(() => import('../../../src/App'), { ssr: false });

// SSR(children)はクローラー・検索流入者向けの読めるページ。
// 実機ブラウザではアプリ起動後、従来通り商品モーダル表示に切り替える。
// App側に既存の「?product=」読み取り処理（旧SpaRedirect用）があるため、
// ナビゲーションなしでURLにproductパラメータだけ追記してApp起動時に拾わせる。
export default function ProductClient({ children, productId }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && productId) {
      const url = new URL(window.location.href);
      url.searchParams.set('product', productId);
      window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
    }
    setReady(true);
  }, [productId]);

  return (
    <>
      {!ready && (
        <>
          {children}
          <div className="fixed inset-0 z-50 bg-[#FFFDFB] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#F2ABAC]/20 border-t-[#F2ABAC] rounded-full animate-spin"></div>
          </div>
        </>
      )}
      <App />
    </>
  );
}
