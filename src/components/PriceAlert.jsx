import { useState } from 'react';
import { storage } from '../utils/storage';
import { BellRing, Send, CheckCircle2 } from 'lucide-react';

export default function PriceAlert({ productId, currentPrice }) {
  const [targetPrice, setTargetPrice] = useState(currentPrice ? Math.floor(currentPrice * 0.9) : 0);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    storage.addAlert(productId, targetPrice);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="mt-8 bg-slate-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-400/20 to-transparent rounded-bl-full" />
      
      <div className="relative z-10">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <BellRing size={20} className="text-green-400" />
          底値アラートを設定
        </h3>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          指定した価格を下回った際に、LINEへ通知が届きます。（※通知の自動化は外部のMake/n8nで処理される想定です）
        </p>

        <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600 mb-4">
          <label className="text-xs text-slate-400 font-bold block mb-2">通知を希望する価格(円)</label>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">¥</span>
            <input 
              type="number" 
              value={targetPrice}
              onChange={(e) => setTargetPrice(Number(e.target.value))}
              className="bg-transparent text-2xl font-black focus:outline-none w-full border-b border-slate-500 focus:border-green-400 transition-colors pb-1"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaved}
          className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
            isSaved ? 'bg-green-500 text-white' : 'bg-green-400 text-slate-900 hover:bg-green-300 active:scale-95'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 size={18} />
              設定完了
            </>
          ) : (
            <>
              <Send size={18} />
              LINEで通知を受け取る
            </>
          )}
        </button>
      </div>
    </div>
  );
}
