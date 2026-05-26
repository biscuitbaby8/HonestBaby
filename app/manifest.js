export default function manifest() {
  return {
    name: 'HonestBaby',
    short_name: 'HonestBaby',
    description: '子育てグッズの忖度なし比較・レビューPWA',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF5E4',
    theme_color: '#FF6B6B',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/favicon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
