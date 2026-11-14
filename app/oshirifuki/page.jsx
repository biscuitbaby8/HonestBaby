import StapleListHub from '@/src/components/StapleListHub';

const SITE_URL = 'https://honestbaby-care.com';
const PAGE_URL = `${SITE_URL}/oshirifuki`;
const TITLE = 'おしりふき1枚あたりの最安値ランキング｜楽天・Yahoo!を毎日比較';
const DESC =
  'パンパース・ムーニー・グーン・ピジョン おしりナップ・レック 水99.9%のおしりふきを、1枚あたりの単価で比較。楽天市場とYahoo!ショッピングの出品を毎日チェックし、いま一番安いショップがわかります。';

export const revalidate = 3600;

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESC, url: PAGE_URL, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
};

const FAQ = [
  {
    q: '1枚あたりの単価はどう計算していますか？',
    a: '各ショップの販売価格（税込）を、商品名に書かれた合計枚数で割っています。「80枚×20個」は1,600枚として計算します。枚数が商品名からはっきり読み取れない出品は、誤った単価を出さないよう対象から外しています。',
  },
  {
    q: '送料やポイントは含まれていますか？',
    a: '送料無料の出品がある銘柄は、その中で最も安いものを載せています。ポイント還元は人によって倍率が違うため含めていません。',
  },
  {
    q: '単価が安いものを選べばよいですか？',
    a: 'おしりふきは厚みと水分量で使う枚数が変わります。薄手は1枚が安くても1回に使う枚数が増えがちです。うんちの時は厚手、おしっこの時は薄手と使い分けると、結果的に安く済みます。',
  },
];

export default function Page() {
  return (
    <StapleListHub
      group="oshirifuki"
      title="おしりふき1枚あたりの最安値ランキング"
      lead="おしりふきは入数とまとめ買いの単位がショップごとに違い、値段だけでは比べられません。楽天市場とYahoo!ショッピングの出品を毎日チェックし、1枚あたりの単価が安い順に並べました。銘柄をタップすると、ショップ別の一覧が見られます。"
      faq={FAQ}
      links={[
        { href: '/omutsu', label: 'おむつの最安値' },
        { href: '/milk', label: '粉ミルクの最安値' },
        { href: '/sale', label: 'セール・買い時カレンダー' },
      ]}
    />
  );
}
