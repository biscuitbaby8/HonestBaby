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

// 市場網羅のための詳細カテゴリツリー
// ジャンルID は ranking.rakuten.co.jp/daily/<id>/ の URL から確認した実際のID
const CATEGORY_TREE = [
  { name: "すべて",      id: "100533", keyword: "",                         icon: "🏠", subs: [] },
  { name: "おむつ",      id: "205197", keyword: "おむつ",                   icon: "🩲", subs: [
    { name: "テープタイプ", subsubs: ["新生児", "S", "M", "L", "BIG", "BIGより大きい"] },
    { name: "パンツタイプ", subsubs: ["S", "M", "L", "BIG", "BIGより大きい"] },
    { name: "夜用おむつ",   subsubs: ["M", "L", "BIG", "BIGより大きい"] },
    { name: "おしりふき" },
  ]},
  { name: "ベビーカー",  id: "200833", keyword: "ベビーカー",               icon: "🚼", subs: ["A型", "B型", "AB型", "バギー", "周辺グッズ"] },
  { name: "抱っこ紐",    id: "412209", keyword: "抱っこ紐",                 icon: "🤱", subs: ["縦抱き", "横抱き", "スリング", "ヒップシート", "周辺グッズ"] },
  { name: "ウェア",      id: "111102", keyword: "ベビー服",                 icon: "👕", subs: ["ロンパース", "カバーオール", "肌着", "アウター"] },
  { name: "ミルク・授乳",id: "205208", keyword: "ミルク 授乳",              icon: "🍼", subs: ["ミルク", "哺乳瓶", "搾乳器", "授乳クッション", "母乳パッド"] },
  { name: "離乳食・食器",id: "213980", keyword: "離乳食",                   icon: "🥣", subs: ["ベビーフード", "食器セット", "ベビーチェア", "スプーン"] },
  { name: "寝具・ベッド",id: "200822", keyword: "ベビーベッド",             icon: "🛏️", subs: ["ベビーベッド", "ベビー布団", "スリーパー", "まくら"] },
  { name: "おもちゃ",    id: "201591", keyword: "おもちゃ",                 icon: "🧸", subs: ["ガラガラ", "知育玩具", "ぬいぐるみ", "メリー"] },
  { name: "安全グッズ",  id: "200841", keyword: "ベビーゲート",             icon: "🔒", subs: ["ベビーゲート", "コーナーガード", "扉ロック", "転倒防止", "ベビーモニター"] },
  { name: "お風呂用品",  id: "200815", keyword: "ベビー お風呂",            icon: "🛁", subs: ["ベビーバス", "ベビー用ソープ", "保湿クリーム"] },
  { name: "トイレ用品",  id: "200819", keyword: "おまる",                   icon: "🚿", subs: ["補助便座", "おまる", "トイトレ", "おしりふき"] },
  { name: "車用品",      id: "566088", keyword: "チャイルドシート",          icon: "🚗", subs: ["新生児用", "1歳以上", "ジュニアシート", "2wayタイプ", "周辺グッズ"] },
  { name: "マタニティ",  id: "100533", keyword: "マタニティ",               icon: "🤰", subs: ["マタニティウェア", "腹帯", "葉酸サプリ", "授乳ブラ", "ノンカフェイン"] },
  { name: "ギフトセット",id: "205222", keyword: "出産祝い ギフト",           icon: "🎁", subs: ["出産祝い", "誕生日ギフト", "名入れギフト"] }
];

const CATEGORIES = CATEGORY_TREE.map(c => c.name);

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

// アクセサリー除外ワード: 本体商品名に含まれない、アクセサリー専用の言葉
const ACCESSORY_EXCLUDE_WORDS = [
  // ベビーカーアクセサリー
  'ドリンクホルダー', 'カップホルダー', 'スマホホルダー', 'スマートフォンホルダー',
  'レインカバー', 'ハンドルカバー', 'フットマフ', 'バンパーバー', 'サンキャノピー',
  '延長ベルト', 'アームバー', 'ベビーカード', 'タイヤ交換', 'シート生地', '車輪のみ',
  'ペットボトルホルダー', 'スマホスタンド', 'アクセサリーセット', '収納ポーチ',
  'よだれカバー', 'サンシェード単品', 'フック単品',
  // チャイルドシートアクセサリー
  'シートベルトカバー', 'シートプロテクター', 'ミラー取付',
  // 抱っこ紐アクセサリー
  'よだれパッド', '침받이',
  // おむつ関連（おむつカテゴリ以外での混入防止）
  'おむつポーチ', 'おむつバッグ', 'おむつストッカー',
];

// おむつサイズマッピング（検索精度向上用）
const DIAPER_SIZE_MAP = {
  '新生児': '新生児', 'S': 'Sサイズ', 'M': 'Mサイズ',
  'L': 'Lサイズ', 'BIG': 'BIGサイズ', 'BIGより大きい': 'ビッグより大きい',
};

const filterAccessories = (items, getNameFn = (p) => p.name || p.itemName || '') =>
  items.filter(item => !ACCESSORY_EXCLUDE_WORDS.some(w => getNameFn(item).includes(w)));


