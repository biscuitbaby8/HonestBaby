import { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, Calculator, Loader2 } from 'lucide-react';
import { searchRakutenProducts } from '../api/rakuten';
import { searchYahooProducts } from '../api/yahoo';
import { products as mockProducts } from '../data/products';
import { prices as mockPrices } from '../data/prices';

export default function PriceComparison({ productId }) {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      setLoading(true);
      try {
        const localProduct = mockProducts.find(p => p.id === productId);
        const searchQuery = localProduct ? localProduct.name : (productId.startsWith('r-') ? 'ベビーカー' : ''); // Fallback search

        // Fetch from APIs in parallel
        const [rakutenResults, yahooResults] = await Promise.all([
          searchRakutenProducts(searchQuery),
          searchYahooProducts(searchQuery)
        ]);

        const bestRakuten = rakutenResults[0] || (mockPrices[productId]?.rakuten ? { ...mockPrices[productId].rakuten, shopName: '楽天ショップ' } : null);
        const bestYahoo = yahooResults[0] || (mockPrices[productId]?.yahoo ? { ...mockPrices[productId].yahoo, shopName: 'Yahoo!ショッピング' } : null);
        const amazonData = mockPrices[productId]?.amazon || null;

        const results = [];
        if (amazonData) results.push({ name: 'Amazon', key: 'amazon', data: amazonData, color: 'bg-slate-800' });
        if (bestRakuten) results.push({ name: '楽天市場', key: 'rakuten', data: bestRakuten, color: 'bg-red-600' });
        if (bestYahoo) results.push({ name: 'Yahoo!', key: 'yahoo', data: bestYahoo, color: 'bg-blue-600' });

        const processed = results.map(site => ({
          ...site,
          actual: site.data.price + (site.data.shipping || 0) - (site.data.points || 0)
        })).sort((a, b) => a.actual - b.actual);

        setComparisonData(processed);
      } catch (error) {
        console.error('Failed to fetch comparison data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, [productId]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center justify-center py-10 text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-sm font-medium">価格情報を取得中...</span>
      </div>
    );
  }

  if (comparisonData.length === 0) return null;

  const bestSite = comparisonData[0];

  return (
    <div className="mt-8 space-y-4">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <ShoppingBag size={20} className="text-brand-coral" />
        自動・実質最安値比較
      </h3>

      {/* Best Deal Highlight */}
      <div className="bg-gradient-to-br from-brand-coral to-rose-400 p-5 rounded-3xl text-white shadow-md relative overflow-hidden">
        <Calculator size={80} className="absolute -right-4 -bottom-4 text-white/10" />
        <div className="relative z-10">
          <div className="text-xs font-bold bg-white/20 inline-block px-2 py-1 rounded mb-2">
            🥇 実質最安値 ({bestSite.data.shopName || bestSite.name})
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm font-medium">{bestSite.name}</div>
              <div className="text-3xl font-black mt-1">¥{bestSite.actual.toLocaleString()}</div>
            </div>
            <a 
              href={bestSite.data.link || bestSite.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-brand-coral font-bold text-sm px-4 py-2 rounded-full shadow-sm active:scale-95 transition-transform flex items-center gap-1"
            >
              見に行く <ChevronRight size={14} />
            </a>
          </div>
          <div className="text-xs mt-3 flex flex-wrap gap-3 opacity-90 font-medium">
            <span>本体: ¥{bestSite.data.price.toLocaleString()}</span>
            {bestSite.data.shipping > 0 && <span>送料: ¥{bestSite.data.shipping.toLocaleString()}</span>}
            <span>還元: {bestSite.data.points.toLocaleString()}pt</span>
          </div>
        </div>
      </div>

      {/* Other Sites */}
      <div className="space-y-2">
        {comparisonData.slice(1).map(site => (
          <a 
            key={site.name}
            href={site.data.link || site.data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${site.color}`} />
              <div>
                <div className="text-sm font-bold text-slate-800">{site.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">実質 ¥{site.actual.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-700">¥{site.data.price.toLocaleString()}</span>
              <span className="text-[10px] text-green-500 font-bold bg-green-50 px-1 py-[1px] rounded mt-1">
                {site.data.points}pt還元
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
