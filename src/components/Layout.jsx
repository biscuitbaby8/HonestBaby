import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home, MessageCircleHeart, ScanLine, User, Settings } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Helmet>
        <title>HonestBaby | 忖度なしベビー用品比較アプリ</title>
        <meta name="description" content="AIがパパママの悩みに寄り添い、忖度なしでベビーグッズを提案・比較するPWAアプリです。実質最安値や欠点を正直にレビューします。" />
        <meta property="og:title" content="HonestBaby | 忖度なしベビー用品比較アプリ" />
        <meta property="og:description" content="AIが忖度なしでベビーグッズを提案。本当の最安値も見つかります。" />
        <meta property="og:type" content="website" />
      </Helmet>
      <header className="fixed top-0 w-full z-50 glass px-4 py-3 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold text-brand-coral tracking-wide">HonestBaby</h1>
        <button className="p-2" aria-label="Menu">
          <div className="w-6 h-0.5 bg-brand-navy mb-1.5 rounded-full"></div>
          <div className="w-6 h-0.5 bg-brand-navy mb-1.5 rounded-full"></div>
          <div className="w-6 h-0.5 bg-brand-navy rounded-full"></div>
        </button>
      </header>

      <main className="flex-1 mt-14 p-4 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {/* Footer / Legal Links */}
      <footer className="w-full text-center py-6 pb-24 text-[10px] text-slate-400">
        <div className="flex justify-center gap-4 mb-2">
          <Link to="/privacy" className="hover:text-slate-600 underline underline-offset-2">プライバシーポリシー</Link>
          <Link to="/terms" className="hover:text-slate-600 underline underline-offset-2">利用規約</Link>
        </div>
        <p>&copy; 2026 HonestBaby. All rights reserved.</p>
      </footer>

      <nav className="fixed bottom-0 w-full z-50 glass border-t flex justify-around items-end h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        <NavItem to="/" icon={<Home size={24} />} label="ホーム" />
        <NavItem to="/chat" icon={<MessageCircleHeart size={24} />} label="AI相談" />
        
        {/* Floating Scan Button */}
        <div className="relative -top-5">
          <NavLink 
            to="/scanner" 
            className={({ isActive }) => 
              `w-14 h-14 rounded-full flex justify-center items-center shadow-lg transition-transform ${
                isActive ? 'bg-brand-coral scale-110' : 'bg-white border-2 border-brand-coral/20 hover:scale-105'
              }`
            }
          >
            {({ isActive }) => (
              <ScanLine size={28} className={isActive ? 'text-white' : 'text-brand-coral'} />
            )}
          </NavLink>
        </div>

        <NavItem to="/profile" icon={<User size={24} />} label="プロフ" />
        <NavItem to="/settings" icon={<Settings size={24} />} label="設定" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex flex-col items-center justify-center w-16 h-14 space-y-1 transition-colors ${
          isActive ? 'text-brand-coral' : 'text-slate-400 hover:text-slate-600'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
