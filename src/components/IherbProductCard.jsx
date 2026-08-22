import { getProxiedImage, getLowestPrice, cleanProductName } from '../lib/products';

// ProductCardLink と同じ見た目だが、内部の /product/[id] を経由せず
// iHerb（Partnerize経由のアフィリエイトURL）へ直接遷移する外部リンクカード。
export default function IherbProductCard({ product }) {
  const iherbShop = product.shops?.find((s) => s.name === 'iHerb');
  const href = iherbShop?.url;
  if (!href) return null;

  const price = getLowestPrice(product.shops);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      data-cta-position="iherb-product-grid"
      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full relative border border-[#F4EFEB] active:scale-95 transition-all"
    >
      <div className="relative aspect-square bg-[#F9F6F3] p-4">
        <img
          src={getProxiedImage(product.image, 'card')}
          className="w-full h-full object-cover rounded-[1.5rem]"
          alt={product.name}
          width={600}
          height={600}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute bottom-6 left-6 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider bg-[#4C9A87] text-white">
          iHerb
        </div>
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
        <h3 className="text-sm font-bold text-[#5A4C4C] line-clamp-2 leading-snug mb-3">{cleanProductName(product.name, 60)}</h3>
        <div className="mt-auto">
          <p className="text-xl font-black text-[#4C9A87] leading-none">
            <span className="text-xs mr-0.5">¥</span>
            {price > 0 ? price.toLocaleString() : '---'}
            <span className="text-[10px] text-[#A5A19E] ml-1 font-normal">{price > 0 ? '〜' : ''}</span>
          </p>
        </div>
      </div>
    </a>
  );
}
