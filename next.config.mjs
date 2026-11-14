import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  cacheOnFrontEndNav: true,
  // worker/index.js の Web Push ハンドラを自動生成 SW に取り込む
  customWorkerDir: 'worker',
  disable: process.env.NODE_ENV === 'development',
});

// GA4・ValueCommerce（アフィリエイト）のインラインスクリプトを使っているため
// script-src/style-src は 'unsafe-inline' を許可しつつ、それ以外の経路
// (object-src, base-uri, form-action, frame-ancestors 等)を締める方針。
const csp = [
  "default-src 'self'",
  // ValueCommerce の AutoMyLink は aml から dalc / pti など別サブドメインのスクリプトを
  // 追加で読み込む。aml だけ許可していたため後続がブロックされ、リンクの
  // アフィリエイト変換が動いていなかった（実ブラウザで確認）。
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.valuecommerce.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // GA4 は計測の送信先に www.google.com/g/collect や analytics.google.com、
  // doubleclick を使うことがある（Googleの公式CSPガイドに記載）。google-analytics.com
  // だけ許可していたため、送信がブロックされて計測が欠けていた。
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.google.com https://www.google.co.jp https://*.g.doubleclick.net https://*.valuecommerce.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // バンドルせず Node ランタイムで読み込む（独自のモジュール解決を持つパッケージ）
  serverExternalPackages: ['web-push'],
  images: {
    // 楽天・Yahoo・Amazon 等の外部商品画像を許可
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // OGP/Twitterカード用の動的画像ルートは「ページ」ではないため、
      // 検索結果に載せない（Search Console の
      // 「クロール済み - インデックス未登録」に画像URLが積み上がるのを防ぐ）。
      // クロール自体は許可したままなので、SNSのカード表示には影響しない。
      { source: '/opengraph-image', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
      { source: '/twitter-image', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
};

export default withPWA(nextConfig);
