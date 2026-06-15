'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const App = dynamic(() => import('../src/App'), { ssr: false });

// SSR(children)はクローラー＆初期表示用。アプリ(App)はクライアントでのみ起動し、
// マウント後にSSRコンテンツを隠して従来通りのSPA表示へ切り替える。
// children を ready=false の間だけ描画するため、SSRとハイドレーションのHTMLが一致する。
export default function HomeClient({ children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <>
      {!ready && children}
      <App />
    </>
  );
}
