import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { Ruler, CheckCircle, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FitChecker({ product }) {
  const [profile, setProfile] = useState(storage.getProfile());
  const [fitStatus, setFitStatus] = useState('unknown'); // 'ok', 'warning', 'unknown'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!product.dimensions) return;
    
    // Simplistic mockup logic for simulation
    let status = 'ok';
    let msg = 'あなたのプロフィール環境に適合しています。';

    if (product.category === 'チャイルドシート') {
      if (profile.carType === 'kei' && product.dimensions.width > 42) {
        status = 'warning';
        msg = '軽自動車には大きすぎます。隣の席がかなり窮屈になります。';
      } else if (profile.carType === 'none') {
         status = 'unknown';
         msg = '車を所持していない設定になっています。';
      }
    }

    if (product.category === 'ベビーカー') {
      if (profile.doorWidth && profile.doorWidth < product.dimensions.width + 5) {
        status = 'warning';
        msg = `玄関の幅(${profile.doorWidth}cm)に対して、開いた状態での余裕がありません。`;
      }
    }

    setFitStatus(status);
    setMessage(msg);
  }, [product, profile]);

  if (!product.dimensions) return null;

  return (
    <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 shadow-sm mt-6 relative overflow-hidden">
      {/* Background decoration */}
      <Ruler size={100} className="absolute -top-4 -right-4 text-slate-100" />
      
      <div className="relative z-10">
        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-3">
          <Ruler size={16} /> 物理適合性チェック
        </h3>

        {fitStatus === 'ok' && (
          <div className="flex gap-3 bg-green-50 p-3 rounded-2xl border border-green-100 items-start">
            <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-bold text-green-800 leading-snug">{message}</p>
          </div>
        )}

        {fitStatus === 'warning' && (
          <div className="flex gap-3 bg-orange-50 p-3 rounded-2xl border border-orange-100 items-start">
            <AlertOctagon className="text-orange-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-bold text-orange-800 leading-snug">{message}</p>
          </div>
        )}

        {fitStatus === 'unknown' && (
          <div className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-200 items-start">
            <p className="text-sm text-slate-600 leading-snug">{message}</p>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center px-1">
          <div className="text-xs text-slate-500">
            比較基準: {profile.carType !== 'none' ? '車あり' : '車なし'} / 玄関 {profile.doorWidth}cm
          </div>
          <Link to="/profile" className="text-xs font-bold text-brand-coral bg-brand-coral/10 px-3 py-1 rounded-full">
            変更
          </Link>
        </div>
      </div>
    </div>
  );
}
