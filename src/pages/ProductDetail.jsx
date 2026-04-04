import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, ExternalLink, ShieldCheck } from 'lucide-react';
import { products } from '../data/products';
import { prices } from '../data/prices';
import DrawbackSummary from '../components/DrawbackSummary';
import FitChecker from '../components/FitChecker';
import PriceComparison from '../components/PriceComparison';
import UsedMarket from '../components/UsedMarket';
import PriceAlert from '../components/PriceAlert';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        商品が見つかりませんでした。
        <button onClick={() => navigate(-1)} className="text-brand-coral font-bold mt-4">戻る</button>
      </div>
    );
  }

  const currentPrice = prices[product.id]?.amazon?.price || 0; // Using Amazon as baseline

  return (
    <article className="pb-10 fade-in">
      {/* Top Nav */}
      <nav className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <span className="text-xs font-bold text-slate-500">{product.category}</span>
      </nav>

      {/* Hero Image */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 aspect-square w-full relative">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
      </div>

      {/* Header Info */}
      <header className="mt-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-black text-brand-coral bg-brand-coral/10 px-2 py-0.5 rounded uppercase tracking-wider">
            {product.brand}
          </span>
          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs font-bold px-2 py-0.5 rounded">
            <Star size={12} className="fill-yellow-500 text-yellow-500" />
            {product.rating}
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-800 leading-tight">
          {product.name}
        </h1>
        
        {/* Feature Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {product.features.map(feature => (
            <span key={feature} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
              {feature}
            </span>
          ))}
        </div>
      </header>

      {/* Main Analysis Sections */}
      <section>
        <h2 className="sr-only">レビューと欠点分析</h2>
        <DrawbackSummary drawbacks={product.drawbacksSummary} />
      </section>

      <section>
        <h2 className="sr-only">環境適合性シミュレーター</h2>
        <FitChecker product={product} />
      </section>

      <section>
        <PriceComparison productId={product.id} />
      </section>

      <section>
        <UsedMarket productId={product.id} />
      </section>

      <section>
        <PriceAlert productId={product.id} currentPrice={prices[product.id]?.amazon?.price} />
      </section>

      {/* Footer Specification */}
      <section className="mt-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck size={18} className="text-brand-coral" />
          商品スペック
        </h3>
        <dl className="text-sm divide-y divide-slate-50">
          <div className="py-2 flex justify-between">
            <dt className="text-slate-500">重量</dt>
            <dd className="font-medium text-slate-800">{product.weight} kg</dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="text-slate-500">JANコード</dt>
            <dd className="font-medium text-slate-800">{product.jan}</dd>
          </div>
          {product.dimensions && (
            <div className="py-2 flex justify-between">
              <dt className="text-slate-500">展開時サイズ</dt>
              <dd className="font-medium text-slate-800 text-right">
                W{product.dimensions.width} × D{product.dimensions.depth} × H{product.dimensions.height} cm
              </dd>
            </div>
          )}
        </dl>
      </section>
    </article>
  );
}
