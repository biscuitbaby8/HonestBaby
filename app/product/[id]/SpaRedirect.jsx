'use client';
import { useEffect } from 'react';

// SPAにリダイレクトして商品モーダルを開く（SEO用SSRコンテンツはbotが取得済み）
export default function SpaRedirect({ productId }) {
  useEffect(() => {
    window.location.replace(`/?product=${encodeURIComponent(productId)}`);
  }, [productId]);
  return null;
}
