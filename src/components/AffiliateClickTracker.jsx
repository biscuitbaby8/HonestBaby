'use client';
import { useEffect } from 'react';

// アフィリエイトリンクのクリックを GA4 に送る委譲リスナー。
// ルート layout に1つ置くだけで、SSRページ・SPA双方の <a> を網羅する
// （個々のリンクへの onClick 実装は不要）。
const SHOP_BY_DOMAIN = [
  ['valuecommerce.com', 'yahoo'], // VC直リンク（vc_url=Yahoo）
  ['shopping.yahoo.co.jp', 'yahoo'],
  ['rakuten.co.jp', 'rakuten'],
  ['amazon.co.jp', 'amazon'],
  ['iherb.com', 'iherb'],
  ['prf.hn', 'iherb'], // Partnerize トラッキングドメイン
];

function resolveShop(href) {
  try {
    const host = new URL(href).hostname;
    const hit = SHOP_BY_DOMAIN.find(([domain]) => host === domain || host.endsWith('.' + domain));
    return hit ? hit[1] : null;
  } catch {
    return null;
  }
}

export default function AffiliateClickTracker() {
  useEffect(() => {
    const handler = (e) => {
      const a = e.target.closest?.('a[href]');
      if (!a) return;
      const shop = resolveShop(a.href);
      if (!shop) return;
      if (typeof window.gtag !== 'function') return;
      // どのCTA（比較リスト最上段/リスト/検索リンク等）が押されたかを識別する。
      // data-cta-position が付いた祖先要素を優先し、無ければ 'unknown'。
      const posEl = a.closest?.('[data-cta-position]');
      const ctaPosition = posEl?.getAttribute('data-cta-position') || 'unknown';
      window.gtag('event', 'affiliate_click', {
        shop,
        cta_position: ctaPosition,
        link_url: a.href.slice(0, 400), // GA4 パラメータ上限対策
        page_path: window.location.pathname,
      });
    };
    // capture: SPA側の stopPropagation やリンク差し替えより先に拾う
    document.addEventListener('click', handler, true);
    document.addEventListener('auxclick', handler, true); // 中クリック（新規タブ）
    return () => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('auxclick', handler, true);
    };
  }, []);
  return null;
}
