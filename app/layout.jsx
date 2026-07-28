import Script from 'next/script';
import AffiliateClickTracker from '../src/components/AffiliateClickTracker';
import '../src/index.css';

const SITE_URL = 'https://honestbaby-care.com';
const TITLE = 'HonestBaby - 子育てグッズの忖度なし比較・レビュー';
const DESCRIPTION =
  'パパ・ママのリアルな口コミと価格比較で、本当に良いベビー用品が見つかるAIコンサルタントアプリ。エルゴ、コンビ、アップリカなど人気ブランドを網羅。';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // 子ページは title に文字列だけ設定すればテンプレートが適用される
  title: { default: TITLE, template: '%s | HonestBaby' },
  description: DESCRIPTION,
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
    // og:image は app/opengraph-image.jsx（1200×630）が自動適用される
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description:
      'パパ・ママのリアルな口コミと価格比較で、本当に良いベビー用品が見つかるAIコンサルタントアプリ。',
  },
  verification: {
    google: 'bapS2y_EyERyWlNqP1F_SSbxEhm01lyv1Sb7E8u-5qI',
  },
  alternates: {
    types: { 'application/rss+xml': [{ url: '/feed.xml', title: 'HonestBaby 記事フィード' }] },
  },
};

export const viewport = {
  themeColor: '#FF6B6B',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// サイト全体の構造化データ（WebSite + Organization）。ブランド検索対応。
// SearchAction（サイトリンク検索ボックス）は Google が 2024/11 に機能自体を
// 廃止し、マークアップも不要になった。それどころか urlTemplate のプレースホルダを
// 含む /?q={search_term_string} が実URLとしてクロールされ、Search Console の
// 「クロール済み - インデックス未登録」に計上されていたため削除する。
const siteJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HonestBaby',
    url: SITE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HonestBaby',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {children}
        <AffiliateClickTracker />

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
