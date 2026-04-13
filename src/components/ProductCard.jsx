import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2NiZDVlMSI+5ZWG5ZOB55S75YOP44Gq44GNPC90ZXh0Pjwvc3ZnPg==';

export default function ProductCard({ product }) {
  const price = product.price || 0;
  const rating = product.rating || 0;
  const reviewCount = product.reviewCount || 0;

  return (
    <Link 
      to={`/product/${product.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-[0.97]"
    >
      {/* 商品画像 */}
      <div className="h-40 bg-slate-50 relative overflow-hidden">
        <img 
          src={product.image || product.imageUrl || FALLBACK_IMAGE} 
          alt={product.name}
          className="w-full h-full object-contain p-2"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
      </div>

      {/* 商品情報 */}
      <div className="p-3">
        <h3 className="font-bold text-slate-800 text-xs line-clamp-2 leading-snug min-h-[2.5em]">
          {product.name}
        </h3>
        
        {/* 評価 */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-slate-600">{rating.toFixed(1)}</span>
            {reviewCount > 0 && (
              <span className="text-[10px] text-slate-400">({reviewCount}件)</span>
            )}
          </div>
        )}

        {/* 価格 */}
        <div className="mt-2">
          <span className="text-lg font-black text-brand-coral">
            ¥{price.toLocaleString()}
          </span>
        </div>

        {/* ショップ名 */}
        {product.shopName && (
          <p className="text-[10px] text-slate-400 mt-1 truncate">{product.shopName}</p>
        )}
      </div>
    </Link>
  );
}
