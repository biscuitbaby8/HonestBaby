import { useState } from 'react';
import { Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const categories = [
    { name: 'ベビーカー', icon: '🛒' },
    { name: 'チャイルドシート', icon: '💺' },
    { name: '抱っこ紐', icon: '👶' },
    { name: 'ベビーベッド', icon: '🛏️' },
    { name: 'おもちゃ', icon: '🧸' },
    { name: 'その他', icon: '📦' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?q=${encodeURIComponent(keyword)}`);
    }
  };

  return (
    <div className="space-y-8 pb-10 fade-in">
      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-brand-coral to-rose-400 rounded-3xl p-6 text-white text-center shadow-xl transform transition-transform hover:scale-[1.01] mt-2">
        <h2 className="text-2xl font-bold mb-2">何をお探しですか？</h2>
        <p className="text-sm opacity-90 mb-6 font-medium">AIがお買い物のお悩み相談に乗ります</p>
        <form onSubmit={handleSearch} className="relative max-w-sm mx-auto">
          <input 
            type="text" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例: 1DKに収まるベビーカー..."
            className="w-full py-4 pl-5 pr-12 rounded-full text-brand-navy shadow-inner focus:outline-none focus:ring-4 focus:ring-white/50 border-none transition-all placeholder:text-slate-400"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-navy text-white p-2.5 rounded-full hover:bg-slate-800 transition-colors">
            <Search size={20} />
          </button>
        </form>
      </section>

      {/* Categories */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-lg text-slate-800">カテゴリから探す</h3>
          <span className="text-xs text-brand-coral font-medium">すべて見る</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {categories.map(cat => (
            <Link 
              key={cat.name} 
              to={`/products?category=${cat.name}`}
              className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:shadow-md cursor-pointer"
            >
              <div className="w-12 h-12 bg-brand-beige rounded-full flex items-center justify-center text-2xl shadow-inner">
                {cat.icon}
              </div>
              <span className="text-[11px] font-bold text-slate-700">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended Section Placeholder */}
      <section>
        <h3 className="font-bold text-lg text-slate-800 mb-4">あなたへのおすすめ</h3>
        <div className="bg-white rounded-2xl p-6 text-center text-slate-500 text-sm border border-slate-100 shadow-sm border-dashed">
          閲覧履歴やプロフィールから<br/>AIがおすすめ商品を提案します
        </div>
      </section>
    </div>
  )
}
