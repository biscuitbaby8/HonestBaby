import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { searchRakutenProducts } from '../api/rakuten';
import { products as mockProducts } from '../data/products';

const GENRE_MAP = {
  'ベビーカー': '200424',
  'チャイルドシート': '200425',
  '抱っこ紐': '200426',
  'ベビーベッド': '200427',
  'おもちゃ': '200428',
};

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchKeyword = searchParams.get('q');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all');

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const genreId = GENRE_MAP[categoryFilter];
        const results = await searchRakutenProducts({ 
          keyword: searchKeyword || categoryFilter || 'ベビー用品',
          categoryId: genreId,
          sort: filterMode === 'lowest_price' ? '+itemPrice' : 'standard'
        });
        
        // Merge with mock products if it's a matching category to show "Honest Reviews"
        const localMatches = mockProducts.filter(p => 
          p.category === categoryFilter || 
          (searchKeyword && p.name.includes(searchKeyword))
        );
        
        // dedupe and prioritize local (mock) products for rich data
        const combined = [...localMatches, ...results.filter(r => !localMatches.some(l => l.specs?.jan === r.specs?.jan))];
        setProducts(combined);
      } catch (error) {
        console.error(error);
        setProducts(mockProducts); // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryFilter, searchKeyword, filterMode]);

  return (
    <div className="space-y-6 pb-10 fade-in">
      <div className="flex items-center justify-between mt-2">
        <h2 className="text-xl font-bold text-slate-800">
          {searchKeyword ? `「${searchKeyword}」の検索結果` : (categoryFilter ? `${categoryFilter}の一覧` : 'すべての商品')}
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">最新データを取得中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {products.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              該当する商品が見つかりませんでした。
            </div>
          )}
        </>
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
