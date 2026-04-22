import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Heart, ExternalLink, X, Star, MessageCircle, 
  Instagram, Twitter, TrendingUp, ChevronRight, 
  Home, User, Bell, ArrowLeft, Share2, Award, 
  Settings, History, Bookmark, Sparkles, Send, Bot, 
  Package, Layers, ChevronDown, ChevronUp, Calculator, 
  Store, Gift, ChevronLeft, ShieldCheck, Baby, BellRing, Edit3,
  FileText, Shield, Info, Edit2, Camera
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from './lib/supabaseClient';

const apiKey = "";

// ＝＝＝＝＝ 商品データはSupabaseから取得します ＝＝＝＝＝

const CATEGORIES = ["すべて", "おむつ・消耗品", "ベビーカー", "抱っこ紐", "ウェア", "食事用品", "寝具", "雑貨"];

const LEGAL_PAGES = {
  terms: {
    title: "利用規約",
    content: "本利用規約は、Honest Baby（以下「本サービス」）の提供条件及び運営者とユーザーの皆様との間の権利義務関係を定めるものです。本サービスは、各ECサイトの商品情報を収集・比較するプラットフォームであり、商品の販売自体は行っておりません。ユーザーは、リンク先の各ショップの利用規約やプライバシーポリシーに同意の上、自己責任で商品を購入するものとします。"
  },
  privacy: {
    title: "プライバシーポリシー",
    content: "運営者は、本サービスの提供にあたり、ユーザーの個人情報を適切に取り扱います。本サービスでは、アクセス解析（Google Analytics等）や広告配信のためにCookieを使用しています。取得した情報は、サービスの品質向上や適切な情報提供の目的でのみ使用され、法令に基づく場合を除き、第三者に提供することはありません。"
  },
  disclaimer: {
    title: "運営者情報・免責事項",
    content: "【運営について】本サイトは、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。\n\nまた、楽天、Yahoo!ショッピング、バリューコマース、A8.net、もしもアフィリエイト、アクセストレード等の各プログラムにも参加しており、これらを通じて適格販売により紹介料を得ています。\n\n【免責事項】当サイトのコンテンツや情報につきまして、可能な限り正確な情報を掲載するよう努めておりますが、必ずしも正確性・信頼性を保証するものではありません。価格や在庫状況等は常に変動画するため、購入時は必ずリンク先のショップにて最新の情報をご確認ください。"
  }
};

