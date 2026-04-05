import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Sparkles, Loader2 } from 'lucide-react';
import { products } from '../data/products';
import { getChatResponse } from '../api/gemini';

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'ai',
      content: 'こんにちは！HonestBaby AIです。予算やライフスタイル、気になる商品を教えていただければ、忖度なしでアドバイスします。\n\n例: 「1DKに収まるベビーカーはどれですか？」'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Call Real Gemini API
      // We pass the last few messages for context
      const chatHistory = updatedMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const response = await getChatResponse(chatHistory);
      
      // Simple heuristic to attach a product card if the AI mentions a known product
      let relatedProduct = null;
      for (const p of products) {
        if (response.includes(p.name)) {
          relatedProduct = p;
          break;
        }
      }

      setMessages(prev => [
        ...prev, 
        { 
          id: (Date.now() + 1).toString(), 
          role: 'ai', 
          content: response,
          product: relatedProduct
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'ai', content: '申し訳ありません、接続エラーが発生しました。' }
      ]);
    } finally {
      setIsTyping(false);
    }
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
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-brand-navy text-white' : 'bg-brand-coral text-white'}`}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            
            {/* Message Bubble */}
            <div className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-brand-navy text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none text-slate-700 whitespace-pre-wrap leading-relaxed'}`}>
              {msg.content}

              {/* Product Card Suggestion */}
              {msg.product && (
                <div className="mt-3 bg-white rounded-xl overflow-hidden border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <img src={msg.product.imageUrl} alt={msg.product.name} className="w-full h-24 object-cover" />
                  <div className="p-2.5">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{msg.product.name}</div>
                    <div className="text-[10px] text-red-500 font-bold bg-red-50 inline-block px-1.5 py-0.5 rounded">⚠️ {msg.product.drawbacksSummary?.tldr || '要確認ポイントあり'}</div>
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
          placeholder="AIに相談する..."
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
