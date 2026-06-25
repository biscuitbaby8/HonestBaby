'use client';
import { Heart, Star, Award, ShieldCheck } from 'lucide-react';
import { getProxiedImage, getLowestPrice } from '../lib/products';

const ProductCard = ({ product, localRank = null, onOpen, onToggleFavorite, favoriteIds, isAdminMode, onBlock }) => (
  <div
    className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full relative active:scale-95 transition-all cursor-pointer border border-[#F4EFEB]"
    onClick={(e) => {
      if (e.target.closest('[data-no-open]')) return;
      onOpen(product);
    }}
  >
    <div className="relative aspect-square bg-[#F9F6F3] p-4">
      <img
        src={getProxiedImage(product.image, 'card')}
        onError={(e) => {
          // プロキシ失敗時は元の外部URLを直接 → それも失敗ならプレースホルダ。
          if (e.target.dataset.fb !== '1' && product.image) {
            e.target.dataset.fb = '1';
            e.target.src = product.image;
            return;
          }
          e.target.onerror = null;
          e.target.src = "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Baby";
        }}
        className="w-full h-full object-cover rounded-[1.5rem]"
        alt={product.name}
        loading="lazy"
        decoding="async"
      />
      <button
        onClick={(e) => onToggleFavorite(e, product)}
        className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-sm z-10 hover:bg-rose-50 transition-colors"
      >
        <Heart className={`w-4 h-4 ${favoriteIds.has(product.id) ? 'text-rose-400 fill-current' : 'text-[#D4CDC7]'}`} />
      </button>
      {isAdminMode && (
        <button
          data-no-open
          onPointerDown={(e) => { e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onBlock(product); }}
          title="この商品を非表示にする"
          style={{ touchAction: 'manipulation' }}
          className="absolute top-2 left-2 bg-red-500 text-white w-14 h-14 rounded-full text-2xl font-black shadow-2xl z-[999] flex items-center justify-center hover:bg-red-600 active:scale-90 transition-all border-4 border-white pointer-events-auto"
        >×</button>
      )}
      <div className="pointer-events-none">
        {localRank && (
          <div className="absolute top-6 left-6 bg-[#F9DC5C] text-[#5A4C4C] w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-md border-2 border-white">
            {localRank}
          </div>
        )}
        {product.isBestSeller && (
          <div className="absolute top-6 left-6 bg-[#F2ABAC] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black shadow-lg border-2 border-white z-20">
            <Award className="w-3.5 h-3.5" />
            <span>BEST SELLER</span>
          </div>
        )}
        {!product.isBestSeller && product.isTopRated && (
          <div className="absolute top-6 left-6 bg-[#7B8E76] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black shadow-lg border-2 border-white z-20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TOP RATED</span>
          </div>
        )}
      </div>
      <div className={`absolute bottom-6 left-6 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider ${product.subCategory === '周辺グッズ' ? 'bg-[#FFE8D6] text-[#A67B5B]' : 'bg-[#7B8E76] text-white'}`}>
        {product.subCategory}
      </div>
    </div>
    <div className="p-4 flex flex-col flex-1">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest">{product.category}</span>
        <div className="flex items-center gap-1 ml-auto bg-[#FFF9E6] px-2 py-0.5 rounded-full text-[#D4AF37]">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-[10px] font-black">{Number(product.rating).toFixed(2)}</span>
        </div>
      </div>
      <h3 className="text-sm font-bold text-[#5A4C4C] line-clamp-2 leading-snug mb-3">{product.name}</h3>

      <div className="mt-auto">
        {(product.shops?.length || 0) >= 2 && (
          <p className="text-[9px] text-[#7B8E76] font-black mb-1 uppercase tracking-wider">
            {product.shops.length}店舗で比較
          </p>
        )}
        {product.unitCount && (
          <p className="text-[10px] text-[#A5A19E] font-bold mb-1">
            1{product.unitName}あたり <span className="text-[#F2ABAC]">¥{Math.ceil(getLowestPrice(product.shops) / product.unitCount)}</span>
          </p>
        )}
        <p className="text-xl font-black text-[#7B8E76] leading-none">
          <span className="text-xs mr-0.5">¥</span>
          {getLowestPrice(product.shops) > 0 ? getLowestPrice(product.shops).toLocaleString() : "---"}
          <span className="text-[10px] text-[#A5A19E] ml-1 font-normal">{getLowestPrice(product.shops) > 0 ? "〜" : ""}</span>
        </p>
      </div>
    </div>
  </div>
);

export default ProductCard;
