import Link from 'next/link';
import { getHighResImage, getLowestPrice } from '../lib/products';

// サーバーコンポーネント: 商品カードを /product/[id] への <a> リンクとして描画。
// Google がクロールできる実HTMLのリンク・商品情報を提供する。
export default function ProductCardLink({ product }) {
  const price = getLowestPrice(product.shops);
  return (
    <Link
      href={`/product/${encodeURIComponent(product.id)}`}
      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full relative border border-[#F4EFEB] active:scale-95 transition-all"
    >
      <div className="relative aspect-square bg-[#F9F6F3] p-4">
        <img
          src={getHighResImage(product.image)}
          className="w-full h-full object-cover rounded-[1.5rem]"
          alt={product.name}
        />
        {product.subCategory && (
          <div className="absolute bottom-6 left-6 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider bg-[#7B8E76] text-white">
            {product.subCategory}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest">{product.category}</span>
          {product.rating > 0 && (
            <div className="flex items-center gap-1 ml-auto bg-[#FFF9E6] px-2 py-0.5 rounded-full text-[#D4AF37]">
              <span className="text-[10px] font-black">★ {product.rating}</span>
            </div>
          )}
        </div>
        <h3 className="text-sm font-bold text-[#5A4C4C] line-clamp-2 leading-snug mb-3">{product.name}</h3>
        <div className="mt-auto">
          {(product.shops?.length || 0) >= 2 && (
            <p className="text-[9px] text-[#7B8E76] font-black mb-1 uppercase tracking-wider">
              {product.shops.length}店舗で比較
            </p>
          )}
          <p className="text-xl font-black text-[#7B8E76] leading-none">
            <span className="text-xs mr-0.5">¥</span>
            {price > 0 ? price.toLocaleString() : '---'}
            <span className="text-[10px] text-[#A5A19E] ml-1 font-normal">{price > 0 ? '〜' : ''}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
