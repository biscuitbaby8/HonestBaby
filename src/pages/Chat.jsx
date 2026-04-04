import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { products } from '../data/products';

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: 'こんにちは！HonestBaby AIです。予算やライフスタイル、気になる商品を教えていただければ、忖度なしでアドバイスします。\n\n例: 「1DKに収まるベビーカーはどれですか？」'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      setIsTyping(false);
      
      let aiResponseText = 'すみません、もう少し具体的にお伺いしてもよろしいですか？（モックデータのため限定的な回答となります）';
      let relatedProduct = null;

      if (userMessage.text.includes('1DK') || userMessage.text.includes('コンパクト') || userMessage.text.includes('ベビーカー')) {
        aiResponseText = `1DKのお部屋にお住まいですね。玄関のスペースも限られているかと思います。\n\n当データベースの寸法データとユーザー照合結果から、「${products[0].name}」がおすすめです。超軽量かつ折りたたみ時の幅が${products[0].dimensions.foldedWidth}cmと非常にコンパクトです。\n\nただし、**段差に弱い点**と**荷物収納力が低い点**には注意が必要です。`;
        relatedProduct = products[0];
      }

      setMessages(prev => [
        ...prev, 
        { 
          id: (Date.now() + 1).toString(), 
          sender: 'ai', 
          text: aiResponseText,
          product: relatedProduct
        }
      ]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header Info */}
      <div className="flex items-center gap-2 mb-4 bg-white/80 p-3 rounded-2xl border border-blue-100 shadow-sm">
        <Sparkles size={20} className="text-blue-500" />
        <span className="text-xs text-slate-600 font-medium leading-relaxed">
          ネットのリアルな口コミと寸法データを分析し、あなたに最適な商品を提案します。
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 scrollbar-hide pb-10">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-brand-navy text-white' : 'bg-brand-coral text-white'}`}>
              {msg.sender === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            
            {/* Message Bubble */}
            <div className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm ${msg.sender === 'user' ? 'bg-brand-navy text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none text-slate-700 whitespace-pre-wrap leading-relaxed'}`}>
              {msg.text}

              {/* Product Card Suggestion */}
              {msg.product && (
                <div className="mt-3 bg-white rounded-xl overflow-hidden border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <img src={msg.product.imageUrl} alt={msg.product.name} className="w-full h-24 object-cover" />
                  <div className="p-2.5">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{msg.product.name}</div>
                    <div className="text-[10px] text-red-500 font-bold bg-red-50 inline-block px-1.5 py-0.5 rounded">⚠️ {msg.product.drawbacksSummary.tldr}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brand-coral text-white">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="relative shrink-0">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="メッセージを入力..."
          className="w-full bg-white border border-slate-200 py-3.5 pl-4 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-coral shadow-sm text-sm"
        />
        <button 
          onClick={handleSend}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-coral text-white p-2 rounded-full active:scale-95 transition-transform"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
