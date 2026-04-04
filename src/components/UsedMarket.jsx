import { prices } from '../data/prices';
import { RefreshCcw, HandCoins } from 'lucide-react';

export default function UsedMarket({ productId }) {
  const productPrices = prices[productId];
  if (!productPrices || !productPrices.mercari) return null;

  const { lowestUsed, avgUsed, condition, link } = productPrices.mercari;
  const newPrice = productPrices.amazon?.price || 0; // Using Amazon as baseline new price
  
  const discountRate = newPrice > 0 ? Math.round((1 - lowestUsed / newPrice) * 100) : 0;
  
  // Simple heuristic for "buy now"
  const isGoodDeal = discountRate > 40 && condition !== '全体的に状態が悪い';

  return (
    <div className="mt-6 bg-amber-50 rounded-3xl p-5 border border-amber-100 shadow-sm relative overflow-hidden">
      <RefreshCcw size={100} className="absolute -top-4 -right-4 text-amber-100" />
      
      <div className="relative z-10">
        <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
          <HandCoins size={20} className="text-amber-500" />
          中古相場モニタリング
        </h3>

        <div className="flex items-end justify-between bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
          <div>
            <div className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded inline-block mb-1">
               {condition}の最安値
            </div>
            <div className="text-3xl font-black text-slate-800 mt-1">
              ¥{lowestUsed.toLocaleString()}~
            </div>
            <div className="text-xs text-slate-500 mt-1">
              新品比: <span className="font-bold text-red-500">{discountRate}% OFF</span> (相場¥{avgUsed.toLocaleString()})
            </div>
          </div>
        </div>

        {isGoodDeal ? (
          <div className="mt-3 bg-red-500 text-white text-sm font-bold p-3 rounded-xl text-center shadow-sm">
            🔥 新品との価格差が大きく、「今が買い」です！
          </div>
        ) : (
          <div className="mt-3 bg-white/50 text-amber-800 border border-amber-200 text-sm font-medium p-3 rounded-xl text-center">
            👀 現在の相場はやや高め。少し待つのがおすすめです。
          </div>
        )}

        <a 
          href={link} 
          className="mt-4 block w-full text-center bg-white border-2 border-amber-200 text-amber-700 font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-transform"
        >
          フリマアプリで検索する
        </a>
      </div>
    </div>
  );
}
