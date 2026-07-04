// 選び方ガイドの本文マークアップ（見出し・タイプ解説・チェックリスト・FAQ）。
// ページ下部のSEOセクション（CategoryGuide）と、上部ボタンから開くモーダル
// （GuideModalButton）の両方で共用する。純粋な表示コンポーネントのため
// サーバー/クライアントどちらからでも使える。
export default function GuideContent({ guide }) {
  if (!guide) return null;
  return (
    <>
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
    </>
  );
}
