import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home, MessageCircleHeart, ScanLine, User, Settings, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const MENU_LINKS = [
  { to: '/', label: 'ホーム' },
  { to: '/products?category=ベビーカー', label: 'ベビーカー' },
  { to: '/products?category=チャイルドシート', label: 'チャイルドシート' },
  { to: '/products?category=オムツ', label: 'オムツ' },
  { to: '/products?category=粉ミルク', label: '粉ミルク' },
  { to: '/products?category=おしりふき', label: 'おしりふき' },
  { to: '/chat', label: 'AI相談' },
  { to: '/privacy', label: 'プライバシーポリシー' },
  { to: '/terms', label: '利用規約' },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Helmet>
        <title>HonestBaby | 忖度なしベビー用品比較アプリ</title>
        <meta name="description" content="AIがパパママの悩みに寄り添い、忖度なしでベビーグッズを提案・比較するPWAアプリです。実質最安値や欠点を正直にレビューします。" />
        <meta property="og:title" content="HonestBaby | 忖度なしベビー用品比較アプリ" />
        <meta property="og:description" content="AIが忖度なしでベビーグッズを提案。本当の最安値も見つかります。" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* ヘッダー */}
      <header className="fixed top-0 w-full z-50 glass px-4 py-3 border-b flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-brand-coral tracking-wide">HonestBaby</Link>
        <button 
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors" 
          aria-label="メニューを開く"
          onClick={() => setMenuOpen(true)}
        >
          <div className="w-5 h-0.5 bg-brand-navy mb-1 rounded-full"></div>
          <div className="w-5 h-0.5 bg-brand-navy mb-1 rounded-full"></div>
          <div className="w-5 h-0.5 bg-brand-navy rounded-full"></div>
        </button>
      </header>

      {/* スライドメニュー（オーバーレイ） */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* 背景の暗幕 */}
          <div 
            className="absolute inset-0 bg-black/40" 
            onClick={() => setMenuOpen(false)}
          />
          {/* メニュー本体 */}
          <nav className="relative w-72 bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-black text-brand-coral">メニュー</span>
              <button 
                onClick={() => setMenuOpen(false)} 
                className="p-1 rounded-full hover:bg-slate-100"
                aria-label="メニューを閉じる"
              >
                <X size={22} className="text-slate-500" />
              </button>
            </div>
            <ul className="space-y-1">
              {MENU_LINKS.map(link => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-brand-beige hover:text-brand-coral transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <main className="flex-1 mt-14 p-4 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {/* フッター */}
      <footer className="w-full text-center py-6 pb-24 text-[10px] text-slate-400">
        <div className="flex justify-center gap-4 mb-2">
          <Link to="/privacy" className="hover:text-slate-600 underline underline-offset-2">プライバシーポリシー</Link>
          <Link to="/terms" className="hover:text-slate-600 underline underline-offset-2">利用規約</Link>
        </div>
        <p>&copy; 2026 HonestBaby. All rights reserved.</p>
      </footer>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 w-full z-50 glass border-t flex justify-around items-end h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        <NavItem to="/" icon={<Home size={22} />} label="ホーム" />
        <NavItem to="/chat" icon={<MessageCircleHeart size={22} />} label="AI相談" />
        
        {/* スキャンボタン */}
        <div className="relative -top-4">
          <NavLink 
            to="/scanner" 
            className={({ isActive }) => 
              `w-12 h-12 rounded-full flex justify-center items-center shadow-lg transition-transform ${
                isActive ? 'bg-brand-coral scale-110' : 'bg-white border-2 border-brand-coral/20 hover:scale-105'
              }`
            }
          >
            {({ isActive }) => (
              <ScanLine size={24} className={isActive ? 'text-white' : 'text-brand-coral'} />
            )}
          </NavLink>
        </div>

        <NavItem to="/profile" icon={<User size={22} />} label="プロフ" />
        <NavItem to="/settings" icon={<Settings size={22} />} label="設定" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex flex-col items-center justify-center w-14 h-14 space-y-0.5 transition-colors ${
          isActive ? 'text-brand-coral' : 'text-slate-400 hover:text-slate-600'
        }`
      }
    >
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
    </NavLink>
  );
}
