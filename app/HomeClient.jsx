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
      {!ready && (
        <>
          {children}
          {/* SSRコンテンツはクローラー向けにそのまま残しつつ、ユーザーには
              アプリ起動までの間ブランドに合わせたスプラッシュを重ねて見せる。
              空の画像枠など未スタイルのSSR内容が一瞬見えてしまうのを防ぐ。 */}
          <div className="fixed inset-0 z-50 bg-[#FFFDFB] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#F2ABAC]/20 border-t-[#F2ABAC] rounded-full animate-spin"></div>
          </div>
        </>
      )}
      <App />
    </>
  );
}
