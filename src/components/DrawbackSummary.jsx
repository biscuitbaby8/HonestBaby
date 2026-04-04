import { AlertTriangle, ThumbsDown, MessageSquareQuote } from 'lucide-react';

export default function DrawbackSummary({ drawbacks }) {
  if (!drawbacks) return null;

  return (
    <div className="bg-red-50 rounded-3xl p-5 border border-red-100 mt-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-red-500 text-white p-1.5 rounded-full">
          <AlertTriangle size={18} />
        </div>
        <h3 className="font-bold text-red-700 text-lg">忖度なしの「欠点」</h3>
      </div>
      
      <p className="font-bold text-slate-800 text-sm leading-relaxed mb-4">
        {drawbacks.tldr}
      </p>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-50 mb-4">
        <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
          <ThumbsDown size={14} className="text-slate-400" />
          買うべきでない人
        </h4>
        <ul className="space-y-1.5">
          {drawbacks.notRecommendedFor.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
              <span className="text-red-400 font-black shrink-0">・</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <MessageSquareQuote size={20} className="absolute -top-2 -left-1 text-red-200/50 -rotate-12" />
        <p className="text-xs text-slate-500 italic relative z-10 pl-5 pr-2 py-1 leading-normal border-l-2 border-red-200 ml-2">
          {drawbacks.socialVoice}
        </p>
      </div>
    </div>
  );
}
