export default function manifest() {
  return {
    name: 'HonestBaby',
    short_name: 'HonestBaby',
    description: 'ベビー用品の最安値と買い時がわかる価格比較',
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
