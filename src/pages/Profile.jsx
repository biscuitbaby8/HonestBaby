import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { User, Car, DoorOpen, Home as HomeIcon, ArrowUpSquare } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(storage.getProfile());
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    storage.saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 pb-10 fade-in">
      <div className="text-center mt-2">
        <h2 className="text-xl font-bold text-slate-800 flex justify-center items-center gap-2">
          <User size={24} className="text-brand-coral" />
          環境プロフィール
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed px-4">
          登録したデータをもとに、商品の「物理適合性（家や車に入るか）」をAIが判定します。
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
        
        {/* Car Type */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Car size={16} className="text-slate-400" />
            車種・トランク容量
          </label>
          <select 
            name="carType" 
            value={profile.carType} 
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral transition-colors text-sm"
          >
            <option value="none">車なし</option>
            <option value="kei">軽自動車（N-BOXなど）</option>
            <option value="compact">コンパクトカー（ヤリスなど）</option>
            <option value="minivan">ミニバン（セレナなど）</option>
          </select>
        </div>

        {/* Door Width */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <DoorOpen size={16} className="text-slate-400" />
            玄関の幅・収納スペース (cm)
          </label>
          <input 
            type="number" 
            name="doorWidth" 
            value={profile.doorWidth} 
            onChange={handleChange}
            placeholder="例: 80"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral transition-colors text-sm"
          />
        </div>

        {/* Living Area */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <HomeIcon size={16} className="text-slate-400" />
            リビングの広さ (畳)
          </label>
          <select 
            name="livingArea" 
            value={profile.livingArea} 
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral transition-colors text-sm"
          >
            <option value="6">~6畳</option>
            <option value="10">8~10畳</option>
            <option value="15">12~15畳</option>
            <option value="20">15畳~</option>
          </select>
        </div>

        {/* Elevator Toggle */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <ArrowUpSquare size={16} className="text-slate-400" />
            エレベーターの有無
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              name="hasElevator" 
              checked={profile.hasElevator} 
              onChange={handleChange}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-coral"></div>
          </label>
        </div>

      </div>

      <button 
        onClick={handleSave}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${saved ? 'bg-green-500 text-white' : 'bg-brand-navy text-white active:scale-95'}`}
      >
        {saved ? '保存しました！' : 'プロフィールを保存'}
      </button>

    </div>
  );
}
