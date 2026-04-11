import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const Settings = () => {
  const [notifications, setNotifications] = useState(false);
  
  useEffect(() => {
    // Load from local storage
    const saved = localStorage.getItem('hb_notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const handleNotificationChange = (e) => {
    const val = e.target.checked;
    setNotifications(val);
    localStorage.setItem('hb_notifications', JSON.stringify(val));
  };

  const handleClearCache = () => {
    if (window.confirm('検索履歴やキャッシュを削除しますか？')) {
      const notes = localStorage.getItem('hb_notifications');
      localStorage.clear();
      // Restore settings
      if (notes) localStorage.setItem('hb_notifications', notes);
      alert('キャッシュを削除しました！');
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Helmet>
        <title>設定 | HonestBaby</title>
      </Helmet>

      <header className="bg-white p-4 shadow-sm top-0 z-10 sticky">
        <h1 className="text-xl font-bold text-gray-800 text-center">設定</h1>
      </header>

      <main className="flex-1 p-4 w-full max-w-lg mx-auto">
        
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">アプリ設定</h2>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-gray-800 font-medium">プッシュ通知</p>
              <p className="text-xs text-gray-500">おトクな情報や価格変動をお知らせします</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={notifications} onChange={handleNotificationChange} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-gray-800 font-medium">キャッシュの削除</p>
              <p className="text-xs text-gray-500">動作が重い場合にお試しください</p>
            </div>
            <button 
              onClick={handleClearCache}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              削除
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">アプリ情報</h2>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="text-gray-800 font-medium">バージョン</p>
            <p className="text-gray-500">1.0.0</p>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <p className="text-gray-800 font-medium">デベロッパー</p>
            <p className="text-gray-500">HonestBaby Team</p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Settings;
