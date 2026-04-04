import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  const [filterMode, setFilterMode] = useState('all'); // all, highest_rated, lowest_price

  // Simple filtering & sorting
  let filteredProducts = [...products];
  
  if (categoryFilter) {
    filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
  }

  if (filterMode === 'highest_rated') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="space-y-6 pb-10 fade-in">
      <div className="flex items-center justify-between mt-2">
        <h2 className="text-xl font-bold text-slate-800">
          {categoryFilter ? `${categoryFilter}の一覧` : 'すべての商品'}
        </h2>
        <button className="flex items-center gap-1 text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200">
          <Filter size={14} />
          絞り込み
        </button>
      </div>

      {/* Quick Sort Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        <Chip 
          label="おすすめ順" 
          active={filterMode === 'all'} 
          onClick={() => setFilterMode('all')} 
        />
        <Chip 
          label="評価が高い順" 
          active={filterMode === 'highest_rated'} 
          onClick={() => setFilterMode('highest_rated')} 
        />
        <Chip 
          label="実質最安値順" 
          active={filterMode === 'lowest_price'} 
          onClick={() => setFilterMode('lowest_price')} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          該当する商品が見つかりませんでした。
        </div>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
        active 
          ? 'bg-brand-navy text-white' 
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}
