import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Star, ExternalLink, Loader2, Store } from 'lucide-react';
import { getProductById } from '../api/rakuten';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      if (id.startsWith('r-')) {
        const remoteProduct = await getProductById(id);
        setProduct(remoteProduct);
      }
      setLoading(false);
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm font-medium">詳細情報を取得中...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
        <p className="text-sm">商品が見つかりませんでした。</p>
        <button 
          onClick={() => navigate(-1)} 
          className="text-brand-coral font-bold text-sm"
        >
          ← 戻る
        </button>
      </div>
    );
  }

  const price = product.price || 0;
  const rating = product.rating || 0;

  return (
    <article className="pb-10 fade-in">
      {/* 戻るボタン */}
      <nav className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-xs font-bold text-slate-400">商品詳細</span>
      </nav>

      {/* 商品画像 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 p-4">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full max-h-72 object-contain mx-auto"
        />
      </div>

      {/* ショップ名 */}
      {product.shopName && (
        <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-400">
          <Store size={12} />
          <span>{product.shopName}</span>
        </div>
      )}

      {/* 商品名・評価・価格 */}
      <header className="mt-2 mb-6">
        <h1 className="text-lg font-black text-slate-800 leading-snug">
          {product.name}
        </h1>

        {rating > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-slate-600">{rating.toFixed(1)}</span>
            {product.reviewCount > 0 && (
              <span className="text-xs text-slate-400">({product.reviewCount}件のレビュー)</span>
            )}
          </div>
        )}

        <div className="mt-3">
          <span className="text-2xl font-black text-brand-coral">
            ¥{price.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 ml-1">(税込)</span>
        </div>
      </header>

      {/* 購入ボタン */}
      {product.url && (
        <a 
          href={product.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-brand-coral text-white font-bold py-3.5 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all mb-6"
        >
          <ExternalLink size={16} />
          この商品を購入する
        </a>
      )}

      {/* 商品説明 */}
      {product.description && (
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h2 className="text-sm font-black text-slate-800 mb-2">商品の説明</h2>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-[10]">
            {product.description.replace(/<[^>]*>/g, '')}
          </p>
        </section>
      )}
    </article>
  );
}
