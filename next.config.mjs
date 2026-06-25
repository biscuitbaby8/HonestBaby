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
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://aml.valuecommerce.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://www.googletagmanager.com https://aml.valuecommerce.com https://ck.jp.ap.valuecommerce.com",
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
  serverExternalPackages: ['amazon-paapi', 'web-push'],
  images: {
    // 楽天・Yahoo・Amazon 等の外部商品画像を許可
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withPWA(nextConfig);