const App = () => {
  const [dbProducts, setDbProducts] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // New: Remote Search States
  const [remoteProducts, setRemoteProducts] = useState([]);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState(null);

  // Cross-platform price comparison (product detail)
  const [crossPlatformShops, setCrossPlatformShops] = useState([]);
  const [isCrossLoading, setIsCrossLoading] = useState(false);

  // Navigation States
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Category & Filter States
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [selectedSubCategory, setSelectedSubCategory] = useState("すべて");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("すべて");
  const [sortOrder, setSortOrder] = useState("standard");
  const [searchTerm, setSearchTerm] = useState("");
  const [giftFilter, setGiftFilter] = useState("すべて");

  // 管理モード: URLに ?admin=1 を付けると ON（localStorage で保持）
  const [isAdminMode, setIsAdminMode] = useState(() => {
    if (new URLSearchParams(window.location.search).get('admin') === '1') {
      localStorage.setItem('honestBabyAdmin', '1');
      return true;
    }
    return localStorage.getItem('honestBabyAdmin') === '1';
  });

  // ブロックリスト（非表示商品）
  const [blocklist, setBlocklist] = useState(new Set());
  
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

  // --- 検索キャッシュ（localStorage → カテゴリ別）---
  const [cachedProducts, setCachedProducts] = useState(() => {
    const cache = {};
    CATEGORIES.filter(c => c !== 'すべて').forEach(cat => {
      try {
        const stored = localStorage.getItem(`honestBabyCache_${cat}`);
        if (stored) cache[cat] = JSON.parse(stored);
      } catch {}
    });
    return cache;
  });

  // --- 検索専用 States（ホームのremoteProductsと分離）---
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // --- ランキング・ギフト States ---
  const [rankingProducts, setRankingProducts] = useState([]);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [giftProducts, setGiftProducts] = useState([]);
  const [isGiftLoading, setIsGiftLoading] = useState(false);


  // --- マイページ States（localStorage連動）---
  const [babyInfo, setBabyInfo] = useState(() => {
    try { return JSON.parse(localStorage.getItem('honestBabyBabyInfo') || 'null'); } catch { return null; }
  });
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('honestBabyRecentlyViewed') || '[]'); } catch { return []; }
  });
  const [priceAlerts, setPriceAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('honestBabyPriceAlerts') || '[]'); } catch { return []; }
  });
  const [savedSearches, setSavedSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('honestBabySavedSearches') || '[]'); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('honestBabyBabyInfo', JSON.stringify(babyInfo)); } catch {} }, [babyInfo]);
  useEffect(() => { try { localStorage.setItem('honestBabyRecentlyViewed', JSON.stringify(recentlyViewed)); } catch {} }, [recentlyViewed]);
  useEffect(() => { try { localStorage.setItem('honestBabyPriceAlerts', JSON.stringify(priceAlerts)); } catch {} }, [priceAlerts]);
  useEffect(() => { try { localStorage.setItem('honestBabySavedSearches', JSON.stringify(savedSearches)); } catch {} }, [savedSearches]);

  // モーダル制御
  const [showBabyModal, setShowBabyModal] = useState(false);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [babyForm, setBabyForm] = useState({ name: '', birthYear: new Date().getFullYear(), birthMonth: 1, gender: '' });
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [saveSearchLabel, setSaveSearchLabel] = useState('');

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
            shops: (p.shops || []).map(s => {
              let sellers = s.sellers;
              if (typeof sellers === 'string') {
                try { sellers = JSON.parse(sellers); } catch { sellers = []; }
              }
              return {
                ...s,
                name: s.shop_name,
                type: s.shop_type,
                lowestPrice: s.lowest_price,
                sellers: Array.isArray(sellers) ? sellers : []
              };
            }),
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

  // ブロックリストを起動時に読み込む
  useEffect(() => {
    supabase.from('product_blocklist').select('item_code').then(({ data }) => {
      if (data) setBlocklist(new Set(data.map(r => r.item_code)));
    });
  }, []);

  // 商品を非表示にする（管理者モード専用）
  const blockProduct = async (product) => {
    const code = product.id.replace(/^(ranking|product)-/, '');
    await supabase.from('product_blocklist').upsert({ item_code: code });
    setBlocklist(prev => new Set([...prev, code]));
    setRemoteProducts(prev => prev.filter(p => p.id !== product.id));
  };

  // 初回ロード安定化: DBデータを表示しつつ、裏側で市場最新データをAPIで取得（Discovery Engine）
  useEffect(() => {
    fetchRankingsWithAI("すべて");
  }, []);

  // 商品詳細を開いたとき楽天＋Yahoo を並列検索してクロスプラットフォーム価格比較
  useEffect(() => {
    if (!selectedProduct) { setCrossPlatformShops([]); return; }
    const fetchCross = async () => {
      setIsCrossLoading(true);
      try {
        const keyword = selectedProduct.name.split(/[\s　]+/).slice(0, 4).join(' ');
        const origPrice = selectedProduct.price || getLowestPrice(selectedProduct.shops) || 0;
        const priceMin = origPrice > 0 ? origPrice * 0.25 : 0;
        const priceMax = origPrice > 0 ? origPrice * 4 : Infinity;
        const selectedWords = keyword.split(' ').filter(w => w.length >= 2).map(w => w.toLowerCase());
        const nameMatches = (itemName) => {
          const lower = (itemName || '').toLowerCase().replace(/[\s　]/g, '');
          return selectedWords.some(w => lower.includes(w));
        };
        const priceInRange = (p) => origPrice === 0 || (p >= priceMin && p <= priceMax);

        const [rakutenResult, yahooResult] = await Promise.allSettled([
          fetch(`/api/rakuten?query=${encodeURIComponent(keyword)}`).then(r => r.json()),
          fetch(`/api/yahoo?query=${encodeURIComponent(keyword)}`).then(r => r.json())
        ]);
        const shops = [];
        if (rakutenResult.status === 'fulfilled') {
          const items = (rakutenResult.value.products || [])
            .filter(item => nameMatches(item.name) && priceInRange(item.price));
          const byShop = {};
          for (const item of items) {
            const shopName = item.brand || '楽天市場';
            if (!byShop[shopName] || item.price < byShop[shopName].price) byShop[shopName] = item;
          }
          Object.values(byShop)
            .sort((a, b) => a.price - b.price)
            .slice(0, 5)
            .forEach(item => {
              const sName = item.brand || '楽天市場';
              shops.push({ name: sName, type: 'mall', lowestPrice: item.price,
                sellers: [{ name: sName, price: item.price, shipping: 0, points: 0, url: item.url, note: '' }] });
            });
        }
        if (yahooResult.status === 'fulfilled') {
          const items = (yahooResult.value.products || [])
            .filter(item => nameMatches(item.name) && priceInRange(item.price));
          const byShop = {};
          for (const item of items) {
            const shopName = item.brand || 'Yahoo!ショッピング';
            if (!byShop[shopName] || item.price < byShop[shopName].price) byShop[shopName] = item;
          }
          Object.values(byShop)
            .sort((a, b) => a.price - b.price)
            .slice(0, 3)
            .forEach(item => {
              const sName = item.brand || 'Yahoo!ショッピング';
              shops.push({ name: sName, type: 'mall', lowestPrice: item.price,
                sellers: [{ name: sName, price: item.price, shipping: 0, points: 0, url: item.url, note: '' }] });
            });
        }
        setCrossPlatformShops(shops);
      } catch (e) {
        console.warn('Cross-platform fetch failed:', e);
      } finally {
        setIsCrossLoading(false);
      }
    };
    fetchCross();
  }, [selectedProduct]);

  // ランキングタブ: 楽天Ranking APIから直接取得（VITE_キー使用）
  const fetchRankingProducts = async () => {
    setIsRankingLoading(true);
    const appId = import.meta.env.VITE_RAKUTEN_APP_ID;
    const accessKey = import.meta.env.VITE_RAKUTEN_ACCESS_KEY || '';
    const affiliateId = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID || '';
    if (!appId) { setIsRankingLoading(false); return; }

    const genres = [
      { id: '200833', name: 'ベビーカー' },
      { id: '412209', name: '抱っこ紐' },
      { id: '205197', name: 'おむつ' },
      { id: '205208', name: 'ミルク・授乳' },
      { id: '201591', name: 'おもちゃ' },
      { id: '200822', name: '寝具・ベッド' },
      { id: '566088', name: '車用品' },
      { id: '200815', name: 'お風呂用品' },
    ];

    try {
      const results = await Promise.allSettled(
        genres.map(g =>
          fetch(`https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey}&genreId=${g.id}&affiliateId=${affiliateId}`)
            .then(r => r.json()).then(d => ({ ...d, _catName: g.name }))
        )
      );
      const merged = results.flatMap(r => {
        if (r.status !== 'fulfilled') return [];
        const catName = r.value._catName;
        return (r.value.Items || []).map(item => ({
          id: `ranking-${item.Item.itemCode}`,
          name: item.Item.itemName,
          price: item.Item.itemPrice,
          image: (item.Item.mediumImageUrls?.[0]?.imageUrl || '').replace(/_ex=\d+x\d+/, '_ex=400x400'),
          url: item.Item.affiliateUrl || item.Item.itemUrl,
          category: catName,
          rating: parseFloat(item.Item.reviewAverage) || 4.5,
          shops: [{ name: item.Item.shopName || '楽天市場', price: item.Item.itemPrice, url: item.Item.affiliateUrl || item.Item.itemUrl }]
        }));
      });
      const accessoryFiltered = filterAccessories(merged);
      const seen = new Set();
      const deduped = (accessoryFiltered.length > 0 ? accessoryFiltered : merged).filter(p => {
        if (seen.has(p.name)) return false;
        seen.add(p.name);
        return true;
      });
      setRankingProducts(deduped.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
    } catch (e) {
      console.error('Ranking fetch error:', e);
    }
    setIsRankingLoading(false);
  };

  // ギフトタブ: 楽天検索APIから直接取得（VITE_キー使用）
  const fetchGiftProducts = async (filter = 'すべて') => {
    setIsGiftLoading(true);
    const appId = import.meta.env.VITE_RAKUTEN_APP_ID;
    const accessKey = import.meta.env.VITE_RAKUTEN_ACCESS_KEY || '';
    const affiliateId = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID || '';
    if (!appId) { setIsGiftLoading(false); return; }

    const keyword = ['出産祝い', 'ギフト', filter !== 'すべて' && !filter.includes('円') ? filter : ''].filter(Boolean).join(' ');
    try {
      const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401?applicationId=${appId}&accessKey=${accessKey}&keyword=${encodeURIComponent(keyword)}&sort=-reviewCount&hits=30&availability=1&affiliateId=${affiliateId}`;
      const data = await fetch(url).then(r => r.json());
      let products = (data.Items || []).map(item => ({
        id: `gift-${item.Item.itemCode}`,
        name: item.Item.itemName,
        price: item.Item.itemPrice,
        image: (item.Item.mediumImageUrls?.[0]?.imageUrl || '').replace(/_ex=\d+x\d+/, '_ex=400x400'),
        url: item.Item.affiliateUrl || item.Item.itemUrl,
        brand: item.Item.shopName || '楽天市場',
        rating: parseFloat(item.Item.reviewAverage) || 4.5,
        category: 'ギフトセット',
        shops: [{ name: item.Item.shopName || '楽天市場', price: item.Item.itemPrice, url: item.Item.affiliateUrl || item.Item.itemUrl }]
      }));
      if (filter === '3000円〜') products = products.filter(p => p.price >= 3000 && p.price < 5000);
      else if (filter === '5000円〜') products = products.filter(p => p.price >= 5000 && p.price < 10000);
      else if (filter === '10000円〜') products = products.filter(p => p.price >= 10000);
      setGiftProducts(products);
    } catch (e) {
      console.error('Gift fetch error:', e);
    }
    setIsGiftLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'ranking') fetchRankingProducts();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'gift') fetchGiftProducts(giftFilter);
  }, [activeTab, giftFilter]);

  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      const kbHeight = Math.max(0, window.innerHeight - window.visualViewport.height);
      document.documentElement.style.setProperty('--keyboard-height', `${kbHeight}px`);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    handleResize();
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }, []);

  // --- 新機能: 市場網羅型ランキング取得エンジン ---
  const fetchRankingsWithAI = async (catName, subCat = "すべて", subSubCat = "すべて") => {
    const genre = CATEGORY_TREE.find(c => c.name === catName) || CATEGORY_TREE[0];
    setIsRemoteLoading(true);
    setRemoteError(null);
    setRemoteProducts([]);

    const parseDiaperCount = (name) => {
      const packMatch = name.match(/(\d+)枚[×x＊*](\d+)/);
      if (packMatch) return parseInt(packMatch[1]) * parseInt(packMatch[2]);
      const m = name.match(/(\d+)枚/);
      return m ? parseInt(m[1]) : null;
    };

    const NG_KEYWORDS = [
      'ふるさと納税', 'ポイント消化', 'クーポン対象', 'ポイント5倍', 'ポイント10倍',
      'お試しセット', '訳あり', 'アウトレット', '中古', 'リユース'
    ];
    const cleanName = (name) => name
      .replace(/[【［\[「『〈《][^】］\]」』〉》]{0,60}[】］\]」』〉》]/g, '')
      .replace(/[★◆▼■●▲☆◇▽□○△♪♥♡※◎◯]+/g, '')
      .replace(/\s*(送料無料|あす楽|即納|限定|新品|正規品|公式|人気|売れ筋|ランキング1位).*$/, '')
      .replace(/[\s　]+/g, ' ')
      .trim()
      .slice(0, 50);

    const mapItems = (items, cat) => items
      .filter(item => !NG_KEYWORDS.some(kw => item.Item.itemName.includes(kw)))
      .map(item => {
        const name = cleanName(item.Item.itemName);
        const rawImg = item.Item.mediumImageUrls?.[0]?.imageUrl || "";
        const unitCount = cat === "おむつ" ? parseDiaperCount(item.Item.itemName) : null;
        return {
          id: `ranking-${item.Item.itemCode}`,
          name,
          price: item.Item.itemPrice,
          image: rawImg.replace(/_ex=\d+x\d+/, '_ex=400x400'),
          url: item.Item.affiliateUrl || item.Item.itemUrl,
          brand: "",
          category: cat,
          rating: parseFloat(item.Item.reviewAverage) || 4.5,
          unitCount,
          unitName: unitCount ? "枚" : null,
          shops: [{ name: item.Item.shopName || "楽天市場", price: item.Item.itemPrice, url: item.Item.affiliateUrl || item.Item.itemUrl }]
        };
      });

    try {
      const appId = import.meta.env.VITE_RAKUTEN_APP_ID;
      const accessKey = import.meta.env.VITE_RAKUTEN_ACCESS_KEY || '';
      const affiliateId = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID || '';
      if (!appId) throw new Error("VITE_RAKUTEN_APP_ID not set");

      const rankingUrl = (genreId) => `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey}&genreId=${genreId}&affiliateId=${affiliateId}`;
      const searchUrl = (keyword, page = 1, sort = '-reviewCount') => `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401?applicationId=${appId}&accessKey=${accessKey}&keyword=${encodeURIComponent(keyword)}&sort=${sort}&hits=30&page=${page}&availability=1&affiliateId=${affiliateId}`;

      const normalizeKey = (name) => name.replace(/[\s　]/g, '').toLowerCase().slice(0, 25);
      const dedupeAndMergeShops = (items) => {
        const map = new Map();
        for (const item of items) {
          const key = normalizeKey(item.name);
          if (!map.has(key)) {
            map.set(key, { ...item, shops: [...item.shops] });
          } else {
            const existing = map.get(key);
            const newShops = item.shops.filter(s => !existing.shops.some(es => es.url === s.url));
            existing.shops.push(...newShops);
            if (item.price < existing.price) {
              existing.price = item.price;
              existing.image = item.image;
            }
          }
        }
        return Array.from(map.values());
      };

      // メインカテゴリー表示はRanking API（genreId指定 → ジャンル外商品が構造的に混入しない）
      // サブカテゴリー選択時のみ Search API（genreId + サブキーワードで絞り込み）
      const useSearch = !!(subCat && subCat !== "すべて");
      const genreId = genre.id || '100533';

      let rawItems;
      if (useSearch) {
        // おむつサイズの場合、「S」→「Sサイズ」に正規化して検索精度を上げる
        const normalizedSubSub = (catName === 'おむつ' && DIAPER_SIZE_MAP[subSubCat])
          ? DIAPER_SIZE_MAP[subSubCat] : subSubCat;
        const subKeyword = [genre.keyword, subCat !== "すべて" ? subCat : "", normalizedSubSub !== "すべて" ? normalizedSubSub : ""].filter(Boolean).join(" ").trim();
        // 複数ソート×3ページで並列取得（最大270件→重複排除後150〜200件）
        const SORTS = ['-reviewCount', 'standard', '-reviewAverage'];
        const subFetches = SORTS.flatMap(sort =>
          [1, 2, 3].map(p =>
            fetch(`${searchUrl(subKeyword, p, sort)}&genreId=${genreId}`)
              .then(r => r.ok ? r.json() : { Items: [] })
              .catch(() => ({ Items: [] }))
          )
        );
        const subResults = await Promise.all(subFetches);
        if (!subResults[0]?.Items && !subResults[1]?.Items) throw new Error('Search API Error');
        const combined = subResults.flatMap(d => d.Items || []);
        rawItems = dedupeAndMergeShops(mapItems(combined, catName));

        // おむつサイズ指定時: 対象サイズが名前に含まれる商品のみに絞り込む
        if (catName === 'おむつ' && subSubCat && subSubCat !== 'すべて' && DIAPER_SIZE_MAP[subSubCat]) {
          const sizeLabel = DIAPER_SIZE_MAP[subSubCat];
          const altLabel = subSubCat; // 元の表記("S"等)でも検索
          const sizeFiltered = rawItems.filter(p => {
            const name = p.name || '';
            if (!name.includes(sizeLabel) && !name.includes(altLabel)) return false;
            // バラエティ・まとめ買いセット（複数サイズ混在）を除外
            if (/バラエティ|お試し|各サイズ|まとめ買い|詰め合わせ|セット内容|各種サイズ/.test(name)) return false;
            return true;
          });
          if (sizeFiltered.length > 0) rawItems = sizeFiltered;
        }
      } else {
        // メインカテゴリー: 商品価格ナビAPIを優先（3ページ並列）、失敗時はRanking APIにフォールバック
        try {
          const mkProductUrl = (page) => {
            const p = new URLSearchParams({ genreId, hits: 30, page });
            if (genre.keyword) p.set('query', genre.keyword);
            return `/api/rakuten-product?${p}`;
          };
          // 商品価格ナビAPI: 3ページ並列
          const [pRes1, pRes2, pRes3] = await Promise.all([fetch(mkProductUrl(1)), fetch(mkProductUrl(2)), fetch(mkProductUrl(3))]);
          if (pRes1.ok) {
            const pData1 = await pRes1.json();
            const pData2 = pRes2.ok ? await pRes2.json() : { products: [] };
            const pData3 = pRes3.ok ? await pRes3.json() : { products: [] };
            const allProducts = [...(pData1.products || []), ...(pData2.products || []), ...(pData3.products || [])];
            if (allProducts.length > 0) {
              const seen = new Set();
              rawItems = allProducts
                .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; })
                .map(p => ({
                  ...p,
                  category: catName,
                  unitCount: catName === "おむつ" ? parseDiaperCount(p.name) : null,
                  unitName: catName === "おむつ" ? "枚" : null,
                })).filter(p => {
                  const code = p.id.replace('product-', '');
                  return !blocklist.has(code);
                });
            }
          }
        } catch (_) { /* フォールバックへ */ }

        // 通常商品検索APIを複数ソートで並列取得しマージ（市場網羅）
        if (genre.keyword) {
          try {
            const SORTS = ['-reviewCount', 'standard', '-reviewAverage'];
            const mainFetches = SORTS.flatMap(sort =>
              [1, 2, 3].map(p =>
                fetch(`${searchUrl(genre.keyword, p, sort)}&genreId=${genreId}`)
                  .then(r => r.ok ? r.json() : { Items: [] })
                  .catch(() => ({ Items: [] }))
              )
            );
            const mainResults = await Promise.all(mainFetches);
            const searchItems = dedupeAndMergeShops(mapItems(mainResults.flatMap(d => d.Items || []), catName));
            if (searchItems.length > 0) {
              // 商品価格ナビ結果とマージして重複排除
              const merged = [...(rawItems || []), ...searchItems];
              rawItems = dedupeAndMergeShops(merged);
            }
          } catch (_) { /* 失敗しても既存rawItemsを維持 */ }
        }

        // 何も取れなかった場合のみ Ranking API にフォールバック
        if (!rawItems || rawItems.length === 0) {
          const rankingRes = await fetch(rankingUrl(genreId));
          if (!rankingRes.ok) throw new Error(`Ranking API Error: ${rankingRes.status}`);
          const rankingData = await rankingRes.json();
          rawItems = rankingData.Items ? mapItems(rankingData.Items, catName) : [];
        }
      }

      // 0件のとき: Ranking API（genreId） → ベビー全体の順にフォールバック
      if (!rawItems || rawItems.length === 0) {
        const fallbackId = genreId !== '100533' ? genreId : '100533';
        const fallbackRes = await fetch(rankingUrl(fallbackId));
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          rawItems = fallbackData.Items ? mapItems(fallbackData.Items, catName) : [];
        }
      }

      if (rawItems.length === 0) {
        setRemoteProducts([]);
        return;
      }

      // ランキングAPIはgenreId済みなのでアクセサリー除外のみ（mustAny不要）
      // アクセサリー除外（本体商品のみ残す）
      const accessoryFiltered = filterAccessories(rawItems);
      if (accessoryFiltered.length > 0) rawItems = accessoryFiltered;

      // Step 1: 生データをすぐに表示（APIが動いていれば商品が即座に出る）
      const immediateProducts = rawItems.map(i => ({ ...i, isMarketWide: true }));
      setRemoteProducts(immediateProducts);
      setIsRemoteLoading(false);
    } catch (e) {
      console.error("Market-Wide Fetch error:", e);
      setRemoteError(`${e.message} (API Check Required)`);
    } finally {
      setIsRemoteLoading(false);
    }
  };

  // URLからショップ名を判定するヘルパー
  const getShopNameFromUrl = (url) => {
    if (!url) return '外部ショップ';
    if (url.includes('rakuten')) return '楽天市場';
    if (url.includes('yahoo.co.jp') || url.includes('shopping.yahoo')) return 'Yahoo!ショッピング';
    if (url.includes('amazon')) return 'Amazon';
    return '外部ショップ';
  };

  // --- 既存機能の拡張: AI搭載・楽天＋Yahoo並列検索ロジック ---
  const autoSaveSearchResultsToDb = async (products, keyword) => {
    const matchedCat = CATEGORY_TREE.find(cat =>
      cat.name !== "すべて" && (
        keyword.includes(cat.name) ||
        (cat.keyword && keyword.includes(cat.keyword)) ||
        cat.subs?.some(s => {
          const sName = typeof s === 'string' ? s : s.name;
          return keyword.includes(sName);
        })
      )
    );
    const category = matchedCat?.name;
    if (!category) return;
    const toSave = products.filter(p => p.name && p.image).slice(0, 10);
    if (toSave.length === 0) return;

    // localStorage（即時・このユーザー）
    try {
      localStorage.setItem(`honestBabyCache_${category}`, JSON.stringify(toSave));
      setCachedProducts(prev => ({ ...prev, [category]: toSave }));
    } catch {}

    // Supabase（全ユーザー共有）
    try {
      await supabase.from('products').upsert(
        toSave.map(p => ({
          name: p.name.slice(0, 200),
          category,
          sub_category: '本体',
          image_url: p.image || null,
          rating: Math.round((p.rating || 4.0) * 10) / 10,
          reviews_count: p.reviews_count || 0,
          ai_analysis: p.ai_analysis || null,
        })),
        { onConflict: 'name', ignoreDuplicates: true }
      );
    } catch {}
  };

  const fetchRemoteProductsWithAI = async (keyword) => {
    if (!keyword.trim()) return;

    setIsSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      // 1. 楽天・Yahoo両方から並列取得（ベビー関連語がなければ補完）
      const babyWords = ['ベビー', '赤ちゃん', 'おむつ', '抱っこ', '哺乳', 'おもちゃ', 'ミルク', 'マタニティ'];
      const needsBaby = !babyWords.some(w => keyword.includes(w));
      const searchKeyword = needsBaby ? `ベビー ${keyword}` : keyword;
      const [rakutenResult, yahooResult] = await Promise.allSettled([
        fetch(`/api/rakuten?query=${encodeURIComponent(searchKeyword)}`).then(r => r.json()),
        fetch(`/api/yahoo?query=${encodeURIComponent(searchKeyword)}`).then(r => r.json())
      ]);

      const rakutenItems = rakutenResult.status === 'fulfilled'
        ? (rakutenResult.value.products || []).map(item => ({
            name: item.name,
            price: item.price,
            url: item.url,
            image: item.image || '',
            source: 'rakuten'
          }))
        : [];

      const yahooItems = yahooResult.status === 'fulfilled'
        ? (yahooResult.value.products || []).map(item => ({
            name: item.name,
            price: item.price,
            url: item.url,
            image: item.image || '',
            source: 'yahoo'
          }))
        : [];

      const raw = [...rakutenItems, ...yahooItems];
      const filtered = filterAccessories(raw);
      const allItems = filtered.length > 0 ? filtered : raw;

      if (allItems.length === 0) {
        setSearchError("検索結果が見つかりませんでした。別のキーワードをお試しください。");
        return;
      }

      // 生データから整形する共通関数
      const formatRawItems = (items) => items.map((p, i) => ({
        id: `remote-${i}-${Date.now()}`,
        name: p.name,
        brand: "メーカー不明",
        category: keyword,
        image: p.image,
        rating: 4.0,
        reviews_count: 0,
        ai_analysis: null,
        shops: [{
          shop_name: p.source === 'rakuten' ? '楽天市場' : 'Yahoo!ショッピング',
          shop_type: 'mall',
          lowest_price: p.price,
          url: p.url
        }]
      }));

      // 2. Gemini AI で厳選（キーがなければ生データをそのまま使う）
      const gApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      let formatted;

      try {
        const aiPrompt = `あなたはベビー用品のプロコンサルタントです。以下の楽天・Yahoo!ショッピングの検索結果（JSON）を読み込み、以下のルールで「最高の3〜5件」に厳選してJSON形式で出力してください。
ルール：
1. 重複（同じ商品の別店舗）は1つにまとめる。
2. 「車輪だけ」「カバーだけ」などの付属品は除外し「本体」のみ残す。
3. 商品名を分かりやすく整える。
4. AI分析として「どんな人におすすめか」を1文で作成。

出力形式 (JSONのみ、他の文字を含めない):
[{"name": "...", "price": 0, "url": "...", "image": "...", "source": "rakuten", "aiAnalysis": "...", "brand": "..."}]

検索結果データ: ${JSON.stringify(allItems.slice(0, 20))}`;

          const aiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: aiPrompt })
          });

          const aiData = await aiRes.json();
          const aiText = aiData.text || "";
          const jsonMatch = aiText.match(/\[[\s\S]*\]/);
          const cleanedProducts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

          if (cleanedProducts.length > 0) {
            formatted = cleanedProducts.map((p, i) => ({
              id: `remote-${i}-${Date.now()}`,
              name: p.name,
              brand: p.brand || "メーカー不明",
              category: keyword,
              image: p.image,
              rating: 4.0 + (Math.random() * 1.0),
              reviews_count: Math.floor(Math.random() * 500) + 50,
              ai_analysis: p.aiAnalysis,
              shops: [{
                shop_name: getShopNameFromUrl(p.url),
                shop_type: 'mall',
                lowest_price: p.price,
                url: p.url
              }]
            }));
          } else {
            // Gemini が空を返したら生データにフォールバック
            formatted = formatRawItems(allItems);
          }
        } catch {
          // Gemini 失敗でも生データにフォールバック
          formatted = formatRawItems(allItems);
        }

      setSearchResults(formatted);
      autoSaveSearchResultsToDb(formatted, keyword);
    } catch (err) {
      console.error("Remote Search Error:", err);
      setSearchError(err.message);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubCategory("すべて");
    setSelectedSubSubCategory("すべて");
    setSortOrder("standard");
    fetchRankingsWithAI(cat, "すべて");
  };

  const handleSubCategoryChange = (sub) => {
    setSelectedSubCategory(sub);
    setSelectedSubSubCategory("すべて");
    fetchRankingsWithAI(selectedCategory, sub);
  };

  const handleSubSubCategoryChange = (subsub) => {
    setSelectedSubSubCategory(subsub);
    fetchRankingsWithAI(selectedCategory, selectedSubCategory, subsub);
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
  // ステップ3: ショップデータ正規化 — API経由でもDB経由でも同じ形式に統一
  const normalizeShop = (shop) => {
    if (!shop) return { name: 'ショップ', type: 'mall', lowestPrice: 0, sellers: [] };
    const name = shop.name || shop.shop_name || 'ショップ';
    const type = shop.type || shop.shop_type || 'mall';
    const lowestPrice = Number(shop.lowestPrice || shop.lowest_price || shop.price || 0);
    let rawSellers = shop.sellers;
    if (typeof rawSellers === 'string') {
      try { rawSellers = JSON.parse(rawSellers); } catch { rawSellers = []; }
    }
    const sellers = Array.isArray(rawSellers) && rawSellers.length > 0
      ? rawSellers
      : (shop.url ? [{ name, price: lowestPrice, shipping: shop.shipping ?? 0, points: shop.points ?? 0, url: shop.url, note: shop.note || '' }] : []);
    return { ...shop, name, type, lowestPrice, sellers };
  };

  const normalizeShops = (shops) => {
    if (!shops || shops.length === 0) return [];
    return shops.map(normalizeShop);
  };

  const getLowestPrice = (shops) => {
    if (!shops || shops.length === 0) return 0;
    const normalized = normalizeShops(shops);
    const prices = normalized.map(s => s.lowestPrice).filter(p => p > 0 && isFinite(p));
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const userText = userInput;
    const newMessages = [...chatMessages, { role: 'user', text: userText }];
    setChatMessages(newMessages);
    setUserInput("");
    setIsAiTyping(true);

    try {
      // 既存の検索結果があればそれを使う、なければユーザーの質問で検索する
      let contextProducts = searchResults.length > 0 ? searchResults : [];

      if (contextProducts.length === 0) {
        try {
          const categoryGenreMap = [
            { keywords: ['ベビーカー', 'バギー', 'ストローラー'], genreId: '200833' },
            { keywords: ['抱っこ紐', '抱っこひも', 'だっこ', 'スリング'], genreId: '412209' },
            { keywords: ['おむつ', 'オムツ', 'パンツ型', 'テープ型', 'おしりふき'], genreId: '205197' },
            { keywords: ['ミルク', '粉ミルク', '授乳', '哺乳瓶', '搾乳'], genreId: '205208' },
            { keywords: ['ベッド', '寝具', 'ねんね', 'スリーパー'], genreId: '200822' },
            { keywords: ['おもちゃ', 'ガラガラ', '知育', 'プレイマット', 'ぬいぐるみ'], genreId: '201591' },
            { keywords: ['チャイルドシート', 'カーシート', 'ジュニアシート'], genreId: '566088' },
            { keywords: ['離乳食', '食器', 'スプーン', 'マグ', 'ベビーフード'], genreId: '213980' },
            { keywords: ['お風呂', 'バス', 'ベビーバス', '沐浴'], genreId: '200815' },
            { keywords: ['ゲート', 'ガード', 'ベビーモニター', '安全'], genreId: '200841' },
          ];
          const matched = categoryGenreMap.find(m => m.keywords.some(k => userText.includes(k)));
          const genreId = matched?.genreId ?? '100533';
          const appId = import.meta.env.VITE_RAKUTEN_APP_ID;
          const accessKey = import.meta.env.VITE_RAKUTEN_ACCESS_KEY || '';
          const affiliateId = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID || '';
          if (!appId) throw new Error('VITE_RAKUTEN_APP_ID not set');
          const rankingUrl = `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey}&genreId=${genreId}&affiliateId=${affiliateId}`;
          const res = await fetch(rankingUrl, { headers: { Referer: 'https://honestbaby-care.com' } });
          const resData = await res.json();
          const allItems = (resData.Items || []).map(i => i.Item).filter(Boolean);
          const filtered = filterAccessories(allItems, item => item.itemName || '');
          contextProducts = (filtered.length > 0 ? filtered : allItems)
            .slice(0, 6)
            .map((item, i) => ({
              id: `chat-${i}-${Date.now()}`,
              name: item.itemName,
              brand: item.shopName || '楽天市場',
              category: matched ? userText : 'ベビー用品',
              image: (item.mediumImageUrls?.[0]?.imageUrl || '').replace(/_ex=\d+x\d+/, '_ex=400x400'),
              rating: parseFloat(item.reviewAverage) || 4.0,
              reviews_count: 0,
              ai_analysis: null,
              shops: [{ shop_name: '楽天市場', shop_type: 'mall', lowest_price: item.itemPrice, url: item.affiliateUrl || item.itemUrl }]
            }));
        } catch (e) {
          console.error('Ranking chat fetch failed:', e);
        }
      }

      let prompt;
      if (contextProducts.length > 0) {
        const productList = contextProducts.slice(0, 6).map((p, i) => {
          const price = p.shops?.[0]?.lowest_price ?? p.price;
          return `${i + 1}. ${p.name}（${price ? price.toLocaleString() + '円' : '価格不明'}）`;
        }).join('\n');
        prompt = `あなたはベビー用品比較アプリ「Honest Baby」のAIコンサルタントです。

【絶対ルール】
- 必ず以下の【商品リスト】にある番号と商品名だけを使ってください
- リストに存在しない商品名（例：マグネタック、マリオバティ等）は絶対に作ってはいけません
- 2〜3個の商品を選び、各商品を「✅ X番：おすすめ理由（1〜2文）」の形式で答えてください
- 絵文字を使って友人のように温かく答えてください

【商品リスト】
${productList}

【ユーザーの質問】
${userText}

【回答例】
お探しですね😊 おすすめはこちらです！

✅ 1番：〇〇という理由でとても人気です👶
✅ 3番：コスパが良く〜な方にぴったりです💕

上記フォーマットで答えてください。リスト外の商品名は絶対に使わないでください。`;
      } else {
        prompt = `あなたはベビー用品アドバイザーです。
【絶対ルール】今回は商品データが取得できていません。以下を厳守してください：
- Aprica、Combi、Ergobaby、コンビ、西松屋など、いかなるブランド名・商品名も絶対に出さないこと
- 「〜がおすすめです」「〜を選ぶといいです」など具体的な推薦は禁止
- 選び方の一般的なポイントを2〜3文で、絵文字を使い友人のように答えること
ユーザーの質問: ${userText}`;
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      if (data.error) {
        setChatMessages([...newMessages, { role: 'assistant', text: `⚠️ エラー: ${data.error}` }]);
        return;
      }
      const aiText = data.text || "すみません、一時的に考え込んでしまいました💦";
      setChatMessages([...newMessages, { role: 'assistant', text: aiText, products: contextProducts.slice(0, 3) }]);
    } catch (e) {
      console.error("AI Chat Error:", e);
      setChatMessages([...newMessages, { role: 'assistant', text: `⚠️ ${e.message}` }]);
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

  const openProduct = (product) => {
    setSelectedProduct(product);
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [{ id: product.id, name: product.name, image: product.image, price: product.price, rating: product.rating }, ...filtered].slice(0, 10);
    });
  };

  const ProductCard = ({ product, localRank = null }) => (
    <div
      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full relative active:scale-95 transition-all cursor-pointer border border-[#F4EFEB]"
      onClick={() => openProduct(product)}
    >
      <div className="relative aspect-square bg-[#F9F6F3] p-4">
        <img 
          src={product.image || "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby"} 
          onError={(e) => { e.target.src = "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Loading..."; }}
          className="w-full h-full object-cover rounded-[1.5rem]" 
          alt={product.name} 
        />
        <button
          onClick={(e) => toggleFavorite(e, product)}
          className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-sm z-10 hover:bg-rose-50 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'text-rose-400 fill-current' : 'text-[#D4CDC7]'}`} />
        </button>
        {isAdminMode && (
          <button
            onClick={(e) => { e.stopPropagation(); blockProduct(product); }}
            title="この商品を非表示にする"
            className="absolute top-6 left-6 bg-red-500 text-white w-7 h-7 rounded-full text-sm font-black shadow-md z-30 flex items-center justify-center hover:bg-red-600"
          >×</button>
        )}
        {localRank && (
          <div className="absolute top-6 left-6 bg-[#F9DC5C] text-[#5A4C4C] w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-md border-2 border-white">
            {localRank}
          </div>
        )}
        {/* 動的なおすすめバッジ */}
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
      const matchSubSub = selectedSubSubCategory === "すべて" || p.subSubCategory === selectedSubSubCategory;
      return matchCat && matchSub && matchSubSub;
    });
    
    // カテゴリ選択中でDBにデータがない、またはリモート検索結果がある場合
    const showRemote = remoteProducts.length > 0 || isRemoteLoading;

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

        <div className="relative">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-5 -mx-4 px-4">
            {CATEGORY_TREE.map(cat => (
              <button
                key={cat.name}
                onClick={() => handleCategoryChange(cat.name)}
                className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
                  selectedCategory === cat.name
                    ? 'bg-[#7B8E76] text-white shadow-md'
                    : 'bg-[#F0EBE6] text-[#7B8E76]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-5 w-16 bg-gradient-to-l from-[#FFFDFB] to-transparent flex items-center justify-end pr-2">
            <ChevronRight className="w-4 h-4 text-[#7B8E76] opacity-60" />
          </div>
        </div>

        {selectedCategory !== "すべて" && (() => {
          const currentSubs = CATEGORY_TREE.find(c => c.name === selectedCategory)?.subs || [];
          if (currentSubs.length === 0) return null;
          const getSubName = (sub) => typeof sub === 'string' ? sub : sub.name;
          const currentSubObj = currentSubs.find(s => getSubName(s) === selectedSubCategory);
          const currentSubsubs = currentSubObj?.subsubs || [];
          return (
            <>
              <div className="mb-3 relative">
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                  {["すべて", ...currentSubs].map(sub => {
                    const subName = getSubName(sub);
                    return (
                      <button
                        key={subName}
                        onClick={() => handleSubCategoryChange(subName)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                          selectedSubCategory === subName
                            ? 'bg-[#5A4C4C] text-white shadow-sm'
                            : 'bg-[#F0EBE6] text-[#7B8E76]'
                        }`}
                      >
                        {subName}
                      </button>
                    );
                  })}
                </div>
              </div>
              {currentSubsubs.length > 0 && (
                <div className="mb-5 relative">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                    {["すべて", ...currentSubsubs].map(subsub => (
                      <button
                        key={subsub}
                        onClick={() => handleSubSubCategoryChange(subsub)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                          selectedSubSubCategory === subsub
                            ? 'bg-[#7B8E76] text-white shadow-sm'
                            : 'bg-[#EBF0EA] text-[#5A4C4C]'
                        }`}
                      >
                        {subsub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}

        <div className="flex items-center justify-between mb-5 px-1 mt-4">
          <h3 className="font-black text-[#5A4C4C] text-xl">
            {selectedCategory === "すべて" ? "おすすめピックアップ" : `${selectedCategory}の検索結果`}
          </h3>
          {selectedCategory !== "すべて" && (
            <button
              onClick={() => { setSaveSearchLabel(selectedCategory); setShowSaveSearchModal(true); }}
              className="text-[10px] text-[#7B8E76] font-bold bg-[#EBF0EA] px-3 py-1.5 rounded-full active:scale-95 transition-transform flex items-center gap-1"
            >
              <Bookmark className="w-3 h-3" /> 保存
            </button>
          )}
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
            <p className="text-[10px] text-rose-300 font-mono break-all mb-4">{remoteError}</p>
            <button
              onClick={() => fetchRankingsWithAI(selectedCategory)}
              className="bg-[#7B8E76] text-white px-6 py-2.5 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all"
            >
              もう一度試す
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* リモート（API）から取得した最新の市場トレンド商品を最優先（上部）に表示 */}
          {remoteProducts.length > 0 && remoteProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}

          {/* Supabase蓄積商品（ユーザー検索で積み上がった全体共有データ） */}
          {!isRemoteLoading && remoteProducts.length === 0 && filtered.length > 0 && (
            filtered.map((p) => <ProductCard key={p.id} product={p} />)
          )}

          {/* localStorageキャッシュ（Supabaseも空の場合の即時フォールバック） */}
          {!isRemoteLoading && remoteProducts.length === 0 && filtered.length === 0 && cachedProducts[selectedCategory]?.length > 0 && (
            cachedProducts[selectedCategory].map((p) => <ProductCard key={p.id} product={p} />)
          )}

          {/* Empty State */}
          {!isRemoteLoading && remoteProducts.length === 0 && filtered.length === 0 && !cachedProducts[selectedCategory]?.length && (
             <div className="col-span-2 py-20 text-center text-[#A5A19E] text-xs font-bold uppercase tracking-widest leading-loose">該当する商品は見つかりませんでした</div>
          )}
        </div>

        {/* 自律成長型プラットフォーム・フッター */}
        <div className="text-center py-10 opacity-30">
          <p className="text-[9px] font-black tracking-widest text-[#A5A19E]">HONEST BABY PLATFORM v2.0.0 (AUTONOMOUS)</p>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-[7px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 animate-pulse">DISCOVERY ENGINE: RUNNING</span>
            <span className={`text-[7px] px-2 py-0.5 rounded-full ${remoteError ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>API:{remoteError ? 'ERR' : 'OK'}</span>
          </div>
          <p className="text-[8px] text-[#A5A19E] mt-2 uppercase">Self-Growing Market Indexing Active</p>
        </div>
      </div>
    );
  };

  const renderRanking = () => {
    return (
      <div className="animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3 mb-8 px-1 mt-2">
          <div className="w-12 h-12 bg-[#FFF9E6] rounded-[1.25rem] flex items-center justify-center text-[#D4AF37] shadow-sm"><Award className="w-7 h-7" /></div>
          <div>
            <h3 className="font-serif font-black text-[#5A4C4C] text-2xl">総合ランキング</h3>
            <p className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest leading-none mt-1">Real-time Top Picks</p>
          </div>
        </div>
        {isRankingLoading ? (
          <div className="text-center py-20 text-[#A5A19E] text-xs font-bold animate-pulse">ランキングを読み込み中...</div>
        ) : (
          <div className="space-y-5">
            {rankingProducts.map((p, idx) => (
              <div key={p.id || idx} className="bg-white rounded-[2.5rem] p-4 flex gap-5 border border-[#F4EFEB] shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative active:scale-95 transition-all cursor-pointer" onClick={() => openProduct(p)}>
                <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg border-2 border-white ${idx === 0 ? 'bg-[#F9DC5C] text-[#5A4C4C]' : idx === 1 ? 'bg-[#D4CDC7] text-white' : idx === 2 ? 'bg-[#D4AF37] text-white' : 'bg-[#7B8E76] text-white'}`}>{idx + 1}</div>
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-[#F9F6F3] p-2"><img src={p.image || "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby"} onError={(e) => { e.target.src = "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Loading..."; }} className="w-full h-full object-cover rounded-xl" alt={p.name} /></div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-[#A5A19E] uppercase tracking-widest">{p.category}</span>
                  <h4 className="text-sm font-bold text-[#5A4C4C] leading-tight mb-2 line-clamp-2">{p.name}</h4>
                  <div className="flex items-end justify-between">
                    <p className="text-lg font-black text-[#7B8E76]">¥{(p.price || getLowestPrice(p.shops)).toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#A5A19E] bg-[#FFF9E6] px-2 py-0.5 rounded-full"><Star className="w-3 h-3 text-[#D4AF37] fill-current" /> {Number(p.rating || 0).toFixed(1)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGift = () => {
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
          {isGiftLoading
            ? <div className="col-span-2 py-10 text-center text-[#A5A19E] text-xs font-bold animate-pulse">ギフト商品を検索中...</div>
            : giftProducts.length > 0
              ? giftProducts.map((p, i) => <ProductCard key={p.id || i} product={p} />)
              : <div className="col-span-2 py-10 text-center text-[#A5A19E] text-xs font-bold">条件に合うギフトが見つかりません</div>}
        </div>
      </div>
    );
  };

  const renderUser = () => {
    const now = new Date();
    const babyAgeMonths = babyInfo
      ? (now.getFullYear() - babyInfo.birthYear) * 12 + (now.getMonth() + 1 - babyInfo.birthMonth)
      : null;
    const babyAgeLabel = babyAgeMonths != null
      ? babyAgeMonths < 12 ? `${babyAgeMonths}ヶ月` : `${Math.floor(babyAgeMonths / 12)}歳${babyAgeMonths % 12 ? `${babyAgeMonths % 12}ヶ月` : ''}`
      : null;

    return (
      <div className="animate-in slide-in-from-right duration-300 pb-20">
        {/* プロフィールカード */}
        <div className="bg-gradient-to-b from-[#FFF9F0] to-transparent -mx-6 px-6 pt-2 pb-8 mb-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif font-black text-[#5A4C4C] text-2xl">マイページ</h2>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F4EFEB] flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Baby className="w-32 h-32 text-[#7B8E76]" /></div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#F2ABAC] to-[#F9DC5C] flex items-center justify-center text-white shadow-md relative z-10">
              {babyInfo ? <Baby className="w-8 h-8" /> : <User className="w-8 h-8" />}
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-[#5A4C4C] leading-tight">
                {babyInfo?.name ? `${babyInfo.name}のママ・パパ` : 'ゲスト様'}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {babyAgeLabel && (
                  <span className="text-[10px] text-white bg-[#F2ABAC] px-2 py-0.5 rounded-md font-bold">{babyAgeLabel}</span>
                )}
                {babyInfo?.gender && (
                  <span className="text-[10px] text-white bg-[#7B8E76] px-2 py-0.5 rounded-md font-bold">{babyInfo.gender}</span>
                )}
                <button onClick={() => {
                  setBabyForm(babyInfo ? { ...babyInfo } : { name: '', birthYear: now.getFullYear(), birthMonth: now.getMonth() + 1, gender: '' });
                  setShowBabyModal(true);
                }} className="text-[10px] text-[#A5A19E] flex items-center gap-0.5 font-bold hover:text-[#5A4C4C] transition-colors">
                  {babyInfo ? '編集' : 'プロフィール登録'} <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Myベビー情報 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-black text-[#5A4C4C] flex items-center gap-2">
              <Baby className="w-5 h-5 text-[#F2ABAC]" /> Myベビー情報
            </h3>
            <span className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest bg-[#F9F6F3] px-2 py-1 rounded-md">おすすめの最適化</span>
          </div>
          <div onClick={() => {
            setBabyForm(babyInfo ? { ...babyInfo } : { name: '', birthYear: now.getFullYear(), birthMonth: now.getMonth() + 1, gender: '' });
            setShowBabyModal(true);
          }} className="bg-[#FFF5F5] border border-[#FFEBEB] p-5 rounded-[2rem] shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#F2ABAC] rounded-l-[2rem]"></div>
            <div className="pl-2">
              {babyInfo ? (
                <>
                  <p className="text-[10px] font-bold text-[#8E8282] mb-1">登録済み</p>
                  <p className="text-sm font-black text-[#5A4C4C]">
                    {babyInfo.name || 'お子さん'} · {babyAgeLabel} · {babyInfo.gender || '性別未設定'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-[#8E8282] mb-1">年齢・月齢を登録すると</p>
                  <p className="text-sm font-black text-[#5A4C4C]">ぴったりのアイテムをAIが提案✨</p>
                </>
              )}
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#F2ABAC] shadow-sm group-hover:bg-[#F2ABAC] group-hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 最近見た商品 */}
        <div className="mb-8">
          <h3 className="font-black text-[#5A4C4C] mb-4 px-1 flex items-center gap-2">
            <History className="w-5 h-5 text-[#7B8E76]" /> 最近見た商品
          </h3>
          {recentlyViewed.length === 0 ? (
            <p className="text-xs text-[#A5A19E] font-bold text-center py-6 bg-[#F9F6F3] rounded-[2rem]">まだ見ていません</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {recentlyViewed.map(p => (
                <div key={p.id} onClick={() => { const full = [...remoteProducts, ...dbProducts].find(r => r.id === p.id) || p; openProduct(full); }}
                  className="flex-shrink-0 w-28 cursor-pointer active:scale-95 transition-transform">
                  <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden bg-[#F9F6F3] mb-2">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#A5A19E]"><Package className="w-8 h-8" /></div>}
                  </div>
                  <p className="text-[10px] font-bold text-[#5A4C4C] leading-tight line-clamp-2">{p.name}</p>
                  {p.price && <p className="text-[10px] text-[#F2ABAC] font-black mt-0.5">¥{p.price.toLocaleString()}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-[#F4EFEB] p-5 rounded-[2rem] shadow-sm flex flex-col justify-center active:scale-95 transition-transform cursor-pointer" onClick={() => setActiveTab('heart')}>
            <div className="w-12 h-12 bg-[#FFF5F5] rounded-[1.25rem] flex items-center justify-center text-[#F2ABAC] mb-3"><Heart className="w-6 h-6 fill-current" /></div>
            <p className="text-sm font-black text-[#5A4C4C]">保存リスト</p>
            <p className="text-[10px] text-[#A5A19E] font-bold mt-1">{favorites.length} items</p>
          </div>
          <div className="bg-white border border-[#F4EFEB] p-5 rounded-[2rem] shadow-sm flex flex-col justify-center active:scale-95 transition-transform cursor-pointer" onClick={() => setAlertTargetPrice('') || setShowPriceAlertModal(false)}>
            <div className="w-12 h-12 bg-[#FFF9E6] rounded-[1.25rem] flex items-center justify-center text-[#D4AF37] mb-3"><BellRing className="w-6 h-6" /></div>
            <p className="text-sm font-black text-[#5A4C4C]">価格アラート</p>
            <p className="text-[10px] text-[#A5A19E] font-bold mt-1">{priceAlerts.length > 0 ? `${priceAlerts.length}件設定中` : '値下がり通知を設定'}</p>
          </div>
        </div>

        {/* 価格アラート一覧 */}
        {priceAlerts.length > 0 && (
          <div className="mb-8">
            <h3 className="font-black text-[#5A4C4C] mb-4 px-1 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-[#D4AF37]" /> 設定中のアラート
            </h3>
            <div className="space-y-3">
              {priceAlerts.map(alert => (
                <div key={alert.id} className="bg-white border border-[#F4EFEB] p-4 rounded-[1.5rem] shadow-sm flex items-center gap-3">
                  <div className="w-14 h-14 rounded-[1rem] overflow-hidden bg-[#F9F6F3] flex-shrink-0">
                    {alert.image ? <img src={alert.image} alt={alert.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-[#A5A19E] m-auto mt-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#5A4C4C] leading-tight line-clamp-1">{alert.name}</p>
                    <p className="text-[10px] text-[#A5A19E] font-bold mt-0.5">登録価格 ¥{Number(alert.price).toLocaleString()}</p>
                    <p className="text-[10px] text-[#D4AF37] font-black">目標 ¥{Number(alert.targetPrice).toLocaleString()} 以下</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-[#F2ABAC] text-white px-2 py-1 rounded-full font-black text-center">確認</a>
                    <button onClick={() => setPriceAlerts(prev => prev.filter(a => a.id !== alert.id))} className="text-[9px] bg-[#F9F6F3] text-[#A5A19E] px-2 py-1 rounded-full font-black">削除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 保存した検索条件 */}
        <div className="mb-8">
          <h3 className="font-black text-[#5A4C4C] mb-4 px-1 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#7B8E76]" /> 保存した検索条件
          </h3>
          {savedSearches.length === 0 ? (
            <p className="text-xs text-[#A5A19E] font-bold text-center py-6 bg-[#F9F6F3] rounded-[2rem]">商品一覧の「保存」ボタンから追加できます</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {savedSearches.map(s => (
                <div key={s.id} className="flex items-center gap-1 bg-[#EBF0EA] rounded-full pl-3 pr-1 py-1">
                  <button onClick={() => { handleCategoryChange(s.category); if (s.subCategory && s.subCategory !== 'すべて') handleSubCategoryChange(s.subCategory); setActiveTab('home'); }}
                    className="text-[11px] font-black text-[#5A4C4C]">{s.label}</button>
                  <button onClick={() => setSavedSearches(prev => prev.filter(x => x.id !== s.id))} className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[#A5A19E]">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 法的リンク */}
        <div className="px-2 border-t border-[#F4EFEB] pt-8">
          <div className="flex flex-col gap-4">
            <button onClick={() => setActiveLegalPage('terms')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors"><FileText className="w-4 h-4 mr-2" /> 利用規約</button>
            <button onClick={() => setActiveLegalPage('privacy')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors"><Shield className="w-4 h-4 mr-2" /> プライバシーポリシー</button>
            <button onClick={() => setActiveLegalPage('disclaimer')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors text-left leading-relaxed"><Info className="w-4 h-4 mr-2 flex-shrink-0" /> 運営者情報・免責事項<br/>(アフィリエイトについて)</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-[#FFFDFB] font-sans text-[#5A4C4C] selection:bg-[#F2ABAC] selection:text-white ${activeTab === 'ai' ? 'h-[100svh] overflow-hidden flex flex-col' : 'min-h-screen pb-32'}`}>
      <Helmet>
        {/* タイトル */}
        {selectedProduct
          ? <title>{selectedProduct.name} の最安値・価格比較 | HonestBaby</title>
          : selectedCategory !== "すべて"
            ? <title>{selectedCategory}のベビー用品 価格比較・口コミ | HonestBaby</title>
            : <title>HonestBaby | 忖度なしのベビー用品比較・最安値検索</title>
        }

        {/* meta description */}
        {selectedProduct
          ? <meta name="description" content={`${selectedProduct.name}の最安値・価格比較。評価${selectedProduct.rating}★。楽天・Yahoo最安値をまとめてチェック。忖度なしのリアルレビューも掲載。`} />
          : selectedCategory !== "すべて"
            ? <meta name="description" content={`${selectedCategory}のベビー用品を価格比較。最安値・口コミ・評価をまとめてチェック。楽天・Yahoo対応。HonestBabyは忖度なしの比較サイトです。`} />
            : <meta name="description" content="ベビー用品・育児グッズの価格比較サイト。おむつ・ベビーカー・抱っこ紐など、楽天・Yahooの最安値を比較。忖度なしのリアルレビューも掲載。" />
        }

        {/* canonical */}
        {selectedProduct
          ? <link rel="canonical" href={`https://honestbaby-care.com/?product=${encodeURIComponent(selectedProduct.id)}`} />
          : selectedCategory !== "すべて"
            ? <link rel="canonical" href={`https://honestbaby-care.com/?cat=${encodeURIComponent(selectedCategory)}`} />
            : <link rel="canonical" href="https://honestbaby-care.com/" />
        }

        {/* OGP */}
        {selectedProduct
          ? <meta property="og:title" content={`${selectedProduct.name} の最安値・価格比較 | HonestBaby`} />
          : selectedCategory !== "すべて"
            ? <meta property="og:title" content={`${selectedCategory}のベビー用品 価格比較・口コミ | HonestBaby`} />
            : <meta property="og:title" content="HonestBaby | 忖度なしのベビー用品比較・最安値検索" />
        }
        {selectedProduct
          ? <meta property="og:description" content={`${selectedProduct.name}の最安値・価格比較。評価${selectedProduct.rating}★。楽天・Yahoo最安値をまとめてチェック。`} />
          : selectedCategory !== "すべて"
            ? <meta property="og:description" content={`${selectedCategory}のベビー用品を価格比較。最安値・口コミ・評価をまとめてチェック。`} />
            : <meta property="og:description" content="ベビー用品・育児グッズの価格比較サイト。おむつ・ベビーカー・抱っこ紐など、楽天・Yahooの最安値を比較。" />
        }
        <meta property="og:image" content={selectedProduct?.image || "https://honestbaby-care.com/logo.png"} />
        {selectedProduct
          ? <meta property="og:url" content={`https://honestbaby-care.com/?product=${encodeURIComponent(selectedProduct.id)}`} />
          : selectedCategory !== "すべて"
            ? <meta property="og:url" content={`https://honestbaby-care.com/?cat=${encodeURIComponent(selectedCategory)}`} />
            : <meta property="og:url" content="https://honestbaby-care.com/" />
        }
        <meta property="og:locale" content="ja_JP" />

        {/* Twitter Card */}
        {selectedProduct
          ? <meta name="twitter:title" content={`${selectedProduct.name} の最安値・価格比較 | HonestBaby`} />
          : <meta name="twitter:title" content="HonestBaby | 忖度なしのベビー用品比較" />
        }
        <meta name="twitter:image" content={selectedProduct?.image || "https://honestbaby-care.com/logo.png"} />

        {/* JSON-LD: WebSite + Organization */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://honestbaby-care.com/#website",
              "url": "https://honestbaby-care.com/",
              "name": "HonestBaby",
              "description": "ベビー用品・育児グッズの忖度なし価格比較サイト",
              "inLanguage": "ja"
            },
            {
              "@type": "Organization",
              "@id": "https://honestbaby-care.com/#organization",
              "name": "HonestBaby",
              "url": "https://honestbaby-care.com/",
              "logo": "https://honestbaby-care.com/logo.png"
            }
          ]
        })}</script>

        {/* JSON-LD: Product（商品詳細ページのみ） */}
        {selectedProduct && (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": selectedProduct.name,
            "image": selectedProduct.image,
            "brand": { "@type": "Brand", "name": selectedProduct.brand || "ベビー用品" },
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "JPY",
              "lowPrice": selectedProduct.price,
              "offerCount": (selectedProduct.shops || []).length || 1,
              "availability": "https://schema.org/InStock"
            },
            ...(selectedProduct.rating && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": selectedProduct.rating,
                "reviewCount": selectedProduct.reviewCount || selectedProduct.reviewsCount || 1,
                "bestRating": 5,
                "worstRating": 1
              }
            })
          })}</script>
        )}
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

      <main className={activeTab === 'ai' ? 'px-6 pt-4 flex flex-col flex-1 min-h-0 overflow-hidden' : 'px-6 pt-4'} style={activeTab === 'ai' ? {paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 4.5rem), 5rem)'} : {}}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'ranking' && renderRanking()}
        {activeTab === 'gift' && renderGift()}
        {activeTab === 'user' && renderUser()}
        
        {activeTab === 'search' && (
          <div className="animate-in slide-in-from-right duration-300">
            {/* 検索ボックス */}
            <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A5A19E]" />
              <input
                type="text"
                placeholder="ブランドや商品名で検索..."
                className="w-full bg-white border border-[#F4EFEB] rounded-full py-4 pl-14 pr-14 text-sm shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus:outline-none focus:border-[#7B8E76]"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if (!e.target.value) setSearchResults([]); }}
                onKeyPress={(e) => e.key === 'Enter' && fetchRemoteProductsWithAI(searchTerm)}
                autoFocus
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setSearchResults([]); }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A5A19E]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 検索ボタン（入力済みで未検索のとき表示） */}
            {searchTerm && !isSearchLoading && searchResults.length === 0 && (
              <div className="text-center mb-8">
                <button onClick={() => fetchRemoteProductsWithAI(searchTerm)}
                  className="bg-[#5A4C4C] text-white px-8 py-3.5 rounded-full text-sm font-black shadow-lg active:scale-95 transition-all flex items-center gap-2 mx-auto">
                  <Search className="w-4 h-4" /> 楽天・Yahooから検索する
                </button>
              </div>
            )}

            {/* ローディング */}
            {isSearchLoading && (
              <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-[#F2ABAC]/30 mb-8 animate-pulse">
                <div className="w-12 h-12 bg-[#FFF5F5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#F2ABAC]"><Sparkles className="w-6 h-6 animate-spin-slow" /></div>
                <p className="text-[10px] font-black text-[#F2ABAC] uppercase tracking-[0.2em] mb-2">AI Generating Best Selection...</p>
                <p className="text-sm font-bold text-[#5A4C4C]">「{searchTerm}」を検索中...</p>
              </div>
            )}

            {/* エラー */}
            {searchError && (
              <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] text-center mb-8">
                <p className="text-xs text-rose-400 font-bold mb-2">{searchError}</p>
                <button onClick={() => { setSearchError(null); fetchRemoteProductsWithAI(searchTerm); }} className="text-xs text-rose-400 underline font-bold">再試行する</button>
              </div>
            )}

            {/* 未入力時: 最近見た商品を表示 */}
            {!searchTerm && recentlyViewed.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-black text-[#A5A19E] mb-3 px-1 uppercase tracking-widest">最近見た商品</p>
                <div className="flex gap-2 flex-wrap">
                  {recentlyViewed.slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => { setSearchTerm(p.name.slice(0, 15)); }}
                      className="text-xs font-bold bg-[#F9F6F3] text-[#5A4C4C] px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                      {p.name.slice(0, 15)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 検索結果 */}
            {searchResults.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4 px-1">
                  <p className="text-xs font-black text-[#A5A19E] uppercase tracking-widest">「{searchTerm}」の検索結果</p>
                  <p className="text-xs text-[#A5A19E] font-bold">{searchResults.length}件</p>
                </div>
                <div className="space-y-3 mb-10">
                  {searchResults.map(p => (
                    <div key={p.id} className="bg-white rounded-[2rem] border border-[#F4EFEB] shadow-sm overflow-hidden flex gap-4 p-4 active:scale-[0.98] transition-transform cursor-pointer"
                      onClick={() => openProduct(p)}>
                      <div className="w-20 h-20 rounded-[1.25rem] overflow-hidden bg-[#F9F6F3] flex-shrink-0">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-[#A5A19E] m-auto mt-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#5A4C4C] leading-tight line-clamp-2 mb-1">{p.name}</p>
                        {p.shops?.[0]?.lowest_price && (
                          <p className="text-base font-black text-[#F2ABAC]">¥{Number(p.shops[0].lowest_price).toLocaleString()}<span className="text-xs font-bold text-[#A5A19E]"> ~</span></p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
          <div className="flex flex-col bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in slide-in-from-bottom duration-300 border border-[#F4EFEB] flex-1 min-h-0">
            <div className="p-6 border-b border-[#F4EFEB] flex items-center gap-4 bg-[#FFF5F5] flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-[#F2ABAC] flex items-center justify-center text-white shadow-md"><Bot className="w-6 h-6" /></div>
              <div>
                <h3 className="font-black text-[#5A4C4C] text-lg">Honest AI</h3>
                <p className="text-[10px] text-[#A5A19E] font-bold uppercase tracking-widest mt-0.5">Baby Concierge</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FFFDFB] min-h-0">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-4 text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-[#7B8E76] text-white rounded-[1.5rem] rounded-tr-sm shadow-md' : 'bg-white text-[#5A4C4C] rounded-[1.5rem] rounded-tl-sm border border-[#F4EFEB] shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-2 w-[85%]">
                      {msg.products.map(p => (
                        <button key={p.id} onClick={() => setSelectedProduct(p)} className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 text-left border border-[#F4EFEB] shadow-sm active:scale-[0.98] transition-transform">
                          <img src={p.image} onError={e => { e.target.src = "https://placehold.jp/24/7b8e76/ffffff/80x80.png?text=Baby"; }} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt={p.name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-[#5A4C4C] line-clamp-2 leading-snug">{p.name}</p>
                            <p className="text-xs text-[#7B8E76] font-bold mt-1">¥{(p.shops?.[0]?.lowest_price ?? p.price)?.toLocaleString()}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#A5A19E] flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isAiTyping && <div className="flex gap-1.5 p-2"><div className="w-2 h-2 bg-[#F2ABAC] rounded-full animate-bounce"></div><div className="w-2 h-2 bg-[#F2ABAC] rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-[#F2ABAC] rounded-full animate-bounce delay-150"></div></div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-[#F4EFEB] flex gap-2 flex-shrink-0" style={{paddingBottom: 'calc(1rem + var(--keyboard-height, 0px))'}}>
              <input type="text" placeholder="AIにメッセージ..." className="flex-1 bg-[#F9F6F3] border-none rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B8E76]/20" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
              <button onClick={handleSendMessage} className="bg-[#7B8E76] text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"><Send className="w-4 h-4 ml-0.5" /></button>
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
               <img src={selectedProduct.image || "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby"} onError={(e) => { e.target.src = "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Loading..."; }} className="w-full aspect-square object-cover rounded-[2rem] shadow-sm" alt={selectedProduct.name} />
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
              <button onClick={() => { setAlertTargetPrice(''); setShowPriceAlertModal(true); }} className="w-full mt-3 py-4 bg-[#FFF9E6] border border-[#F9DC5C]/40 text-[#B8860B] rounded-full text-xs font-black shadow-sm active:scale-95 transition-transform relative z-10 flex items-center justify-center gap-2">
                <BellRing className="w-4 h-4" /> 価格アラートを設定する
              </button>
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

              {isCrossLoading && (
                <div className="text-center text-xs text-[#A5A19E] py-3 animate-pulse">各ショップの最安値を検索中...</div>
              )}

              <div className="space-y-4">
                {(() => {
                  const existingShops = normalizeShops(selectedProduct.shops);
                  const existingNames = new Set(existingShops.map(s => s.name));
                  const mergedShops = [...existingShops, ...crossPlatformShops.filter(s => !existingNames.has(s.name))];
                  return mergedShops;
                })().map((shop, idx) => (
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
                          <p className="text-[10px] text-[#A5A19E] mt-2 font-bold">出品者: {(shop.sellers || []).length}店舗</p>
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
                               <a href={seller.url || '#'} target="_blank" rel="noopener noreferrer" className={`text-white px-5 py-2.5 rounded-full text-[10px] font-black shadow-sm whitespace-nowrap active:scale-95 transition-transform ${shop.type === 'official' ? 'bg-[#F2ABAC]' : 'bg-[#7B8E76]'}`}>
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
              {/* Amazonで検索リンク */}
              {(() => {
                const amzKeyword = selectedProduct.name.split(/[\s　]+/).slice(0, 4).join('+');
                const amzTag = import.meta.env.VITE_AMAZON_PARTNER_TAG || '';
                const amzUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(amzKeyword)}${amzTag ? `&tag=${amzTag}` : ''}`;
                return (
                  <a href={amzUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-between bg-[#232F3E] text-white rounded-[2rem] px-6 py-4 active:scale-95 transition-all shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black tracking-tight text-[#FF9900]">amazon</span>
                      <div>
                        <p className="text-xs font-black">Amazonで検索する</p>
                        <p className="text-[10px] text-white/50">価格・在庫をAmazonで確認</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/60" />
                  </a>
                );
              })()}
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
              <img src={selectedProduct.image || "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby"} onError={(e) => { e.target.src = "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Loading..."; }} className="w-12 h-12 object-cover rounded-xl" alt="product" />
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#F4EFEB] px-8 pt-4 flex justify-between items-center rounded-t-[3rem] shadow-[0_-10px_40px_rgb(0,0,0,0.03)]" style={{paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'}}>
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

      {/* ===== モーダル: 赤ちゃん情報 ===== */}
      {showBabyModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowBabyModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#5A4C4C] text-xl flex items-center gap-2"><Baby className="w-5 h-5 text-[#F2ABAC]" /> Myベビー情報</h3>
              <button onClick={() => setShowBabyModal(false)} className="p-2 rounded-full bg-[#F9F6F3] text-[#A5A19E]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-black text-[#5A4C4C] mb-2 block">赤ちゃんのお名前（任意）</label>
                <input value={babyForm.name} onChange={e => setBabyForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="例：はな" className="w-full border border-[#F4EFEB] rounded-[1rem] px-4 py-3 text-sm font-bold text-[#5A4C4C] focus:outline-none focus:border-[#F2ABAC]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-[#5A4C4C] mb-2 block">生まれた年</label>
                  <select value={babyForm.birthYear} onChange={e => setBabyForm(p => ({ ...p, birthYear: Number(e.target.value) }))}
                    className="w-full border border-[#F4EFEB] rounded-[1rem] px-4 py-3 text-sm font-bold text-[#5A4C4C] focus:outline-none focus:border-[#F2ABAC] bg-white">
                    {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-[#5A4C4C] mb-2 block">生まれた月</label>
                  <select value={babyForm.birthMonth} onChange={e => setBabyForm(p => ({ ...p, birthMonth: Number(e.target.value) }))}
                    className="w-full border border-[#F4EFEB] rounded-[1rem] px-4 py-3 text-sm font-bold text-[#5A4C4C] focus:outline-none focus:border-[#F2ABAC] bg-white">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-[#5A4C4C] mb-2 block">性別</label>
                <div className="flex gap-3">
                  {['男の子', '女の子', 'どちらでも'].map(g => (
                    <button key={g} onClick={() => setBabyForm(p => ({ ...p, gender: g }))}
                      className={`flex-1 py-3 rounded-[1rem] text-xs font-black transition-all ${babyForm.gender === g ? 'bg-[#F2ABAC] text-white' : 'bg-[#F9F6F3] text-[#A5A19E]'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setBabyInfo({ ...babyForm }); setShowBabyModal(false); }}
                className="w-full py-4 bg-[#5A4C4C] text-white rounded-full font-black text-sm active:scale-95 transition-transform mt-2">
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== モーダル: 価格アラート設定 ===== */}
      {showPriceAlertModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowPriceAlertModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#5A4C4C] text-xl flex items-center gap-2"><BellRing className="w-5 h-5 text-[#D4AF37]" /> 価格アラート</h3>
              <button onClick={() => setShowPriceAlertModal(false)} className="p-2 rounded-full bg-[#F9F6F3] text-[#A5A19E]"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-3 mb-6 p-4 bg-[#F9F6F3] rounded-[1.5rem]">
              {selectedProduct.image && <img src={selectedProduct.image} alt="" className="w-14 h-14 rounded-[1rem] object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#5A4C4C] leading-tight line-clamp-2">{selectedProduct.name}</p>
                <p className="text-xs text-[#A5A19E] font-bold mt-1">現在 ¥{selectedProduct.price?.toLocaleString()}</p>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs font-black text-[#5A4C4C] mb-2 block">この価格以下になったら教えてほしい</label>
              <div className="flex items-center border border-[#F4EFEB] rounded-[1rem] px-4 py-3 focus-within:border-[#D4AF37]">
                <span className="text-sm font-black text-[#5A4C4C] mr-2">¥</span>
                <input type="number" value={alertTargetPrice} onChange={e => setAlertTargetPrice(e.target.value)}
                  placeholder={String(Math.floor((selectedProduct.price || 0) * 0.9))}
                  className="flex-1 text-sm font-bold text-[#5A4C4C] focus:outline-none" />
              </div>
              <p className="text-[10px] text-[#A5A19E] font-bold mt-2">※ マイページで確認・削除できます</p>
            </div>
            <button onClick={() => {
              const target = Number(alertTargetPrice) || Math.floor((selectedProduct.price || 0) * 0.9);
              const shop = selectedProduct.shops?.[0];
              setPriceAlerts(prev => [...prev.filter(a => a.id !== selectedProduct.id), {
                id: selectedProduct.id, name: selectedProduct.name, image: selectedProduct.image,
                price: selectedProduct.price, url: shop?.url || selectedProduct.url || '#',
                targetPrice: target, addedAt: new Date().toISOString()
              }]);
              setShowPriceAlertModal(false);
            }} className="w-full py-4 bg-[#D4AF37] text-white rounded-full font-black text-sm active:scale-95 transition-transform">
              アラートを設定する
            </button>
          </div>
        </div>
      )}

      {/* ===== モーダル: 検索条件を保存 ===== */}
      {showSaveSearchModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowSaveSearchModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#5A4C4C] text-xl flex items-center gap-2"><Bookmark className="w-5 h-5 text-[#7B8E76]" /> 検索条件を保存</h3>
              <button onClick={() => setShowSaveSearchModal(false)} className="p-2 rounded-full bg-[#F9F6F3] text-[#A5A19E]"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4 p-4 bg-[#EBF0EA] rounded-[1.5rem] text-xs font-bold text-[#5A4C4C]">
              <p>{selectedCategory}{selectedSubCategory !== 'すべて' ? ` / ${selectedSubCategory}` : ''}{selectedSubSubCategory !== 'すべて' ? ` / ${selectedSubSubCategory}` : ''}</p>
            </div>
            <div className="mb-6">
              <label className="text-xs font-black text-[#5A4C4C] mb-2 block">ラベル名（任意）</label>
              <input value={saveSearchLabel} onChange={e => setSaveSearchLabel(e.target.value)}
                placeholder={selectedCategory}
                className="w-full border border-[#F4EFEB] rounded-[1rem] px-4 py-3 text-sm font-bold text-[#5A4C4C] focus:outline-none focus:border-[#7B8E76]" />
            </div>
            <button onClick={() => {
              const label = saveSearchLabel.trim() || selectedCategory;
              setSavedSearches(prev => [...prev, {
                id: Date.now(), label, category: selectedCategory,
                subCategory: selectedSubCategory, subSubCategory: selectedSubSubCategory,
                savedAt: new Date().toISOString()
              }]);
              setShowSaveSearchModal(false);
            }} className="w-full py-4 bg-[#7B8E76] text-white rounded-full font-black text-sm active:scale-95 transition-transform">
              保存する
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;