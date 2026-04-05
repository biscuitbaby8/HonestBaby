import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { prices } from '../data/prices';
import UnitCostCalculator from './UnitCostCalculator';

export default function ProductCard({ product }) {
  const priceData = prices[product.id];
  const amazonPrice = priceData?.amazon?.price || 0;

  return (
    <Link 
      to={`/product/${product.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95"
    >
      <div className="h-40 bg-slate-100 relative">
        <img src={product.imageUrl || product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 bg-brand-coral text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
          {product.category || 'その他'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <UnitCostCalculator itemPrice={product.price} itemName={product.name} />
        
        <div className="flex items-center gap-1 mt-2">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-slate-700">{product.rating}</span>
        </div>

        <div className="mt-3 flex justify-between items-end">
          <div>
            <span className="text-[10px] text-slate-400 block">Amazon価格</span>
            <span className="text-lg font-bold text-slate-800">¥{amazonPrice.toLocaleString()}</span>
          </div>
          <div className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-md">
            忖度なしレビュー
          </div>
        </div>
      </div>
    </Link>
  );
}
