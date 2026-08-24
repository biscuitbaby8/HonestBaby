'use client';
import { useEffect } from 'react';
import { trackOutbound, installTrackingFlush } from '../lib/tracking';

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
      // gtag の有無で早期returnしない。広告ブロッカー等でGA4が読み込まれない
      // 環境でも、自前DBへの記録は行う（そちらがランキングの根拠になる）。
      // どのCTA（比較リスト最上段/リスト/検索リンク等）が押されたかを識別する。
      // data-cta-position が付いた祖先要素を優先し、無ければ 'unknown'。
      const posEl = a.closest?.('[data-cta-position]');
      const ctaPosition = posEl?.getAttribute('data-cta-position') || 'unknown';

      // 自前DBにも記録する。GA4のデータはランキング計算から参照できないため。
      // 商品IDは data-product-id を辿る（無ければURLの /product/<uuid> から拾う）。
      const idEl = a.closest?.('[data-product-id]');
      const productId = idEl?.getAttribute('data-product-id')
        || window.location.pathname.match(/^\/product\/([0-9a-f-]{36})/i)?.[1];
      if (productId) trackOutbound(productId, shop, { surface: 'product' });

      if (typeof window.gtag !== 'function') return;
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
    // 離脱時に未送信ぶんを送る
    const uninstallFlush = installTrackingFlush();
    return () => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('auxclick', handler, true);
      uninstallFlush();
    };
  }, []);
  return null;
}
