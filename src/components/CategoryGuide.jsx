import { CATEGORY_GUIDES } from '../lib/categoryGuides';

// カテゴリページの「選び方ガイド」（サーバーコンポーネント）。
// クライアントJSに依存せず必ずHTMLに含まれるため、商品0件時や
// JS無効クローラーにもコンテンツが届く。
export default function CategoryGuide({ cat }) {
  const guide = CATEGORY_GUIDES[cat];
  if (!guide) return null;

  return (
    <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-6 mb-10">
      <h2 className="text-base font-black text-[#5A4C4C] mb-3">{guide.heading}</h2>
      <p className="text-xs text-[#8E8282] font-bold leading-relaxed mb-5">{guide.intro}</p>

      {guide.types?.length > 0 && (
        <div className="space-y-3 mb-6">
          {guide.types.map((t) => (
            <div key={t.name}>
              <p className="text-xs font-black text-[#7B8E76] mb-1">{t.name}</p>
              <p className="text-xs text-[#8E8282] leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      )}

      {guide.checklist?.length > 0 && (
        <div className={guide.faq?.length ? 'mb-6' : ''}>
          <p className="text-xs font-black text-[#5A4C4C] mb-2">忖度なしチェックポイント</p>
          <ul className="space-y-1.5">
            {guide.checklist.map((item, i) => (
              <li key={i} className="text-xs text-[#8E8282] leading-relaxed flex gap-1.5">
                <span className="text-[#7B8E76] font-black">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {guide.faq?.length > 0 && (
        <div>
          <p className="text-xs font-black text-[#5A4C4C] mb-2">よくある質問</p>
          <dl className="space-y-3">
            {guide.faq.map((f, i) => (
              <div key={i}>
                <dt className="text-xs font-black text-[#7B8E76] mb-1">Q. {f.q}</dt>
                <dd className="text-xs text-[#8E8282] leading-relaxed">A. {f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
