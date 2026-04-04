import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Search } from 'lucide-react';
import { products } from '../data/products';

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrcodeScanner;
    
    // Slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        html5QrcodeScanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1 },
          /* verbose= */ false
        );
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      } catch (err) {
        setError('カメラインスタンスの初期化に失敗しました。');
      }
    }, 100);

    function onScanSuccess(decodedText) {
      // Find matching product by JAN
      const matched = products.find(p => p.jan === decodedText);
      if (matched) {
        setScanResult(matched);
        html5QrcodeScanner.clear();
      } else {
        setError(`バーコード「${decodedText}」はまだ登録されていません。`);
        // setTimeout(() => setError(''), 3000);
      }
    }

    function onScanFailure(error) {
      // ignore
    }

    return () => {
      clearTimeout(timer);
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, []);

  return (
    <div className="space-y-6 pb-10 fade-in">
      <div className="text-center mt-2">
        <h2 className="text-xl font-bold text-slate-800 flex justify-center items-center gap-2">
          <Camera size={24} className="text-brand-coral" />
          バーコードスキャン
        </h2>
        <p className="text-sm text-slate-500 mt-2">店頭の商品のJANコードを読み取って、最安値やクチコミを確認します。</p>
      </div>

      {!scanResult && (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div id="reader" className="w-full h-auto overflow-hidden rounded-xl"></div>
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>
      )}

      {scanResult && (
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 animate-slide-up">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
              <img src={scanResult.imageUrl} alt={scanResult.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-coral bg-brand-coral/10 px-2 py-0.5 rounded-full">{scanResult.category}</span>
              <h3 className="font-bold text-slate-800 leading-tight mt-1">{scanResult.name}</h3>
              <p className="text-xs text-slate-500 mt-1">JAN: {scanResult.jan}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="w-full bg-brand-navy text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md">
              <Search size={18} />
              口コミ・比較を見る
            </button>
            <button 
              onClick={() => {
                setScanResult(null);
                setError('');
                window.location.reload(); // Simple way to restart scanner in PWA
              }}
              className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
            >
              もう一度スキャン
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
