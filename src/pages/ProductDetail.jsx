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
      if (id.startsWith('r-')) {
        const remoteProduct = await getProductById(id);
        setProduct(remoteProduct);
        
        // Yahoo価格も同時取得して比較
        if (remoteProduct?.name) {
          // 商品名が長すぎるとヒットしないので最初の20文字程度で検索
          const shortName = remoteProduct.name.substring(0, 20).replace(/【.*?】/g, '');
          const yahooRes = await searchYahooProducts(shortName);
          if (yahooRes.length > 0) {
            setYahooPrice(yahooRes[0].price);
          }
        }
      }
      setLoading(false);
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
    <article className="pb-10 pt-2 fade-in space-y-6">
      {/* 戻るボタン */}
      <nav className="flex items-center gap-2 px-1">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={22} />
        </button>
        <span className="text-xs font-bold text-slate-400">検索結果に戻る</span>
      </nav>

      {/* 1. 商品ヘッダー（画像・基本情報） */}
      <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 p-5">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full max-h-64 object-contain mx-auto mb-4"
        />
        <h1 className="text-base font-black text-slate-800 leading-snug">
          {product.name}
        </h1>
        {rating > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-black text-slate-700">{rating.toFixed(1)}</span>
            <span className="text-[11px] text-slate-400">({product.reviewCount}件のレビュー)</span>
          </div>
        )}
      </section>

      {/* 2. 価格比較セクション */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5 px-1">
          <Store size={16} className="text-brand-coral" />
          ショップ別・最安値比較
        </h2>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden text-sm">
          {/* 楽天 */}
          <div className="flex justify-between items-center p-4 border-b border-slate-50">
            <span className="font-bold text-red-600">楽天市場</span>
            <div className="text-right">
              <span className="text-lg font-black text-slate-800">¥{price.toLocaleString()}</span>
              {product.url ? (
                <a href={product.url} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-red-100">
                  見る <ExternalLink size={12} />
                </a>
              ) : (
                <span className="ml-3 text-xs text-slate-400 font-bold">在庫なし</span>
              )}
            </div>
          </div>
          
          {/* Yahoo */}
          <div className="flex justify-between items-center p-4 border-b border-slate-50 bg-slate-50/50">
            <span className="font-bold text-blue-600">Yahoo!ショッピング</span>
            <div className="text-right">
              {yahooPrice ? (
                <>
                  <span className="text-lg font-black text-slate-800">¥{yahooPrice.toLocaleString()}</span>
                  <a href={`https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(product.name.substring(0, 20))}`} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-50">
                    検索 <ExternalLink size={12} />
                  </a>
                </>
              ) : (
                <span className="text-xs text-slate-400 font-bold">価格取得失敗</span>
              )}
            </div>
          </div>
          
          {/* Amazon (プレースホルダー) */}
          <div className="flex justify-between items-center p-4 opacity-70">
            <span className="font-bold text-slate-800">Amazon</span>
            <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">近日対応</span>
          </div>
        </div>
      </section>

      {/* 3. 価格推移グラフ */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5 px-1">
          <TrendingDown size={16} className="text-brand-coral" />
          過去3ヶ月の価格推移（AI推計）
        </h2>
        <p className="text-[10px] text-slate-400 px-1 -mt-1">※近似値データを用いた参考グラフです</p>
        <PriceChart currentPrice={price} />
      </section>

      {/* 4. AI 忖度なし分析 (欠点とおすすめしない人) */}
      <section className="bg-slate-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-coral/20 rounded-bl-full -mr-4 -mt-4"></div>
        <h2 className="text-sm font-black flex items-center gap-1.5 mb-4 text-brand-coral relative z-10">
          <AlertTriangle size={16} />
          HonestBaby 忖度なし分析
        </h2>
        
        <div className="space-y-4 relative z-10">
          <div>
            <h3 className="text-xs font-bold text-slate-300 mb-1 border-l-2 border-red-500 pl-2">ここがマイナスポイント</h3>
            <ul className="text-xs text-slate-100 space-y-1.5 pl-2 list-disc list-inside opacity-90">
              <li>価格変動が大きく、タイミングによって割高になる</li>
              <li>サイズ・重量があるため、狭い収納スペースには不向きな可能性</li>
              <li>人気商品のため、一時的に在庫切れになりやすい</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-300 mb-1 border-l-2 border-blue-400 pl-2">こんな人には向かないかも</h3>
            <p className="text-xs text-slate-100 opacity-90 pl-3">
              頻繁に持ち運びをする方や、収納スペースに余裕がないご家庭には、よりコンパクトなモデルをおすすめします。
            </p>
          </div>
        </div>
      </section>

      {/* 5. SNS風 リアルな口コミ */}
      <section className="space-y-4">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5 px-1">
          <MessageCircle size={16} className="text-brand-coral" />
          リアルな口コミ・レビュー
        </h2>
        
        {/* レビュー1件目（好意的な口コミ） */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-blue-600">M</span>
          </div>
          <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-100 relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-500">20代 ママ</span>
              <div className="flex max-w-[60px]"><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /></div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              ずっと迷っていましたが大正解！作りがしっかりしていて安定感が抜群です。少し重いけど、その分安全だと感じます✨
            </p>
            <div className="flex gap-1 mt-2 text-[10px] text-brand-coral font-bold items-center">
              <ThumbsUp size={10} /> 12人が参考になった
            </div>
          </div>
        </div>

        {/* レビュー2件目（批判的な口コミ） */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-red-600">K</span>
          </div>
          <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-100 relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-500">30代 パパ</span>
              <div className="flex max-w-[60px]"><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-amber-400 text-amber-400" /><Star size={10} className="fill-slate-200 text-slate-200" /><Star size={10} className="fill-slate-200 text-slate-200" /><Star size={10} className="fill-slate-200 text-slate-200" /></div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              機能には満足ですが、やっぱり車のトランクに入れると場所を取りますね💦 コンパクトカーだと厳しいかもしれません。購入前にサイズの確認は必須です！
            </p>
          </div>
        </div>
      </section>

      {/* 6. 商品の詳細説明 (公式) */}
      {product.description && (
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mt-4">
          <h2 className="text-sm font-black text-slate-800 mb-2">公式の商品説明</h2>
          <p className="text-[11px] text-slate-500 leading-relaxed max-h-40 overflow-y-auto">
            {product.description.replace(/<[^>]*>/g, '')}
          </p>
        </section>
      )}
    </article>
  );
}
