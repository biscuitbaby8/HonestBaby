import { useMemo } from 'react';

export default function PriceChart({ currentPrice }) {
  // 現在価格を基準に、過去3ヶ月のだいたいの価格推移を生成（Rechartsへの依存排除）
  const data = useMemo(() => {
    if (!currentPrice) return [];
    
    const basePrice = currentPrice;
    const result = [];
    const now = new Date();
    
    // 過去90日分（1週間ごとのデータ点）
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      // 適当なゆらぎを生成（最大15%の変動）
      const randomFluctuation = 1 + (Math.sin(i * 0.8) * 0.1) + ((Math.random() - 0.5) * 0.05);
      const pastPrice = Math.round(basePrice * randomFluctuation / 100) * 100;
      
      result.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        price: pastPrice,
      });
    }
    
    // 最終日は現在の価格に合わせる
    result[result.length - 1].price = basePrice;
    
    return result;
  }, [currentPrice]);

  if (!data || data.length === 0) return null;

  // グラフ描画用の計算
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const range = maxPrice - minPrice;

  // SVG描画用の座標計算
  const width = 300;
  const height = 120;
  
  const getCoordinates = () => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.price - minPrice) / range) * height;
      return `${x},${y}`;
    });
  };

  const points = getCoordinates();
  // 塗りつぶし用（下端まで伸ばす）
  const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`;
  // 線用
  const linePath = `M${points.join(' L')}`;

  return (
    <div className="w-full bg-white rounded-xl shadow-inner pt-4 border border-slate-100 flex flex-col items-center">
      <div className="w-full px-2" style={{ maxWidth: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* 背景のグリッド線 */}
          {[0, 0.5, 1].map((ratio) => (
            <line 
              key={ratio} 
              x1="0" 
              y1={height * ratio} 
              x2={width} 
              y2={height * ratio} 
              stroke="#f1f5f9" 
              strokeWidth="1" 
              strokeDasharray="3 3" 
            />
          ))}

          {/* グラフのパス */}
          <path d={areaPath} fill="url(#chartGradient)" />
          <path d={linePath} fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* 最終日のポイントマーカー */}
          <circle 
            cx={width} 
            cy={height - ((data[data.length - 1].price - minPrice) / range) * height} 
            r="4" 
            fill="#fff" 
            stroke="#FF6B6B" 
            strokeWidth="2" 
          />

          {/* X軸のラベル（最初と最後、中間のみ表示） */}
          <text x="0" y={height + 15} fontSize="9" fill="#94a3b8" textAnchor="start">{data[0].label}</text>
          <text x={width / 2} y={height + 15} fontSize="9" fill="#94a3b8" textAnchor="middle">{data[Math.floor(data.length / 2)].label}</text>
          <text x={width} y={height + 15} fontSize="9" fill="#94a3b8" textAnchor="end">{data[data.length - 1].label}</text>
        </svg>
      </div>
      
      {/* 凡例 / 詳細価格表示など */}
      <div className="w-full text-right pb-2 pr-4 -mt-2">
        <span className="text-[10px] text-slate-400 font-medium">現在値: </span>
        <span className="text-xs font-black text-brand-coral">¥{currentPrice.toLocaleString()}</span>
      </div>
    </div>
  );
}
