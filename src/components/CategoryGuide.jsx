import { CATEGORY_GUIDES } from '../lib/categoryGuides';
import GuideContent from './GuideContent';

// カテゴリページ下部の「選び方ガイド」（サーバーコンポーネント）。
// クライアントJSに依存せず必ずHTMLに含まれるため、商品0件時や
// JS無効クローラーにもコンテンツが届く（SEO本文の実体はこちら）。
export default function CategoryGuide({ cat }) {
  const guide = CATEGORY_GUIDES[cat];
  if (!guide) return null;

  return (
    <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-10">
      <GuideContent guide={guide} />
    </section>
  );
}
