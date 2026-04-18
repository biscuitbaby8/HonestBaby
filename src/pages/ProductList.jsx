import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Loader2, SearchX } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { searchRakutenProducts } from '../api/rakuten';

const CATEGORY_CONFIG = {
  'ベビーカー': {
    main: { keyword: 'ベビーカー', minPrice: 10000, categoryId: '566382' },
    accTabs: ['レインカバー', 'フック', 'シート', 'バッグ', 'ドリンクホルダー']
  },
  'チャイルドシート': {
    main: { keyword: 'チャイルドシート', minPrice: 8000, categoryId: '566380' },
    accTabs: ['保護マット', 'カバー', '日よけ', 'クッション']
  },
  '抱っこ紐': {
    main: { keyword: '抱っこ紐', minPrice: 4000, categoryId: '566381' },
    accTabs: ['よだれカバー', '防寒ケープ', '収納カバー']
  },
  'ベビーベッド': {
    main: { keyword: 'ベビーベッド', minPrice: 8000, categoryId: '502954' },
    accTabs: ['布団セット', '防水シーツ', 'ベッドガード', 'メリー']
  },
  'オムツ': {
    main: { keyword: 'おむつ 箱', minPrice: 2000, categoryId: '502978' },
    accTabs: ['ごみ箱', 'おむつポーチ', '防臭袋', 'おむつ替えシート']
  },
  '粉ミルク': {
    main: { keyword: '粉ミルク 缶', minPrice: 1500, categoryId: '502981' },
    accTabs: ['哺乳瓶', 'ウォーマー', 'ミルケース', '消毒']
  },
  'おしりふき': {
    main: { keyword: 'おしりふき 箱', minPrice: 1000, categoryId: '502979' },
    accTabs: ['ウォーマー', 'ケース', 'フタ']
  },
  'おもちゃ(0〜3ヶ月)': {
    main: { keyword: 'おもちゃ 新生児', minPrice: 0, categoryId: '566395' }
  },
  'おもちゃ(3〜6ヶ月)': {
    main: { keyword: 'おもちゃ 3ヶ月', minPrice: 0, categoryId: '566395' }
  },
  'おもちゃ(6〜12ヶ月)': {
    main: { keyword: 'おもちゃ 6ヶ月', minPrice: 0, categoryId: '566395' }
  },
  'おもちゃ(1歳〜)': {
    main: { keyword: 'おもちゃ 1歳', minPrice: 0, categoryId: '566395' }
  }
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
  const [apiError, setApiError] = useState(null);
  const [listTab, setListTab] = useState('main'); // 'main' | 'acc'
  const [accSubTag, setAccSubTag] = useState('');

  const config = CATEGORY_CONFIG[categoryFilter];

  // カテゴリが変わったときにタブとサブタグをリセット
  useEffect(() => {
    setListTab('main');
    if (config?.accTabs) {
      setAccSubTag(config.accTabs[0]);
    }
  }, [categoryFilter]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        let keyword = searchKeyword || categoryFilter || 'ベビー用品';
        let minPrice = undefined;
        let categoryId = undefined;
        
        // タブに応じた強力な絞り込みロジック
        const UNIVERSAL_NEGATIVE = '-レンタル -部品 -パーツ -交換 -延長 -オプション -中古 -カバー -シート -マット -フック -レイン -保護';
        
        if (!searchKeyword && config) {
          if (listTab === 'main') {
            keyword = config.main.keyword + ' ' + UNIVERSAL_NEGATIVE;
            minPrice = config.main.minPrice;
            categoryId = config.main.categoryId;
          } else if (listTab === 'acc') {
            const baseName = categoryFilter.replace(/\(.*\)/, '');
            keyword = `${baseName} ${accSubTag}`;
          }
        }
        
        const results = await searchRakutenProducts({ 
          keyword,
          categoryId,
          minPrice,
          hits: 30,
          sort: sortMode,
        });
        
        if (results && results.error) {
          setApiError(results.error);
          setProducts([]);
        } else {
          setApiError(null);
          setProducts(results || []);
        }
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryFilter, searchKeyword, sortMode, listTab, accSubTag]);

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

      {/* タブナビゲーション（本体 vs 周辺グッズ）おもちゃ等accTabsが無い場合は非表示 */}
      {!searchKeyword && config && config.accTabs && (
        <div className="mb-2">
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setListTab('main')}
              className={`flex-1 py-2.5 text-[11px] font-black rounded-lg transition-all ${listTab === 'main' ? 'bg-white shadow-sm text-brand-navy' : 'text-slate-500 hover:bg-slate-200/50'}`}
            >
              本体・メイン
            </button>
            <button
              onClick={() => setListTab('acc')}
              className={`flex-1 py-2.5 text-[11px] font-black rounded-lg transition-all ${listTab === 'acc' ? 'bg-white shadow-sm text-brand-navy' : 'text-slate-500 hover:bg-slate-200/50'}`}
            >
              周辺グッズ・関連
            </button>
          </div>
          
          {/* 周辺グッズ用のサブタグ（チップ） */}
          {listTab === 'acc' && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 pb-1">
              {config.accTabs.map(tag => (
                <button
                  key={tag}
                  onClick={() => setAccSubTag(tag)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    accSubTag === tag
                      ? 'bg-brand-coral text-white shadow-sm shadow-brand-coral/30'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-brand-coral/40 hover:text-brand-coral'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
          {apiError && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-xs w-full overflow-auto max-w-sm">
              <span className="font-bold block mb-1">=== API エラー情報 ===</span>
              {apiError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
