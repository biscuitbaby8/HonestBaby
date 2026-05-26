import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  cacheOnFrontEndNav: true,
  // worker/index.js の Web Push ハンドラを自動生成 SW に取り込む
  customWorkerDir: 'worker',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // バンドルせず Node ランタイムで読み込む（独自のモジュール解決を持つパッケージ）
  serverExternalPackages: ['amazon-paapi', 'web-push'],
  images: {
    // 楽天・Yahoo・Amazon 等の外部商品画像を許可
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default withPWA(nextConfig);
