import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { searchRakutenProducts } from '../api/rakuten';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [recommended, setRecommended] = useState([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const navigate = useNavigate();

  const categories = [
    { name: 'ベビーカー', icon: '🛒' },
    { name: 'チャイルドシート', icon: '💺' },
    { name: 'オムツ', icon: '🧷' },
    { name: '粉ミルク', icon: '🍼' },
    { name: 'おしりふき', icon: '🧻' },
    { name: 'その他', icon: '📦' },
    { name: 'おもちゃ(0〜3ヶ月)', icon: '🧸' },
    { name: 'おもちゃ(3〜6ヶ月)', icon: '🧩' },
    { name: 'おもちゃ(6〜12ヶ月)', icon: '🪀' },
    { name: 'おもちゃ(1歳〜)', icon: '🚙' },
  ];

  // おすすめ商品を自動取得
  useEffect(() => {
    async function loadRecommended() {
      setLoadingRec(true);
      try {
        const results = await searchRakutenProducts({
          keyword: 'ベビー用品 人気',
          hits: 4,
          sort: '-reviewCount',
        });
        setRecommended(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRec(false);
      }
    }
    loadRecommended();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?q=${encodeURIComponent(keyword)}`);
    }
  };

  return (
    <div className="space-y-6 pb-10 fade-in">
      {/* 検索エリア */}
      <section className="bg-gradient-to-br from-brand-coral to-rose-400 rounded-2xl p-5 text-white text-center shadow-lg mt-2">
        <h2 className="text-xl font-black mb-1">何をお探しですか？</h2>
        <p className="text-[11px] opacity-90 mb-4">ベビー用品を忖度なしで比較します</p>
        <form onSubmit={handleSearch} className="relative max-w-sm mx-auto">
          <input 
            type="text" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例: ベビーカー 軽量..."
            className="w-full py-3 pl-4 pr-11 rounded-full text-brand-navy text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-white/60 border-none placeholder:text-slate-400"
          />
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-navy text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
            <Search size={16} />
          </button>
        </form>
      </section>

      {/* カテゴリ */}
      <section>
        <h3 className="font-black text-base text-slate-800 mb-3">カテゴリから探す</h3>
        <div className="grid grid-cols-3 gap-2">
          {categories.map(cat => (
            <Link 
              key={cat.name} 
              to={`/products?category=${cat.name}`}
              className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all hover:shadow-md"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-[10px] font-bold text-slate-600">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* おすすめ商品 */}
      <section>
        <h3 className="font-black text-base text-slate-800 mb-3">人気の商品</h3>
        {loadingRec ? (
          <div className="text-center py-8 text-slate-400 text-sm">読み込み中...</div>
        ) : recommended.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recommended.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200">
            商品を読み込めませんでした
          </div>
        )}
      </section>
    </div>
  );
}