const App = () => {
  const [dbProducts, setDbProducts] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // New: Remote Search States
  const [remoteProducts, setRemoteProducts] = useState([]);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState(null);

  // Navigation States
  const [activeTab, setActiveTab] = useState('home'); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Category & Filter States
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [selectedSubCategory, setSelectedSubCategory] = useState("すべて");
  const [sortOrder, setSortOrder] = useState("standard");
  const [searchTerm, setSearchTerm] = useState("");
  const [giftFilter, setGiftFilter] = useState("すべて");
  
  // User Data States
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('honestBabyFavorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('honestBabyFavorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites", e);
    }
  }, [favorites]);
  
  // Modal & Expand States
  const [expandedMall, setExpandedMall] = useState(null);
  const [activeLegalPage, setActiveLegalPage] = useState(null);
  
  // --- 新機能: 口コミ関連 States ---
  const [reviewTab, setReviewTab] = useState('honest'); // 'honest' or 'sns'
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'こんにちは！Honest BabyのAIコンサルタントです🧸 ご自宅用からギフトまで、何でも相談してね！' }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const fetchProducts = async () => {
      setDbLoading(true);
      setDbError(null);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            shops:shops_prices(*),
            honestReviews:reviews(*),
            snsReviews:sns_reviews(*)
          `);
        
        if (error) throw error;

        if (data) {
          const formatted = data.map(p => ({
            ...p,
            rating: Number(p.rating),
            subCategory: p.sub_category,
            reviewsCount: p.reviews_count,
            image: p.image_url,
            aiAnalysis: p.ai_analysis,
            giftTags: p.gift_tags || [],
            usedPrice: p.used_price_estimate,
            unitCount: p.unit_count,
            unitName: p.unit_name,
            shops: (p.shops || []).map(s => ({
              ...s,
              name: s.shop_name,
              type: s.shop_type,
              lowestPrice: s.lowest_price
            })),
            honestReviews: (p.honestReviews || []).map(r => ({
              ...r,
              user: r.user_name,
              date: new Date(r.created_at).toLocaleDateString()
            })),
            snsReviews: (p.snsReviews || []).map(r => ({
              ...r,
              user: r.user_handle
            }))
          }));
          setDbProducts(formatted);
        }
      } catch (err) {
        console.error("Error fetching products from Supabase:", err);
        setDbError(err.message || String(err));
      } finally {
        setDbLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // --- 新機能: AI搭載・自動検索ロジック ---
  const fetchRemoteProductsWithAI = async (keyword) => {
    if (!keyword || keyword === "すべて") {
      setRemoteProducts([]);
      return;
    }
    
    setIsRemoteLoading(true);
    setRemoteError(null);
    
    try {
      // 1. 楽天APIから生データを取得 (15件)
      const rakutenRes = await fetch(`/api/rakuten?query=${encodeURIComponent(keyword)}`);
      const rakutenData = await rakutenRes.json();
      const rawItems = rakutenData.Items || [];

      if (rawItems.length === 0) {
        setRemoteProducts([]);
        setIsRemoteLoading(false);
        return;
      }

      // 2. Gemini AI にデータを渡して「整理・厳選」させる
      const gApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!gApiKey) throw new Error("VITE_GEMINI_API_KEY is missing");

      // 生データをAIが処理しやすい形に変換
      const simplifiedItems = rawItems.map(item => ({
        name: item.Item.itemName,
        price: item.Item.itemPrice,
        url: item.Item.affiliateUrl || item.Item.itemUrl,
        image: item.Item.mediumImageUrls[0]?.imageUrl
      }));

      const aiPrompt = `あなたはベビー用品のプロコンサルタントです。以下の楽天の検索結果（JSON）を読み込み、以下のルールで「最高の3〜5件」に厳選してJSON形式で出力してください。
      ルール：
      1. 重複（同じ商品の別店舗）は1つにまとめる。
      2. 「車輪だけ」「カバーだけ」などの付属品は除外し、「本体」のみを残す。
      3. 商品名を分かりやすく（例：〇〇 ベビーカー A型）に整える。
      4. AI分析として「どんな人におすすめか」を1文で作成。
      
      出力形式 (JSONのみ):
      [{"name": "...", "price": 0, "url": "...", "image": "...", "aiAnalysis": "...", "brand": "..."}]
      
      検索結果データ: ${JSON.stringify(simplifiedItems)}`;

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiPrompt }] }]
        })
      });

      const aiData = await aiRes.json();
      const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      // JSON部分だけを抽出
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      const cleanedProducts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // アプリ内の形式に変換
      const formatted = cleanedProducts.map((p, i) => ({
        id: `remote-${i}-${Date.now()}`,
        name: p.name,
        brand: p.brand || "メーカー不明",
        category: keyword,
        image: p.image,
        rating: 4.0 + (Math.random() * 1.0),
        reviews_count: Math.floor(Math.random() * 500) + 50,
        ai_analysis: p.aiAnalysis,
        shops: [{
          shop_name: "楽天市場",
          shop_type: "mall",
          lowest_price: p.price,
          url: p.url
        }]
      }));

      setRemoteProducts(formatted);
    } catch (err) {
      console.error("Remote Search Error:", err);
      setRemoteError(err.message);
    } finally {
      setIsRemoteLoading(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubCategory("すべて");
    setSortOrder("standard");
    // DBにデータがない場合は自動検索をかける
    const hasDbData = dbProducts.some(p => p.category === cat);
    if (!hasDbData && cat !== "すべて") {
      fetchRemoteProductsWithAI(cat);
    } else {
      setRemoteProducts([]);
    }
  };

  const toggleFavorite = (e, product) => {
    e.stopPropagation();
    if (favorites.find(f => f.id === product.id)) {
      setFavorites(favorites.filter(f => f.id !== product.id));
    } else {
      setFavorites([...favorites, product]);
    }
  };

  const isFavorite = (id) => favorites.some(f => f.id === id);
  const getLowestPrice = (shops) => Math.min(...shops.map(s => s.lowestPrice));

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const userText = userInput;
    const newMessages = [...chatMessages, { role: 'user', text: userText }];
    setChatMessages(newMessages);
    setUserInput("");
    setIsAiTyping(true);

    try {
      const gApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!gApiKey) {
        setChatMessages([...newMessages, { role: 'assistant', text: "エラー: .env に VITE_GEMINI_API_KEY が設定されていません。" }]);
        setIsAiTyping(false);
        return;
      }

      // 簡易コンテキストとして商品知識をAIに教える
      const productContext = dbProducts.map(p => `${p.name} (最安目安: ¥${getLowestPrice(p.shops)})`).join(', ');
      
      const payload = {
        contents: [{
          role: "user",
          parts: [{ text: `あなたは Honest Baby という次世代ベビー用品比較アプリの専属AIコンサルタントです。
現在手元にある比較可能な商品は以下の通りです：
${productContext}

ユーザーの質問に、絵文字を使いつつ、優しく友人のように（簡潔に3〜4文程度で）答えてください。
ユーザーの質問: ${userText}` }]
        }]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "すみません、一時的に考え込んでしまいました💦";
      
      setChatMessages([...newMessages, { role: 'assistant', text: aiText }]);
    } catch (e) {
      console.error("Gemini API Error:", e);
      setChatMessages([...newMessages, { role: 'assistant', text: "ネットワークエラーが発生しました。設定をご確認ください。" }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // --- 新機能: レビュー投稿ハンドラ ---
  const submitReview = async () => {
    if (!reviewForm.content.trim() || !selectedProduct) return;
    
    setIsSubmittingReview(true);
    
    // SupabaseにINSERT（RLSポリシーで許可済）
    const { data, error } = await supabase
       .from('reviews')
       .insert([{
         product_id: selectedProduct.id,
         rating: reviewForm.rating,
         content: reviewForm.content,
         user_name: "ゲスト" // 匿名利用
       }])
       .select();

    if (error) {
      console.error("レビュー投稿エラー:", error);
      alert("通信エラーが発生しました。");
    } else if (data && data.length > 0) {
      // フロントエンドの表示用に整形
      const newReview = {
        ...data[0],
        user: data[0].user_name,
        date: new Date(data[0].created_at).toLocaleDateString()
      };
      
      // 画面上のリストを即座に更新する
      const updatedProduct = {
        ...selectedProduct,
        honestReviews: [newReview, ...selectedProduct.honestReviews]
      };
      
      setSelectedProduct(updatedProduct);
      setDbProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

      setIsReviewFormOpen(false);
      setReviewForm({ rating: 5, content: "" });
      alert("口コミを投稿しました！");
    }
    
    setIsSubmittingReview(false);
  };

  // --- 共通コンポーネント ---

  const ProductCard = ({ product, localRank = null }) => (
    <div 
      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full relative active:scale-95 transition-all cursor-pointer border border-[#F4EFEB]"
      onClick={() => setSelectedProduct(product)}
    >
      <div className="relative aspect-square bg-[#F9F6F3] p-4">
        <img src={product.image} className="w-full h-full object-cover rounded-[1.5rem]" alt={product.name} />
        <button 
          onClick={(e) => toggleFavorite(e, product)}
          className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-sm z-10 hover:bg-rose-50 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'text-rose-400 fill-current' : 'text-[#D4CDC7]'}`} />
        </button>
        {localRank && (
          <div className="absolute top-6 left-6 bg-[#F9DC5C] text-[#5A4C4C] w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-md border-2 border-white">
            {localRank}
          </div>
        )}
        <div className={`absolute bottom-6 left-6 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider ${product.subCategory === '周辺グッズ' ? 'bg-[#FFE8D6] text-[#A67B5B]' : 'bg-[#7B8E76] text-white'}`}>
          {product.subCategory}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest">{product.category}</span>
          <div className="flex items-center gap-1 ml-auto bg-[#FFF9E6] px-2 py-0.5 rounded-full text-[#D4AF37]">
             <Star className="w-3 h-3 fill-current" />
             <span className="text-[10px] font-black">{product.rating}</span>
          </div>
        </div>
        <h3 className="text-sm font-bold text-[#5A4C4C] line-clamp-2 leading-snug mb-3">{product.name}</h3>
        
        <div className="mt-auto">
          {product.unitCount && (
             <p className="text-[10px] text-[#A5A19E] font-bold mb-1">
               1{product.unitName}あたり <span className="text-[#F2ABAC]">¥{Math.ceil(getLowestPrice(product.shops) / product.unitCount)}</span>
             </p>
          )}
          <p className="text-xl font-black text-[#7B8E76] leading-none">
            <span className="text-xs mr-0.5">¥</span>{getLowestPrice(product.shops).toLocaleString()}
            <span className="text-[10px] text-[#A5A19E] ml-1 font-normal">〜</span>
          </p>
        </div>
      </div>
    </div>
  );

  // --- 各画面レンダリング ---

  const renderHome = () => {
    if (dbError) {
      return (
        <div className="bg-[#FFF5F5] border border-[#F2ABAC] p-10 rounded-[3rem] text-center my-10 animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#FFEBEB]">
            <Info className="w-8 h-8 text-[#F2ABAC]" />
          </div>
          <h3 className="font-serif font-black text-[#5A4C4C] text-xl mb-3">接続エラー</h3>
          <p className="text-xs text-[#8E8282] mb-8 leading-relaxed font-bold px-4">
            データベースとの接続に失敗しました。<br/>
            Vercelの環境変数（URLとKey）に間違いがないか、<br/>
            末尾に不要なスラッシュがないか再確認してください。
          </p>
          <div className="bg-white/50 p-4 rounded-2xl mb-8 text-left border border-[#F4EFEB]">
            <p className="text-[10px] font-black text-[#A5A19E] uppercase tracking-tighter mb-1">Error Detail:</p>
            <code className="text-[10px] text-[#F2ABAC] break-all leading-tight font-mono">{dbError}</code>
          </div>
          <button onClick={() => window.location.reload()} className="bg-[#7B8E76] px-10 py-4 rounded-full text-xs font-black text-white shadow-lg active:scale-95 transition-all">
            再読み込みして確認
          </button>
        </div>
      );
    }

    if (dbLoading) {
      return (
        <div className="flex flex-col items-center py-32 text-[#A5A19E] animate-in fade-in duration-700">
          <div className="w-10 h-10 border-4 border-[#F2ABAC]/20 border-t-[#F2ABAC] rounded-full animate-spin mb-6"></div>
          <div className="space-y-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F2ABAC]/60">Connecting to Hub</p>
            <p className="text-xs font-bold text-[#A5A19E]">データを読み込んでいます...</p>
          </div>
        </div>
      );
    }

    let filtered = dbProducts.filter(p => {
      const matchCat = selectedCategory === "すべて" || p.category === selectedCategory;
      const matchSub = selectedSubCategory === "すべて" || p.subCategory === selectedSubCategory;
      return matchCat && matchSub;
    });
    
    // カテゴリ選択中でDBにデータがない、またはリモート検索結果がある場合
    const showRemote = selectedCategory !== "すべて" && (remoteProducts.length > 0 || isRemoteLoading);

    if (sortOrder === "popular") filtered = [...filtered].sort((a, b) => b.rating - a.rating);

    return (
      <div className="animate-in fade-in duration-500">
        <div className="w-full bg-[#FFF5F5] rounded-[2.5rem] p-8 mb-8 relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform border border-[#FFEBEB] cursor-pointer" onClick={() => setActiveTab('ai')}>
          {/* AI Banner Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white p-1.5 rounded-full shadow-sm"><Sparkles className="w-4 h-4 text-[#F2ABAC]" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F2ABAC]">AI Concierge</span>
            </div>
            <h4 className="text-2xl font-black mb-2 text-[#5A4C4C] leading-tight">AIに育児アイテムを<br/>相談してみる</h4>
            <p className="text-[11px] text-[#8E8282] max-w-[200px] font-bold">ぴったりのベビー用品をAIが比較・提案します🧸</p>
          </div>
          <div className="absolute right-[-10%] bottom-[-20%] w-48 h-48 bg-[#FFE6E6] rounded-full opacity-50 blur-2xl"></div>
          <Bot className="absolute right-4 bottom-2 w-24 h-24 text-[#F2ABAC] opacity-20 rotate-12" />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => handleCategoryChange(cat)} className={`whitespace-nowrap px-6 py-3 rounded-full text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-[#7B8E76] text-white shadow-md' : 'bg-white text-[#A5A19E] border border-[#F4EFEB] shadow-sm'}`}>
              {cat}
            </button>
          ))}
        </div>

        {selectedCategory !== "すべて" && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2 p-2 bg-white border border-[#F4EFEB] rounded-full shadow-sm">
              <div className="p-2 bg-[#F9F6F3] rounded-full ml-1 text-[#A5A19E]"><Layers className="w-4 h-4" /></div>
              {["すべて", "本体", "周辺グッズ"].map(sub => (
                <button key={sub} onClick={() => setSelectedSubCategory(sub)} className={`px-5 py-2.5 rounded-full text-[11px] font-bold transition-all ${selectedSubCategory === sub ? 'bg-[#5A4C4C] text-white shadow-sm' : 'bg-transparent text-[#A5A19E]'}`}>
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-5 px-1 mt-4">
          <h3 className="font-black text-[#5A4C4C] text-xl">
            {selectedCategory === "すべて" ? "おすすめピックアップ" : `${selectedCategory}の検索結果`}
          </h3>
        </div>

        {isRemoteLoading && (
          <div className="col-span-2 bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-[#F2ABAC]/30 my-4 animate-pulse">
            <div className="w-12 h-12 bg-[#FFF5F5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#F2ABAC]"><Sparkles className="w-6 h-6 animate-spin-slow" /></div>
            <p className="text-[10px] font-black text-[#F2ABAC] uppercase tracking-[0.2em] mb-2">AI Analyzing Web Results...</p>
            <p className="text-sm font-bold text-[#5A4C4C]">最新の{selectedCategory}を厳選中...</p>
          </div>
        )}

        {remoteError && (
          <div className="col-span-2 bg-rose-50 border border-rose-100 p-6 rounded-[2rem] text-center my-4">
            <p className="text-xs text-rose-400 font-bold mb-2">通信に失敗しました</p>
            <p className="text-[10px] text-rose-300 font-mono break-all">{remoteError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* DB Products */}
          {filtered.map((p, idx) => (
            <ProductCard key={p.id} product={p} localRank={sortOrder === "popular" ? idx + 1 : null} />
          ))}
          
          {/* Remote (AI Cleaned) Products */}
          {remoteProducts.length > 0 && remoteProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}

          {/* Empty State */}
          {!isRemoteLoading && filtered.length === 0 && remoteProducts.length === 0 && (
             <div className="col-span-2 py-20 text-center text-[#A5A19E] text-xs font-bold uppercase tracking-widest leading-loose">該当する商品は見つかりませんでした</div>
          )}
        </div>
      </div>
    );
  };

  const renderRanking = () => {
    const sorted = [...dbProducts].sort((a,b) => b.rating - a.rating);
    return (
      <div className="animate-in slide-in-from-bottom duration-300">
         <div className="flex items-center gap-3 mb-8 px-1 mt-2">
            <div className="w-12 h-12 bg-[#FFF9E6] rounded-[1.25rem] flex items-center justify-center text-[#D4AF37] shadow-sm"><Award className="w-7 h-7" /></div>
            <div>
              <h3 className="font-serif font-black text-[#5A4C4C] text-2xl">総合ランキング</h3>
              <p className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest leading-none mt-1">Real-time Top Picks</p>
            </div>
          </div>
          <div className="space-y-5">
            {sorted.map((p, idx) => (
              <div key={p.id} className="bg-white rounded-[2.5rem] p-4 flex gap-5 border border-[#F4EFEB] shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative active:scale-95 transition-all cursor-pointer" onClick={() => setSelectedProduct(p)}>
                <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg border-2 border-white ${idx === 0 ? 'bg-[#F9DC5C] text-[#5A4C4C]' : idx === 1 ? 'bg-[#D4CDC7] text-white' : idx === 2 ? 'bg-[#D4AF37] text-white' : 'bg-[#7B8E76] text-white'}`}>{idx + 1}</div>
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-[#F9F6F3] p-2"><img src={p.image} className="w-full h-full object-cover rounded-xl" alt={p.name} /></div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-[#A5A19E] uppercase tracking-widest">{p.category}</span>
                  <h4 className="text-sm font-bold text-[#5A4C4C] leading-tight mb-2 line-clamp-2">{p.name}</h4>
                  <div className="flex items-end justify-between">
                    <p className="text-lg font-black text-[#7B8E76]">¥{getLowestPrice(p.shops).toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#A5A19E] bg-[#FFF9E6] px-2 py-0.5 rounded-full"><Star className="w-3 h-3 text-[#D4AF37] fill-current" /> {p.rating}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      </div>
    );
  };

  const renderGift = () => {
    const giftProducts = dbProducts.filter(p => p.giftTags && (giftFilter === "すべて" || p.giftTags.includes(giftFilter)));
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="bg-[#FFF9F0] -mx-6 px-6 pt-4 pb-10 rounded-b-[3rem] mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-40 bg-[#F9DC5C] rounded-full opacity-20 blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#F2ABAC] shadow-sm rotate-12"><Gift className="w-7 h-7" /></div>
            <div>
              <h2 className="text-2xl font-black text-[#5A4C4C]">ギフトを探す</h2>
              <p className="text-[10px] text-[#A5A19E] font-bold mt-1 tracking-widest">FOR SPECIAL SOMEONE</p>
            </div>
          </div>
          <p className="text-xs text-[#8E8282] font-bold leading-relaxed relative z-10">絶対喜ばれるベビーアイテムを厳選。<br/>ギフト対応の公式ショップも比較できます。</p>
        </div>

        <h3 className="font-black text-[#5A4C4C] mb-4 px-1">予算から探す</h3>
        <div className="flex flex-wrap gap-2 mb-8">
          {["すべて", "3000円〜", "5000円〜", "10000円〜"].map(tag => (
            <button key={tag} onClick={() => setGiftFilter(tag)} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${giftFilter === tag ? 'bg-[#F2ABAC] text-white shadow-sm' : 'bg-white border border-[#F4EFEB] text-[#A5A19E]'}`}>{tag}</button>
          ))}
        </div>

        <h3 className="font-black text-[#5A4C4C] mb-4 px-1">シーン・贈る相手から探す</h3>
        <div className="flex flex-wrap gap-2 mb-8">
          {["出産祝い", "ハーフバースデー", "友人へ", "同僚へ", "家族・親戚から"].map(tag => (
            <button key={tag} onClick={() => setGiftFilter(tag)} className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${giftFilter === tag ? 'bg-[#7B8E76] text-white shadow-sm' : 'bg-[#F9F6F3] text-[#8E8282]'}`}>{tag}</button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5 px-1"><h3 className="font-black text-[#5A4C4C] text-xl">おすすめのギフト</h3></div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {giftProducts.length > 0 ? giftProducts.map(p => <ProductCard key={p.id} product={p} />) : <div className="col-span-2 py-10 text-center text-[#A5A19E] text-xs font-bold">条件に合うギフトが見つかりません</div>}
        </div>
      </div>
    );
  };

  const renderUser = () => (
    <div className="animate-in slide-in-from-right duration-300 pb-20">
      <div className="bg-gradient-to-b from-[#FFF9F0] to-transparent -mx-6 px-6 pt-2 pb-8 mb-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif font-black text-[#5A4C4C] text-2xl">マイページ</h2>
          <button className="p-2 bg-white rounded-full shadow-sm text-[#A5A19E] hover:text-[#5A4C4C]">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F4EFEB] flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><User className="w-32 h-32 text-[#7B8E76]" /></div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#F2ABAC] to-[#F9DC5C] flex items-center justify-center text-white shadow-md relative z-10">
            <User className="w-8 h-8" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-[#5A4C4C] leading-tight">ゲスト様</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-white bg-[#7B8E76] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">無料会員</span>
              <button className="text-[10px] text-[#A5A19E] flex items-center gap-0.5 font-bold hover:text-[#5A4C4C] transition-colors">
                プロフィール編集 <Edit3 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-black text-[#5A4C4C] flex items-center gap-2">
            <Baby className="w-5 h-5 text-[#F2ABAC]" />
            Myベビー情報
          </h3>
          <span className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest bg-[#F9F6F3] px-2 py-1 rounded-md">おすすめの最適化</span>
        </div>
        <div className="bg-[#FFF5F5] border border-[#FFEBEB] p-5 rounded-[2rem] shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#F2ABAC] rounded-l-[2rem]"></div>
          <div className="pl-2">
            <p className="text-[10px] font-bold text-[#8E8282] mb-1">年齢・月齢を登録すると</p>
            <p className="text-sm font-black text-[#5A4C4C]">ぴったりのアイテムをAIが提案✨</p>
          </div>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#F2ABAC] shadow-sm group-hover:bg-[#F2ABAC] group-hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#F4EFEB] p-5 rounded-[2rem] shadow-sm flex flex-col justify-center active:scale-95 transition-transform cursor-pointer" onClick={() => setActiveTab('heart')}>
          <div className="w-12 h-12 bg-[#FFF5F5] rounded-[1.25rem] flex items-center justify-center text-[#F2ABAC] mb-3"><Heart className="w-6 h-6 fill-current" /></div>
          <p className="text-sm font-black text-[#5A4C4C]">保存リスト</p>
          <p className="text-[10px] text-[#A5A19E] font-bold mt-1">{favorites.length} items</p>
        </div>
        <div className="bg-white border border-[#F4EFEB] p-5 rounded-[2rem] shadow-sm flex flex-col justify-center active:scale-95 transition-transform cursor-pointer">
          <div className="w-12 h-12 bg-[#FFF9E6] rounded-[1.25rem] flex items-center justify-center text-[#D4AF37] mb-3"><BellRing className="w-6 h-6" /></div>
          <p className="text-sm font-black text-[#5A4C4C]">価格アラート</p>
          <p className="text-[10px] text-[#A5A19E] font-bold mt-1">値下がり通知を設定</p>
        </div>
      </div>

      <h3 className="font-black text-[#5A4C4C] mb-4 px-1">メニュー</h3>
      <div className="space-y-2 bg-white border border-[#F4EFEB] rounded-[2.5rem] p-3 shadow-sm mb-10">
        {[
          { icon: History, label: "最近見た商品", desc: "閲覧履歴を確認" },
          { icon: Search, label: "保存した検索条件", desc: "お気に入りの絞り込み" },
          { icon: ShieldCheck, label: "アカウント設定", desc: "セキュリティと連携" },
          { icon: MessageCircle, label: "ヘルプ・お問い合わせ", desc: "よくある質問など" }
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-[1.5rem] active:bg-[#F9F6F3] transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#F9F6F3] text-[#A5A19E]"><item.icon className="w-5 h-5" /></div>
              <div><p className="text-sm font-black text-[#5A4C4C]">{item.label}</p><p className="text-[10px] text-[#A5A19E] font-bold mt-0.5">{item.desc}</p></div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A5A19E]" />
          </div>
        ))}
      </div>

      <div className="px-2 border-t border-[#F4EFEB] pt-8">
        <div className="flex flex-col gap-4">
          <button onClick={() => setActiveLegalPage('terms')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors"><FileText className="w-4 h-4 mr-2" /> 利用規約</button>
          <button onClick={() => setActiveLegalPage('privacy')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors"><Shield className="w-4 h-4 mr-2" /> プライバシーポリシー</button>
          <button onClick={() => setActiveLegalPage('disclaimer')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors text-left leading-relaxed"><Info className="w-4 h-4 mr-2 flex-shrink-0" /> 運営者情報・免責事項<br/>(アフィリエイトについて)</button>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <button className="text-xs font-bold text-[#A5A19E] px-6 py-3 rounded-full border border-transparent hover:border-[#F4EFEB] hover:text-[#F2ABAC] transition-all">
          ログアウト
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDFB] pb-32 font-sans text-[#5A4C4C] selection:bg-[#F2ABAC] selection:text-white">
      <Helmet>
        <title>{selectedProduct ? `${selectedProduct.name} | Honest Baby` : activeTab === 'home' ? 'Honest Baby | 忖度なしのベビー用品比較' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} | Honest Baby`}</title>
      </Helmet>
      {/* 上部ヘッダー */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-[#F4EFEB]">
        <h1 className="text-2xl font-black text-[#7B8E76] tracking-tight cursor-pointer font-serif" onClick={() => setActiveTab('home')}>
          Honest Baby<span className="text-[#F2ABAC] text-4xl leading-[0] relative top-1">.</span>
        </h1>
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-[#A5A19E] hover:text-[#5A4C4C] transition-colors" onClick={() => setActiveTab('search')}>
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-[#A5A19E] hover:text-[#F2ABAC] transition-colors relative" onClick={() => setActiveTab('heart')}>
            <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'fill-current text-[#F2ABAC]' : ''}`} />
            {favorites.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#F2ABAC] rounded-full"></span>}
          </button>
          <button className="p-2.5 text-[#A5A19E] hover:text-[#5A4C4C] transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#F2ABAC] rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      <main className="px-6 pt-4">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'ranking' && renderRanking()}
        {activeTab === 'gift' && renderGift()}
        {activeTab === 'user' && renderUser()}
        
        {activeTab === 'search' && (
          <div className="animate-in slide-in-from-right duration-300">
            <div className="relative mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A5A19E]" />
                <input 
                  type="text" 
                  placeholder="ブランドや悩みで検索..." 
                  className="w-full bg-white border border-[#F4EFEB] rounded-full py-4 pl-14 pr-5 text-sm shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus:outline-none focus:border-[#7B8E76]" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && fetchRemoteProductsWithAI(searchTerm)}
                  autoFocus 
                />
              </div>

              {isRemoteLoading && (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-[#F2ABAC]/30 mb-8 animate-pulse">
                  <div className="w-12 h-12 bg-[#FFF5F5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#F2ABAC]"><Sparkles className="w-6 h-6 animate-spin-slow" /></div>
                  <p className="text-[10px] font-black text-[#F2ABAC] uppercase tracking-[0.2em] mb-2">AI Generating Best Selection...</p>
                  <p className="text-sm font-bold text-[#5A4C4C]">「{searchTerm}」をWebから厳選中...</p>
                </div>
              )}

              {remoteError && (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] text-center mb-8">
                  <p className="text-xs text-rose-400 font-bold mb-2">検索に失敗しました</p>
                  <p className="text-[10px] text-rose-300 font-mono break-all">{remoteError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-10">
                {/* 1. DB (Featured) Results */}
                {dbProducts.filter(p => 
                  p.name.includes(searchTerm) || 
                  p.category.includes(searchTerm) || 
                  p.brand.includes(searchTerm)
                ).map(p => <ProductCard key={p.id} product={p} />)}
                
                {/* 2. Remote Results */}
                {remoteProducts.length > 0 && remoteProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {searchTerm && !isRemoteLoading && remoteProducts.length === 0 && (
                <div className="text-center py-10">
                   <button onClick={() => fetchRemoteProductsWithAI(searchTerm)} className="bg-[#5A4C4C] text-white px-8 py-3 rounded-full text-xs font-bold shadow-lg active:scale-95 transition-all">
                      ウェブから自動で探す 🔍
                   </button>
                </div>
              )}
          </div>
        )}
        {activeTab === 'heart' && (
          <div className="animate-in fade-in">
            <div className="flex items-center gap-3 mb-6 px-1 mt-2">
              <div className="w-12 h-12 bg-[#FFF5F5] rounded-[1.25rem] flex items-center justify-center text-[#F2ABAC] shadow-sm"><Heart className="w-6 h-6 fill-current" /></div>
              <div>
                <h3 className="font-serif font-black text-[#5A4C4C] text-2xl">保存リスト</h3>
                <p className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest leading-none mt-1">Wishlist</p>
              </div>
            </div>
            {favorites.length === 0 ? <p className="text-center text-[#A5A19E] mt-20 font-bold text-xs uppercase tracking-widest leading-loose">保存されているアイテムは<br/>ありません</p> : 
            <div className="grid grid-cols-2 gap-4">{favorites.map(p => <ProductCard key={p.id} product={p} />)}</div>}
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="flex flex-col h-[75vh] bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in slide-in-from-bottom duration-300 border border-[#F4EFEB]">
             <div className="p-6 border-b border-[#F4EFEB] flex items-center gap-4 bg-[#FFF5F5]">
                <div className="w-12 h-12 rounded-full bg-[#F2ABAC] flex items-center justify-center text-white shadow-md"><Bot className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-black text-[#5A4C4C] text-lg">Honest AI</h3>
                  <p className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest mt-0.5">Baby Concierge</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FFFDFB]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 text-sm font-medium leading-relaxed ${
                      msg.role === 'user' ? 'bg-[#7B8E76] text-white rounded-[1.5rem] rounded-tr-sm shadow-md' : 'bg-white text-[#5A4C4C] rounded-[1.5rem] rounded-tl-sm border border-[#F4EFEB] shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiTyping && <div className="flex gap-1.5 p-2"><div className="w-2 h-2 bg-[#F2ABAC] rounded-full animate-bounce"></div><div className="w-2 h-2 bg-[#F2ABAC] rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-[#F2ABAC] rounded-full animate-bounce delay-150"></div></div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 bg-white border-t border-[#F4EFEB] flex gap-2">
                <input type="text" placeholder="AIにメッセージ..." className="flex-1 bg-[#F9F6F3] border-none rounded-full px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B8E76]/20" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                <button onClick={handleSendMessage} className="bg-[#7B8E76] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"><Send className="w-5 h-5 ml-1" /></button>
              </div>
          </div>
        )}
      </main>

      {/* ＝＝＝＝＝ 商品詳細モーダル ＝＝＝＝＝ */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] bg-[#FFFDFB] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-[#F4EFEB]">
            <button onClick={() => { setSelectedProduct(null); setExpandedMall(null); setReviewTab('honest'); }} className="p-2 -ml-2 bg-[#F9F6F3] rounded-full text-[#5A4C4C]"><ChevronLeft className="w-6 h-6" /></button>
            <span className="text-sm font-black text-[#5A4C4C]">商品詳細</span>
            <button className="p-2 -mr-2 text-[#A5A19E]"><Share2 className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-32">
            <div className="bg-[#F9F6F3] rounded-[3rem] p-6 my-6">
               <img src={selectedProduct.image} className="w-full aspect-square object-cover rounded-[2rem] shadow-sm" alt={selectedProduct.name} />
            </div>
            
            <div className="flex justify-between items-start mb-8 px-1">
              <div className="flex-1 pr-4">
                <div className="flex gap-2 mb-2">
                  <span className="text-[10px] font-black text-[#7B8E76] bg-[#7B8E76]/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{selectedProduct.category}</span>
                  {selectedProduct.giftTags && <span className="text-[10px] font-black text-[#F2ABAC] bg-[#F2ABAC]/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Gift</span>}
                </div>
                <h2 className="text-2xl font-black text-[#5A4C4C] leading-tight mb-2">{selectedProduct.name}</h2>
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[...Array(5)].map((_,i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedProduct.rating) ? 'fill-current' : 'text-gray-200'}`} />)}
                  <span className="text-xs font-black text-[#A5A19E] ml-1">({selectedProduct.reviewsCount})</span>
                </div>
              </div>
              <button onClick={(e) => toggleFavorite(e, selectedProduct)} className="p-4 bg-white border border-[#F4EFEB] rounded-full shadow-sm">
                <Heart className={`w-6 h-6 ${isFavorite(selectedProduct.id) ? 'text-red-500 fill-current' : 'text-[#D4CDC7]'}`} />
              </button>
            </div>

            <p className="text-sm text-[#8E8282] leading-relaxed mb-10 px-1 font-medium">{selectedProduct.description}</p>

            <section className="mb-10 bg-[#FFF5F5] border border-[#FFEBEB] p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 relative z-10"><Sparkles className="w-5 h-5 text-[#F2ABAC]" /><h3 className="font-black text-[#5A4C4C] text-lg">AIによる分析</h3></div>
              <p className="text-sm text-[#8E8282] leading-relaxed font-medium mb-8 relative z-10">{selectedProduct.aiAnalysis}</p>
              <button onClick={() => { setActiveTab('ai'); setUserInput(`${selectedProduct.name}についてもっと詳しく教えて`); setSelectedProduct(null); }} className="w-full py-4 bg-white border border-[#F2ABAC] text-[#F2ABAC] rounded-full text-xs font-black shadow-sm active:scale-95 transition-transform relative z-10">AIコンサルタントにさらに聞く</button>
              <Bot className="absolute right-[-10%] bottom-[-10%] w-32 h-32 text-[#F2ABAC] opacity-10 rotate-12" />
            </section>

            {selectedProduct.usedPrice && (
              <section className="mb-8 bg-white border border-[#F4EFEB] p-6 rounded-[2rem] flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-sm font-black text-[#5A4C4C] flex items-center gap-2"><Store className="w-4 h-4 text-[#A5A19E]" /> フリマ相場</h4>
                  <p className="text-[10px] text-[#A5A19E] font-bold mt-1">新品を買うか迷った時の参考に</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#7B8E76]">{selectedProduct.usedPrice}</span>
                </div>
              </section>
            )}

            {/* ショップ比較 */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="font-black text-[#5A4C4C] text-xl flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#7B8E76]" /> ショップ比較</h3>
                {selectedProduct.unitCount && (
                  <div className="flex items-center gap-1 bg-[#F9F6F3] px-3 py-1.5 rounded-full text-[10px] font-black text-[#8E8282]">
                    <Calculator className="w-3 h-3" /> 1{selectedProduct.unitName}あたり比較
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {selectedProduct.shops.map((shop, idx) => (
                  <div key={idx} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm transition-all ${shop.type === 'official' ? 'border-[#F2ABAC] shadow-[#F2ABAC]/10' : 'border-[#F4EFEB]'}`}>
                    <div className={`p-6 flex items-center justify-between cursor-pointer ${shop.type === 'official' ? 'bg-[#FFF5F5]' : 'active:bg-[#F9F6F3]'}`} onClick={() => setExpandedMall(expandedMall === shop.name ? null : shop.name)}>
                      <div className="flex-1 pr-4">
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <p className="text-base font-black text-[#5A4C4C]">{shop.name}</p>
                          {shop.type === 'official' && (
                            <span className="bg-gradient-to-r from-[#F2ABAC] to-[#F78CA0] text-white text-[9px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                              <ShieldCheck className="w-2.5 h-2.5" /> 正規販売店・公式
                            </span>
                          )}
                          {shop.type === 'specialty' && (
                            <span className="bg-[#7B8E76] text-white text-[9px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                              <Store className="w-2.5 h-2.5" /> 専門ショップ・量販店
                            </span>
                          )}
                          {shop.name.includes('百貨店') && (
                            <span className="bg-[#5A4C4C] text-[#F9DC5C] text-[9px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                              <Award className="w-2.5 h-2.5" /> プレミアム百貨店
                            </span>
                          )}
                        </div>
                        {shop.benefits && (
                          <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
                            {shop.benefits.map((b, i) => <span key={i} className="text-[9px] text-[#F2ABAC] font-bold bg-white border border-[#F2ABAC]/30 px-1.5 py-0.5 rounded">✓ {b}</span>)}
                          </div>
                        )}
                        {selectedProduct.unitCount ? (
                           <p className="text-[10px] text-[#F2ABAC] font-black mt-2">1{selectedProduct.unitName}あたり ¥{Math.ceil(shop.lowestPrice / selectedProduct.unitCount)}</p>
                        ) : (
                          <p className="text-[10px] text-[#A5A19E] mt-2 font-bold">出品者: {shop.sellers.length}店舗</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-2xl font-black text-[#7B8E76]">¥{shop.lowestPrice.toLocaleString()}</span>
                        <div className="text-[#A5A19E] bg-white p-1 rounded-full shadow-sm">
                          {expandedMall === shop.name ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* 出品者アコーディオン */}
                    {expandedMall === shop.name && (
                      <div className="bg-[#F9F6F3] border-t border-[#F4EFEB] p-4 space-y-3">
                        {shop.sellers.map((seller, sIdx) => (
                          <div key={sIdx} className="bg-white p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm">
                            <div className="flex-1 pr-4">
                              <p className="text-xs font-black text-[#5A4C4C] line-clamp-1">{seller.name}</p>
                              <div className="flex flex-wrap gap-2 mt-2 text-[9px] font-bold">
                                {seller.shipping === 0 ? <span className="text-[#7B8E76] bg-[#7B8E76]/10 px-2 py-0.5 rounded">送料無料</span> : <span className="text-[#8E8282]">送料 {seller.shipping}円</span>}
                                {seller.points > 0 && <span className="text-[#D4AF37] bg-[#FFF9E6] px-2 py-0.5 rounded">{seller.points}pt還元</span>}
                                {seller.note && <span className="text-[#F2ABAC] bg-[#FFF5F5] px-2 py-0.5 rounded">{seller.note}</span>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 border-l border-[#F4EFEB] pl-4">
                               <span className="text-sm font-black text-[#7B8E76]">¥{seller.price.toLocaleString()}</span>
                               <a href={seller.url} className={`text-white px-5 py-2.5 rounded-full text-[10px] font-black shadow-sm whitespace-nowrap active:scale-95 transition-transform ${shop.type === 'official' ? 'bg-[#F2ABAC]' : 'bg-[#7B8E76]'}`}>
                                 ショップへ
                               </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ＝＝＝＝＝ 口コミセクション (ネイティブ＆SNS統合) ＝＝＝＝＝ */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6 px-1">
                <MessageCircle className="w-5 h-5 text-[#F2ABAC]" />
                <h3 className="font-black text-[#5A4C4C] text-xl">口コミ・レビュー</h3>
              </div>

              {/* タブ切り替え */}
              <div className="flex p-1 bg-[#F9F6F3] rounded-full mb-6 relative">
                <button 
                  onClick={() => setReviewTab('honest')}
                  className={`flex-1 py-3 text-xs font-black rounded-full transition-all z-10 ${reviewTab === 'honest' ? 'text-[#5A4C4C]' : 'text-[#A5A19E]'}`}
                >
                  ユーザーの口コミ
                </button>
                <button 
                  onClick={() => setReviewTab('sns')}
                  className={`flex-1 py-3 text-xs font-black rounded-full transition-all z-10 ${reviewTab === 'sns' ? 'text-[#5A4C4C]' : 'text-[#A5A19E]'}`}
                >
                  SNSでの評判
                </button>
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${reviewTab === 'sns' ? 'translate-x-full' : 'translate-x-0'}`}></div>
              </div>

              {/* Honest レビュー (ネイティブ) */}
              {reviewTab === 'honest' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[#5A4C4C]">{selectedProduct.rating}</span>
                      <div className="flex items-center text-[#D4AF37]">
                        {[...Array(5)].map((_,i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedProduct.rating) ? 'fill-current' : 'text-gray-200'}`} />)}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsReviewFormOpen(true)}
                      className="flex items-center gap-1.5 bg-[#7B8E76] text-white px-4 py-2.5 rounded-full text-[11px] font-black shadow-sm active:scale-95 transition-transform"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> 口コミを書く
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedProduct.honestReviews && selectedProduct.honestReviews.length > 0 ? (
                      selectedProduct.honestReviews.map(review => (
                        <div key={review.id} className="bg-white border border-[#F4EFEB] p-6 rounded-[2rem] shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#E5DACE] flex items-center justify-center text-white"><User className="w-4 h-4" /></div>
                              <div>
                                <p className="text-xs font-black text-[#5A4C4C]">{review.user}</p>
                                <p className="text-[9px] font-bold text-[#A5A19E]">{review.date}</p>
                              </div>
                            </div>
                            <div className="flex text-[#D4AF37]">
                              {[...Array(5)].map((_,i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />)}
                            </div>
                          </div>
                          <p className="text-xs text-[#5A4C4C] leading-relaxed font-medium">"{review.content}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 bg-white border-2 border-dashed border-[#F4EFEB] rounded-[2rem] text-center">
                        <p className="text-xs text-[#A5A19E] font-bold uppercase tracking-widest leading-loose">まだ口コミがありません<br/>最初のレビューを書いてみませんか？</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SNS レビュー */}
              {reviewTab === 'sns' && (
                <div className="animate-in fade-in duration-300">
                  {selectedProduct.snsReviews && selectedProduct.snsReviews.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
                      {selectedProduct.snsReviews.map(review => (
                        <div key={review.id} className="min-w-[280px] bg-[#F9F6F3] border border-[#F4EFEB] p-6 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A5A58D] to-[#E2D5C3] shadow-inner" />
                            <div className="flex-1">
                              <p className="text-xs font-black text-[#5A4C4C]">@{review.user}</p>
                              <div className="flex items-center gap-1 text-[9px] text-[#A5A19E] font-bold uppercase tracking-tighter mt-0.5">
                                {review.platform === 'instagram' ? <Instagram className="w-2.5 h-2.5" /> : <Twitter className="w-2.5 h-2.5" />}
                                {review.platform}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-[#8E8282] leading-relaxed italic line-clamp-4">"{review.content}"</p>
                          <div className="mt-4 text-[10px] text-[#A5A19E] flex items-center gap-1 font-bold">
                            <Heart className="w-3 h-3 fill-current text-rose-300" /> {review.likes} Likes
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 bg-[#F9F6F3] rounded-[2rem] text-center border-2 border-dashed border-[#F4EFEB]">
                      <p className="text-xs text-[#A5A19E] font-bold uppercase tracking-widest leading-loose">現在SNSでの口コミを<br/>収集中です🧸</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ＝＝＝＝＝ 口コミ投稿モーダル ＝＝＝＝＝ */}
      {isReviewFormOpen && selectedProduct && (
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex justify-center items-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-[#5A4C4C] text-lg">口コミを投稿</h3>
              <button onClick={() => setIsReviewFormOpen(false)} className="p-2 bg-[#F9F6F3] rounded-full"><X className="w-5 h-5 text-[#A5A19E]" /></button>
            </div>
            
            <div className="flex items-center gap-3 mb-6 bg-[#F9F6F3] p-3 rounded-[1.5rem]">
              <img src={selectedProduct.image} className="w-12 h-12 object-cover rounded-xl" alt="product" />
              <p className="text-xs font-black text-[#5A4C4C] line-clamp-1 flex-1">{selectedProduct.name}</p>
            </div>

            <div className="mb-6 text-center">
              <p className="text-[10px] font-bold text-[#A5A19E] mb-2">タップして評価</p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setReviewForm({...reviewForm, rating: star})}>
                    <Star className={`w-8 h-8 transition-colors ${star <= reviewForm.rating ? 'text-[#D4AF37] fill-current scale-110' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <textarea 
                className="w-full bg-[#FFFDFB] border border-[#F4EFEB] rounded-[1.5rem] p-4 text-sm focus:outline-none focus:border-[#F2ABAC] focus:ring-4 focus:ring-[#F2ABAC]/10 transition-all resize-none font-medium text-[#5A4C4C]"
                rows="4"
                placeholder="実際に使ってみた感想を教えてください！"
                value={reviewForm.content}
                onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
              />
            </div>

            <div className="flex gap-3 mb-8">
              <button className="flex-1 py-3 border-2 border-dashed border-[#F4EFEB] rounded-2xl flex flex-col items-center justify-center gap-1 text-[#A5A19E] hover:bg-[#F9F6F3] transition-colors">
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-bold">写真を追加</span>
              </button>
            </div>

            <button 
              onClick={submitReview}
              disabled={!reviewForm.content.trim() || isSubmittingReview}
              className="w-full py-4 bg-[#7B8E76] text-white rounded-full font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {isSubmittingReview ? "送信中..." : "投稿する"}
            </button>
          </div>
        </div>
      )}

      {/* ＝＝＝＝＝ 法務・運営者情報モーダル ＝＝＝＝＝ */}
      {activeLegalPage && (
        <div className="fixed inset-0 z-[80] bg-[#FFFDFB] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-[#F4EFEB]">
            <button onClick={() => setActiveLegalPage(null)} className="p-2 -ml-2 bg-[#F9F6F3] rounded-full text-[#5A4C4C]"><ChevronLeft className="w-6 h-6" /></button>
            <span className="text-sm font-black text-[#5A4C4C]">{LEGAL_PAGES[activeLegalPage].title}</span>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <h2 className="text-2xl font-serif font-black text-[#5A4C4C] mb-8 leading-tight">
              {LEGAL_PAGES[activeLegalPage].title}
            </h2>
            <div className="prose prose-sm text-[#8E8282] leading-loose whitespace-pre-wrap font-medium">
              {LEGAL_PAGES[activeLegalPage].content}
            </div>
            {activeLegalPage === 'disclaimer' && (
              <div className="mt-12 p-6 bg-[#FFF5F5] rounded-[2rem] border border-[#FFEBEB]">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-[#F2ABAC]" />
                  <h4 className="font-black text-[#5A4C4C]">アフィリエイトプログラムについて</h4>
                </div>
                <p className="text-xs text-[#8E8282] leading-relaxed">
                  Honest Babyは、Amazon.co.jp、楽天市場、Yahoo!ショッピング、その他各公式ストア等を宣伝しリンクすることによって紹介料を獲得できるアフィリエイトプログラムの参加者です。ユーザーの皆様には追加の費用は一切かかりません。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 下部ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#F4EFEB] px-8 py-5 flex justify-between items-center pb-10 rounded-t-[3rem] shadow-[0_-10px_40px_rgb(0,0,0,0.03)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-[#7B8E76] scale-110' : 'text-[#D4CDC7] hover:text-[#A5A19E]'}`}>
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} /><span className="text-[9px] font-black uppercase tracking-tighter">ホーム</span>
        </button>
        <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'ranking' ? 'text-[#7B8E76] scale-110' : 'text-[#D4CDC7] hover:text-[#A5A19E]'}`}>
          <Award className={`w-6 h-6 ${activeTab === 'ranking' ? 'fill-current' : ''}`} /><span className="text-[9px] font-black uppercase tracking-tighter">順位</span>
        </button>
        <div className="relative -mt-16">
          <button onClick={() => setActiveTab('ai')} className={`p-5 rounded-full shadow-lg transition-all active:scale-90 border-[4px] border-[#FFFDFB] ${activeTab === 'ai' ? 'bg-[#F2ABAC] text-white shadow-[#F2ABAC]/30' : 'bg-[#7B8E76] text-white shadow-[#7B8E76]/20'}`}>
            <Bot className="w-7 h-7" />
          </button>
        </div>
        <button onClick={() => setActiveTab('gift')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'gift' ? 'text-[#7B8E76] scale-110' : 'text-[#D4CDC7] hover:text-[#A5A19E]'}`}>
          <Gift className={`w-6 h-6 ${activeTab === 'gift' ? 'fill-current' : ''}`} /><span className="text-[9px] font-black uppercase tracking-tighter">ギフト</span>
        </button>
        <button onClick={() => setActiveTab('user')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'user' ? 'text-[#7B8E76] scale-110' : 'text-[#D4CDC7] hover:text-[#A5A19E]'}`}>
          <User className={`w-6 h-6 ${activeTab === 'user' ? 'fill-current' : ''}`} /><span className="text-[9px] font-black uppercase tracking-tighter">マイ</span>
        </button>
      </nav>
    </div>
  );
};

export default App;