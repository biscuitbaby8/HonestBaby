import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Loader2, SearchX } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { searchRakutenProducts } from '../api/rakuten';

// 楽天の正式ジャンルID
const GENRE_MAP = {
  'ベビーカー': '566382',
  'チャイルドシート': '566380',
  '抱っこ紐': '566381',
  'オムツ': '502978',
  '粉ミルク': '502981',
  'おしりふき': '502979',
  'ベビーベッド': '502954',
  'その他': '',
};

const SORT_OPTIONS = [
  { label: 'おすすめ順', value: 'standard' },
  { label: '価格が安い順', value: '+itemPrice' },
  { label: '価格が高い順', value: '-itemPrice' },
  { label: 'レビュー数順', value: '-reviewCount' },
];

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchKeyword = searchParams.get('q');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState('standard');

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const genreId = GENRE_MAP[categoryFilter] || '';
        const keyword = searchKeyword || categoryFilter || 'ベビー用品';
        
        const results = await searchRakutenProducts({ 
          keyword,
          categoryId: genreId || undefined,
          hits: 30,
          sort: sortMode,
        });
        
        setProducts(results);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryFilter, searchKeyword, sortMode]);

  const title = searchKeyword 
    ? `「${searchKeyword}」の検索結果` 
    : (categoryFilter ? `${categoryFilter}` : 'すべての商品');

  return (
    <div className="space-y-4 pb-10 fade-in">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mt-2">
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
        {!loading && (
          <span className="text-xs text-slate-400">{products.length}件</span>
        )}
      </div>

      {/* 並び替え */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortMode(opt.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
              sortMode === opt.value
                ? 'bg-brand-navy text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 商品一覧 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">商品を検索中...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <SearchX size={40} />
          <p className="text-sm font-medium">該当する商品が見つかりませんでした</p>
          <p className="text-xs text-slate-300">別のキーワードで検索してみてください</p>
        </div>
      )}
    </div>
  );
}
