import StapleListHub from '@/src/components/StapleListHub';

const SITE_URL = 'https://honestbaby-care.com';
const PAGE_URL = `${SITE_URL}/milk`;
const TITLE = '粉ミルク100gあたりの最安値ランキング｜楽天・Yahoo!を毎日比較';
const DESC =
  'ほほえみ・はいはい・アイクレオ・はぐくみ・E赤ちゃん・すこやかM1・ぴゅあの大缶（約800g）を、100gあたりの単価で比較。楽天市場とYahoo!ショッピングの出品を毎日チェックし、いま一番安いショップがわかります。';

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
    q: '100gあたりの単価はどう計算していますか？',
    a: '各ショップの販売価格（税込）を、商品名に書かれた合計の内容量で割っています。「800g×2缶」は1,600gとして計算します。対象は大缶（約800g）だけで、小缶・スティック・キューブ・液体ミルクは別の規格なので含めていません。',
  },
  {
    q: '送料やポイントは含まれていますか？',
    a: '送料無料の出品がある銘柄は、その中で最も安いものを載せています。ポイント還元は人によって倍率が違うため含めていません。',
  },
  {
    q: '安い銘柄に切り替えてもよいですか？',
    a: '国内で販売されている乳児用調製粉乳は、どれも国の基準を満たしています。ただし味や溶けやすさ、便の様子は赤ちゃんによって合う・合わないがあります。切り替える時は小缶やスティックで試してから、大缶をまとめ買いするのがおすすめです。体調やアレルギーで気になることがあれば、かかりつけの小児科に相談してください。',
  },
];

export default function Page() {
  return (
    <StapleListHub
      group="milk"
      title="粉ミルク100gあたりの最安値ランキング"
      lead="粉ミルクは2缶パックや8缶ケースなど売り方がさまざまで、値段だけでは比べにくい商品です。楽天市場とYahoo!ショッピングの大缶（約800g）の出品を毎日チェックし、100gあたりの単価が安い順に並べました。銘柄をタップすると、ショップ別の一覧が見られます。"
      faq={FAQ}
      links={[
        { href: '/omutsu', label: 'おむつの最安値' },
        { href: '/oshirifuki', label: 'おしりふきの最安値' },
        { href: '/sale', label: 'セール・買い時カレンダー' },
      ]}
    />
  );
}
