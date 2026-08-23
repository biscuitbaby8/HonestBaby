// 価格推移チャート（Keepa風・過去90日）。
// 依存ライブラリなしのインラインSVG折れ線。純粋コンポーネントのため
// SSR商品ページ・SPA商品モーダルの両方で使える（GuideContentと同パターン）。
// props.history: [{ shop_name, price, recorded_on }]（recorded_on昇順でなくてもよい）
import { TrendingUp } from 'lucide-react';

const SHOP_STYLES = {
  '楽天市場': { color: '#BF3F3F', label: '楽天' },
  'Yahoo!ショッピング': { color: '#E07A30', label: 'Yahoo!' },
  'Amazon': { color: '#232F3E', label: 'Amazon' },
};

const W = 320;
const H = 120;
const PAD = { top: 8, right: 8, bottom: 18, left: 44 };

export default function PriceHistoryChart({ history }) {
  const rows = (history || []).filter(
    (r) => r && SHOP_STYLES[r.shop_name] && Number(r.price) > 0 && r.recorded_on
  );

  // ショップごとに日付昇順の系列へ
  const seriesByShop = new Map();
  for (const r of rows) {
    if (!seriesByShop.has(r.shop_name)) seriesByShop.set(r.shop_name, []);
    seriesByShop.get(r.shop_name).push({ t: Date.parse(r.recorded_on), price: Number(r.price) });
  }
  for (const arr of seriesByShop.values()) arr.sort((a, b) => a.t - b.t);

  const allPoints = [...seriesByShop.values()].flat();
  const uniqueDays = new Set(allPoints.map((p) => p.t)).size;

  // 統計（記録があるかぎり1日分でも出す）
  const prices = allPoints.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const latestByShop = [...seriesByShop.values()].map((arr) => arr[arr.length - 1].price);
  const currentLowest = latestByShop.length ? Math.min(...latestByShop) : 0;

  // 記録の鮮度。同期対象から外れた商品は履歴が数週間前で止まることがあり、
  // その古い値を「現在価格」として扱うと「今が底値圏！」が嘘になる。
  const latestT = allPoints.length ? Math.max(...allPoints.map((p) => p.t)) : 0;
  const daysSinceLatest = latestT ? Math.floor((Date.now() - latestT) / 86400000) : null;
  const isStale = daysSinceLatest != null && daysSinceLatest > 7;

  // 底値圏: 現在の最安が記録上の最安の2%以内（2日以上の記録があり、かつ
  // 記録が新しいときのみ。古い記録では「今」を語らない）
  const isBottom = uniqueDays >= 2 && currentLowest > 0 && currentLowest <= minPrice * 1.02 && !isStale;

  return (
    <section className="bg-white rounded-[2rem] border border-[#F4EFEB] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-black text-[#5A4C4C] text-sm flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#7B8E76]" strokeWidth={2.5} /> 価格推移（過去90日）
        </h3>
        {isBottom && (
          <span className="bg-[#7B8E76] text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
            今が底値圏！
          </span>
        )}
      </div>

      {uniqueDays < 2 ? (
        <div className="py-4">
          <p className="text-[11px] font-bold text-[#8E8282] leading-relaxed">
            価格を毎日自動で記録しています。数日後から推移グラフが表示されます。
          </p>
          {currentLowest > 0 && (
            <p className="text-[11px] font-black text-[#5A4C4C] mt-1.5">
              本日の最安値: <span className="text-[#7B8E76]">¥{currentLowest.toLocaleString()}</span>
            </p>
          )}
        </div>
      ) : (
        <>
          <Chart seriesByShop={seriesByShop} minPrice={minPrice} maxPrice={maxPrice} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {[...seriesByShop.keys()].map((shop) => (
              <span key={shop} className="flex items-center gap-1.5 text-[10px] font-bold text-[#8E8282]">
                <span className="w-3 h-[3px] rounded-full inline-block" style={{ backgroundColor: SHOP_STYLES[shop].color }} />
                {SHOP_STYLES[shop].label}
              </span>
            ))}
            <span className="text-[10px] font-black text-[#5A4C4C] ml-auto">
              期間最安 ¥{minPrice.toLocaleString()}
              <span className="text-[#A5A19E] font-bold mx-1">/</span>
              最高 ¥{maxPrice.toLocaleString()}
            </span>
          </div>
          {isStale && (
            <p className="text-[10px] font-bold text-[#A5A19E] mt-1.5 leading-relaxed">
              ※ 最後に価格を記録できたのは{daysSinceLatest}日前です。現在の価格は各ショップでご確認ください。
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Chart({ seriesByShop, minPrice, maxPrice }) {
  const allPoints = [...seriesByShop.values()].flat();
  const tMin = Math.min(...allPoints.map((p) => p.t));
  const tMax = Math.max(...allPoints.map((p) => p.t));
  // 価格レンジに上下5%の余白（フラットな価格でも線が枠に張り付かないように）
  const span = Math.max(maxPrice - minPrice, Math.round(maxPrice * 0.02), 1);
  const yMin = Math.max(0, minPrice - span * 0.15);
  const yMax = maxPrice + span * 0.15;

  const x = (t) => PAD.left + ((t - tMin) / Math.max(tMax - tMin, 1)) * (W - PAD.left - PAD.right);
  const y = (price) => PAD.top + (1 - (price - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

  const fmtDate = (t) => {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  const fmtPrice = (v) =>
    v >= 10000 ? `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}万` : v.toLocaleString();

  // 目盛り: 価格2本（最安/最高）・日付は両端
  const gridPrices = [minPrice, maxPrice];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto mt-2"
      role="img"
      aria-label="価格推移グラフ"
    >
      {gridPrices.map((gp) => (
        <g key={gp}>
          <line
            x1={PAD.left} x2={W - PAD.right} y1={y(gp)} y2={y(gp)}
            stroke="#F4EFEB" strokeWidth="1" strokeDasharray="3 3"
          />
          <text x={PAD.left - 4} y={y(gp) + 3} textAnchor="end" fontSize="8.5" fontWeight="700" fill="#A5A19E">
            ¥{fmtPrice(gp)}
          </text>
        </g>
      ))}

      {[...seriesByShop.entries()].map(([shop, points]) => {
        const style = SHOP_STYLES[shop];
        if (points.length === 1) {
          return <circle key={shop} cx={x(points[0].t)} cy={y(points[0].price)} r="3" fill={style.color} />;
        }
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ');
        const last = points[points.length - 1];
        return (
          <g key={shop}>
            <path d={path} fill="none" stroke={style.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(last.t)} cy={y(last.price)} r="3" fill={style.color} />
          </g>
        );
      })}

      <text x={PAD.left} y={H - 4} fontSize="8.5" fontWeight="700" fill="#A5A19E">{fmtDate(tMin)}</text>
      <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize="8.5" fontWeight="700" fill="#A5A19E">{fmtDate(tMax)}</text>
    </svg>
  );
}
