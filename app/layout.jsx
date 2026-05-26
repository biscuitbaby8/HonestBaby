import Script from 'next/script';
import '../src/index.css';

const SITE_URL = 'https://honestbaby-care.com';
const TITLE = 'HonestBaby - 子育てグッズの忖度なし比較・レビュー';
const DESCRIPTION =
  'パパ・ママのリアルな口コミと価格比較で、本当に良いベビー用品が見つかるAIコンサルタントアプリ。エルゴ、コンビ、アップリカなど人気ブランドを網羅。';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=3', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    url: SITE_URL + '/',
    title: TITLE,
    description:
      'パパ・ママのリアルな口コミと価格比較で、本当に良いベビー用品が見つかるAIコンサルタントアプリ。',
    images: ['/favicon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description:
      'パパ・ママのリアルな口コミと価格比較で、本当に良いベビー用品が見つかるAIコンサルタントアプリ。',
    images: ['/favicon.png'],
  },
  verification: {
    google: 'bapS2y_EyERyWlNqP1F_SSbxEhm01lyv1Sb7E8u-5qI',
  },
};

export const viewport = {
  themeColor: '#FF6B6B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {children}

        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KEBZ56MH30"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KEBZ56MH30');
          `}
        </Script>

        {/* ValueCommerce AutoMyLink */}
        <Script id="vc-aml" strategy="afterInteractive">
          {`var vc_pid = "892602816";`}
        </Script>
        <Script
          src="//aml.valuecommerce.com/vcdal.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
