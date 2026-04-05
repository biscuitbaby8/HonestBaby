import { Calculator } from 'lucide-react';

export default function UnitCostCalculator({ itemPrice, itemName }) {
  if (!itemPrice || !itemName) return null;

  let unitCount = 0;
  let unitName = '枚';

  const parseQuantity = (name) => {
    // Match patterns like "80枚", "400g", "800ml", "20枚×3", "400g*2"
    // Also matches half-width and full-width numbers partially if normalized, but let's assume basic numbers
    const hankakuName = name.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    
    const regex = /(\d+)\s*(枚|ml|g|パック|個|本)(?:\s*[x×*]\s*(\d+))?/;
    const match = hankakuName.match(regex);
    if (match) {
      unitName = match[2];
      const baseCount = parseInt(match[1], 10);
      const multiplier = match[3] ? parseInt(match[3], 10) : 1;
      return baseCount * multiplier;
    }
    return 0;
  };

  unitCount = parseQuantity(itemName);

  if (unitCount === 0) return null;

  const costPerUnit = Math.round((itemPrice / unitCount) * 10) / 10;

  return (
    <div className="flex items-center gap-1.5 bg-brand-coral/10 text-brand-coral px-2 py-0.5 rounded-md text-[10px] font-bold w-fit mt-1.5">
      <Calculator size={10} />
      1{unitName}あたり: <span className="text-xs tracking-tight">¥{costPerUnit}</span>
    </div>
  );
}
