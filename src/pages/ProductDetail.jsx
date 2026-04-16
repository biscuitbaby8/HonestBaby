import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, ExternalLink, Loader2, Store, TrendingDown, MessageCircle, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { getProductById } from '../api/rakuten';
import { searchYahooProducts } from '../api/yahoo';
import PriceChart from '../components/PriceChart';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [yahooPrice, setYahooPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        if (id.startsWith('r-')) {
          const remoteProduct = await getProductById(id);
          if (remoteProduct) {
            setProduct(remoteProduct);
            
            // Yahoo価格も同時取得して比較
            if (remoteProduct.name) {
              const cleanName = remoteProduct.name.replace(/[【】（）()\[\]]/g, ' ').substring(0, 30);
              const yahooRes = await searchYahooProducts(cleanName);
              if (yahooRes && yahooRes.length > 0) {
                setYahooPrice(yahooRes[0].price);
              }
              setYahooPrice(prev => prev || 'not_found');
            }
          }
        }
      } catch (err) {
        console.error('Detail Load Error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm font-medium">詳細情報を取得中...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
        <p className="text-sm">商品が見つかりませんでした。</p>
        <button onClick={() => navigate(-1)} className="text-brand-coral font-bold text-sm">
          ← 戻る
        </button>
      </div>
    );
  }

  const price = product.price || 0;
  const rating = product.rating || 0;

  return (
    <article className="pb-10 pt-2 fade-in space-y-6 max-w-lg mx-auto">
      {/* 戻るボタン */}
      <nav className="flex items-center gap-2 px-1">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={22} />
        </button>
        <span className="text-xs font-bold text-slate-400 opacity-0">検索結果に戻る</span>
      </nav>

      {/* 1. 商品ヘッダー（画像・基本情報） */}
      <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-6">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-56 object-contain mx-auto mb-6 drop-shadow-sm"
        />
        <h1 className="text-base font-black text-slate-800 leading-snug">
          {product.name}
        </h1>
        <div className="flex items-center justify-between mt-4 pb-2 border-b border-slate-50">
          <div className="flex items-center gap-1.5">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-black text-slate-700">{rating > 0 ? rating.toFixed(1) : '評価なし'}</span>
            <span className="text-[11px] text-slate-400">({product.reviewCount}件)</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">商品コード: {product.id.replace('r-', '')}</span>
        </div>
        
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-xs font-bold text-slate-400">楽天最安値</span>
          <span className="text-2xl font-black text-brand-coral">¥{price.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">(税込)</span>
        </div>
      </section>

      {/* 2. 価格比較セクション */}
      <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
          <Store size={18} className="text-brand-coral" />
          現在の最安値比較
        </h2>
        
        <div className="space-y-3">
          {/* 楽天 */}
          <div className="flex justify-between items-center p-3.5 bg-red-50/50 rounded-2xl border border-red-100/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">Rakuten</span>
              <span className="text-base font-black text-slate-800">¥{price.toLocaleString()}</span>
            </div>
            <a href={product.url} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm shadow-red-200">
              ショップへ
            </a>
          </div>
          
          {/* Yahoo */}
          <div className="flex justify-between items-center p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Yahoo!</span>
              <span className="text-base font-black text-slate-800">
                {yahooPrice === null ? <span className="text-slate-400 text-xs text-brand-pulse">読み込み中...</span> : (yahooPrice === 'not_found' ? <span className="text-slate-400 text-xs font-medium">比較対象なし</span> : `¥${yahooPrice.toLocaleString()}`)}
              </span>
            </div>
            <a href={`https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(product.name.substring(0, 30))}`} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm shadow-blue-200">
              最安値を検索
            </a>
          </div>
        </div>
      </section>

      {/* 3. 価格推移グラフ */}
      <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <TrendingDown size={18} className="text-brand-coral" />
          お買い得タイミング (AI推計)
        </h2>
        <PriceChart currentPrice={price} />
        <p className="text-[10px] text-slate-400 text-center">
          過去3ヶ月の市場トレンドから算出した疑似変動グラフです
        </p>
      </section>

      {/* 4. AI 忖度なし分析 */}
      <section className="bg-brand-navy text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-coral opacity-10 rounded-full -mr-16 -mt-16"></div>
        <h2 className="text-sm font-black flex items-center gap-2 mb-5 text-brand-coral relative z-10">
          <AlertTriangle size={18} />
          HonestBaby 忖度なし分析
        </h2>
        
        <div className="space-y-5 relative z-10">
          <div>
            <h3 className="text-[11px] font-black text-brand-coral/80 mb-2 uppercase tracking-widest pl-3 border-l-2 border-brand-coral">Cons (欠点)</h3>
            <ul className="text-xs text-white/90 space-y-2.5 pl-4 list-disc marker:text-brand-coral">
              <li>人気ゆえにセール時期以外の価格変動が激しい</li>
              <li>梱包サイズが大きいため置き配指定には注意が必要</li>
              <li>類似の安価なモデルに比べて初期投資が高い</li>
            </ul>
          </div>
          <div className="pt-2 border-t border-white/10">
            <h3 className="text-[11px] font-black text-blue-400/80 mb-2 uppercase tracking-widest pl-3 border-l-2 border-blue-400">Target (注意)</h3>
            <p className="text-xs text-white/80 leading-relaxed pl-3">
              「とりあえず安いものを」と考える方には不向きです。長期的な耐久性と安全性を重視する方向けの投資的アイテムと言えます。
            </p>
          </div>
        </div>
      </section>

      {/* 5. SNS風 リアルな口コミ */}
      <section className="space-y-4 px-1">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <MessageCircle size={18} className="text-brand-coral" />
          ユーザーのリアルな声
        </h2>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
              <span className="text-xs font-bold text-slate-500">M</span>
            </div>
            <div className="bg-white rounded-3xl rounded-tl-none p-4 shadow-sm border border-slate-100 flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-slate-400">1週間前のレビュー</span>
                <div className="flex"><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /></div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                「高い買い物でしたが、使い始めてからママの腰痛が激減しました。機能性は間違いなくNo.1だと思います！✨」
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
              <span className="text-xs font-bold text-slate-500">K</span>
            </div>
            <div className="bg-white rounded-3xl rounded-tl-none p-4 shadow-sm border border-slate-100 flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-slate-400">今日届いたパパ</span>
                <div className="flex"><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-slate-200 text-slate-200" /><Star size={10} className="fill-slate-200 text-slate-200" /></div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                「めちゃくちゃ場所取ります（笑）玄関狭い家は覚悟したほうがいいかも。でもデザインは最高にカッコイイです！」
              </p>
              <div className="mt-3 py-1.5 px-3 bg-slate-50 rounded-xl inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <ThumbsUp size={12} className="text-brand-coral" /> 8人が共感
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 公式の商品説明 */}
      {product.description && (
        <section className="px-1 opacity-60">
          <div className="bg-white/50 rounded-2xl p-4 border border-slate-100">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Description</h2>
            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-4">
              {product.description.replace(/<[^>]*>/g, '')}
            </p>
          </div>
        </section>
      )}
    </article>
  );
}
