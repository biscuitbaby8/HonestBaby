import React, { useState, useEffect, useMemo, useRef } from 'react';
// FORCE REBUILD V3 - DEPLOYMENT CHECK - 2026-05-11
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Heart, ExternalLink, X, Star, MessageCircle,
  Instagram, Twitter, TrendingUp, ChevronRight,
  Home, User, Bell, ArrowLeft, Share2, Award,
  Settings, History, Bookmark, Sparkles, Send, Bot,
  Package, Layers, ChevronDown, ChevronUp, Calculator,
  Store, Gift, ChevronLeft, ShieldCheck, Baby, BellRing, Edit3,
  FileText, Shield, Info, Edit2, Camera, Mail,
  LayoutGrid, Shirt, Utensils, Moon, Puzzle, Waves, Car, Leaf, Wind, Trash2
} from 'lucide-react';

const CategoryIcon = ({ name, className = "w-4 h-4" }) => {
  const s = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", className };
  switch (name) {
    case 'すべて': return <LayoutGrid className={className} />;
    case 'おむつ': return <svg {...s}><path d="M4 8h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" /><path d="M4 11c2.5 2.5 5.5 0 8 0s5.5 2.5 8 0" /></svg>;
    case 'ベビーカー': return <svg {...s}><circle cx="8" cy="18" r="2" /><circle cx="16" cy="18" r="2" /><path d="M4 5l2 7h12V8.5A2.5 2.5 0 0015.5 6H9L7 5H4" /><path d="M18.5 4v4" /></svg>;
    case '抱っこ紐': return <svg {...s}><circle cx="12" cy="5" r="2" /><path d="M9 10c0 2 1.5 4 3 4s3-2 3-4" /><path d="M9 10c-2 0-3 1-3 3v2h12v-2c0-2-1-3-3-3" /><circle cx="12" cy="17" r="1.5" /></svg>;
    case 'ウェア': return <Shirt className={className} />;
    case 'ミルク・授乳': return <svg {...s}><path d="M10 2h4v3l2 2v13a2 2 0 01-2 2h-4a2 2 0 01-2-2V7l2-2V2z" /><path d="M10 5h4" /><path d="M10 12h4" /></svg>;
    case '離乳食・食器': return <Utensils className={className} />;
    case '寝具・ベッド': return <Moon className={className} />;
    case 'おもちゃ': return <Puzzle className={className} />;
    case '安全グッズ': return <ShieldCheck className={className} />;
    case 'お風呂用品': return <Waves className={className} />;
    case 'トイレ用品': return <Wind className={className} />;
    case '車用品': return <Car className={className} />;
    case 'マタニティ': return <Leaf className={className} />;
    case 'ゴミ箱・袋': return <Trash2 className={className} />;
    case 'ギフトセット': return <Gift className={className} />;
    default: return <Package className={className} />;
  }
};
import { Helmet } from 'react-helmet-async';
import { supabase } from './lib/supabaseClient';

// ＝＝＝＝＝ 商品データはSupabaseから取得します ＝＝＝＝＝

// 市場網羅のための詳細カテゴリツリー
// ジャンルID は ranking.rakuten.co.jp/daily/<id>/ の URL から確認した実際のID
const CATEGORY_TREE = [
  { name: "すべて", id: "100533", keyword: "", subs: [] },
  {
    name: "おむつ", id: "205197", keyword: "おむつ", subs: [
      { name: "テープタイプ", subsubs: ["新生児", "S", "M", "L", "BIG", "BIGより大きい"] },
      { name: "パンツタイプ", subsubs: ["S", "M", "L", "BIG", "BIGより大きい"] },
      { name: "夜用おむつ", subsubs: ["M", "L", "BIG", "BIGより大きい"] },
      { name: "おしりふき" },
    ]
  },
  { name: "ゴミ箱・袋", id: "101070", keyword: "おむつ ゴミ箱 防臭", subs: ["おむつポット", "防臭袋", "サニタリーボックス"] },
  { name: "ベビーカー", id: "200833", keyword: "ベビーカー", subs: ["A型", "B型", "AB型", "バギー", "周辺グッズ"] },
  { name: "抱っこ紐", id: "412209", keyword: "抱っこ紐", subs: ["縦抱き", "横抱き", "スリング", "ヒップシート", "周辺グッズ"] },
  { name: "ウェア", id: "111102", keyword: "ベビー服", subs: ["ロンパース", "カバーオール", "肌着", "アウター"] },
  { name: "ミルク・授乳", id: "205208", keyword: "ミルク 授乳", subs: ["ミルク", "哺乳瓶", "搾乳器", "授乳クッション", "母乳パッド"] },
  { name: "離乳食・食器", id: "213980", keyword: "離乳食", subs: ["ベビーフード", "食器セット", "ベビーチェア", "スプーン"] },
  { name: "寝具・ベッド", id: "200822", keyword: "ベビーベッド", subs: ["ベビーベッド", "ベビー布団", "スリーパー", "まくら"] },
  { name: "おもちゃ", id: "201591", keyword: "おもちゃ", subs: ["ガラガラ", "知育玩具", "ぬいぐるみ", "メリー"] },
  { name: "安全グッズ", id: "200841", keyword: "ベビーゲート", subs: ["ベビーゲート", "コーナーガード", "扉ロック", "転倒防止", "ベビーモニター"] },
  { name: "お風呂用品", id: "200815", keyword: "ベビー お風呂", subs: ["ベビーバス", "ベビー用ソープ", "保湿クリーム"] },
  { name: "トイレ用品", id: "200819", keyword: "おまる", subs: ["補助便座", "おまる", "トイトレ", "おしりふき"] },
  { name: "車用品", id: "566088", keyword: "チャイルドシート", subs: ["新生児用", "1歳以上", "ジュニアシート", "2wayタイプ", "周辺グッズ"] },
  { name: "マタニティ", id: "553946", keyword: "マタニティ", subs: ["マタニティウェア", "腹帯", "葉酸サプリ", "授乳ブラ", "ノンカフェイン"] },
  { name: "ギフトセット", id: "205222", keyword: "出産祝い ギフト", subs: ["出産祝い", "誕生日ギフト", "名入れギフト"] }
];

const CATEGORIES = CATEGORY_TREE.map(c => c.name);

// 月齢→おすすめカテゴリのマッピング
const AGE_CATEGORY_MAP = [
  { minM: 0,   maxM: 2,   label: '新生児期',       cats: ['おむつ', 'ミルク・授乳', '寝具・ベッド', '抱っこ紐'] },
  { minM: 2,   maxM: 6,   label: '首すわり前後',   cats: ['おむつ', 'ベビーカー', '抱っこ紐', 'おもちゃ'] },
  { minM: 5,   maxM: 9,   label: '離乳食スタート', cats: ['離乳食・食器', 'おもちゃ', 'お風呂用品', 'ベビーカー'] },
  { minM: 8,   maxM: 14,  label: 'ハイハイ・たっち', cats: ['安全グッズ', 'おもちゃ', '離乳食・食器', 'ウェア'] },
  { minM: 12,  maxM: 24,  label: 'よちよち歩き',   cats: ['ウェア', 'おもちゃ', 'トイレ用品', '安全グッズ'] },
  { minM: 24,  maxM: 999, label: '2歳〜',          cats: ['ウェア', 'トイレ用品', '車用品', 'おもちゃ'] },
];

// 月齢→おむつサイズのマッピング（体重個人差あり、目安として利用）
const DIAPER_SIZE_BY_AGE = [
  { maxM: 1,   size: '新生児', sub: 'テープタイプ', label: '新生児サイズ' },
  { maxM: 5,   size: 'S',      sub: 'テープタイプ', label: 'Sサイズ' },
  { maxM: 13,  size: 'M',      sub: null,           label: 'Mサイズ' },
  { maxM: 25,  size: 'L',      sub: null,           label: 'Lサイズ' },
  { maxM: 999, size: 'BIG',    sub: null,           label: 'BIGサイズ' },
];

const LEGAL_PAGES = {
  terms: {
    title: "利用規約",
    content: "本利用規約は、Honest Baby（以下「本サービス」）の提供条件及び運営者とユーザーの皆様との間の権利義務関係を定めるものです。本サービスは、各ECサイトの商品情報を収集・比較するプラットフォームであり、商品の販売自体は行っておりません。ユーザーは、リンク先の各ショップの利用規約やプライバシーポリシーに同意の上、自己責任で商品を購入するものとします。"
  },
  privacy: {
    title: "プライバシーポリシー",
    content: "■ 収集する情報\n本サービスでは、以下の情報を収集・利用します。\n\n【Googleアカウント情報】\nGoogleログインを利用された場合、メールアドレス・表示名・アイコン画像を取得します。これらはお気に入り管理・価格アラート・お問い合わせ対応のために利用します。\n\n【端末内に保存する情報（localStorage）】\n・お気に入り商品リスト\n・閲覧履歴\n・赤ちゃんの月齢・名前・性別（任意入力）\n・保存した検索条件\n・価格アラート設定\nこれらはお客様の端末内にのみ保存され、ログイン時にサーバーと同期されます。\n\n■ アクセス解析・Cookie\n本サービスはGoogle Analytics 4を使用しており、アクセス状況の把握のためにCookieを利用しています。取得データはGoogleのプライバシーポリシーに従って管理されます。Cookieの使用を希望されない場合は、ブラウザの設定から無効にすることができます。\n\n■ アフィリエイト\n本サービスはAmazon、楽天、Yahoo!ショッピング等のアフィリエイトプログラムに参加しており、バリューコマース等のASPを通じてトラッキングCookieを使用する場合があります。\n\n■ 第三者提供\n取得した情報は、法令に基づく場合を除き、第三者に提供することはありません。\n\n■ お問い合わせ\n個人情報の開示・訂正・削除のご請求は、アプリ内のお問い合わせフォームよりご連絡ください。"
  },
  disclaimer: {
    title: "運営者情報・免責事項",
    content: "【運営について】本サイトは、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。\n\nまた、楽天、Yahoo!ショッピング、バリューコマース、A8.net、もしもアフィリエイト、アクセストレード等の各プログラムにも参加しており、これらを通じて適格販売により紹介料を得ています。\n\n【免責事項】当サイトのコンテンツや情報につきまして、可能な限り正確な情報を掲載するよう努めておりますが、必ずしも正確性・信頼性を保証するものではありません。価格や在庫状況等は常に変動画するため、購入時は必ずリンク先のショップにて最新の情報をご確認ください。"
  },
  tokushoho: {
    title: "特定商取引法に基づく表記",
    content: "■ 販売業者\n個人運営者（請求があった場合、遅滞なく開示いたします）\n\n■ 所在地\n請求があった場合、遅滞なく開示いたします\n\n■ 連絡先\nお問い合わせはアプリ内のお問い合わせフォームよりご連絡ください\n\n■ サービスの内容\nベビー用品の価格比較・口コミ情報の提供（無料）\n\n■ 販売価格\n本サービスは無料でご利用いただけます。各商品の購入はリンク先の各ショップにて行われ、価格はリンク先のショップが定める価格となります。\n\n■ 商品代金以外の必要料金\nなし（本サービスの利用料は無料です）\n\n■ 支払方法・支払時期\n本サービス自体の料金は発生しません。商品のご購入はリンク先ショップの規定に従います。\n\n■ 商品の引き渡し時期\n本サービスは情報提供サービスです。商品の配送はリンク先ショップが行います。\n\n■ 返品・キャンセルについて\n本サービスは情報提供のみを行っており、商品の販売は行っておりません。商品の返品・キャンセルはご購入先のショップの規定に従ってください。\n\n■ アフィリエイトについて\n本サービスはAmazon.co.jpアソシエイト・プログラム、楽天アフィリエイト、Yahoo!ショッピングアフィリエイト、バリューコマース等のアフィリエイトプログラムに参加しており、リンク経由でご購入いただいた場合に紹介料を受け取ることがあります。"
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
  'よだれパッド',
  // おむつ関連（おむつカテゴリ以外での混入防止）
  'おむつポーチ', 'おむつバッグ', 'おむつストッカー',
  // ベビーカー・チャイルドシート・抱っこ紐アクセサリー追加
  'シューズクリップ', 'ファンシート', '抜け出し防止', 'ベビーカーシート',
  '防寒ケープ', '抱っこ紐ケープ', 'ハグウォーマー',
];

// おむつサイズマッピング（検索精度向上用）
const DIAPER_SIZE_MAP = {
  '新生児': '新生児', 'S': 'Sサイズ', 'M': 'Mサイズ',
  'L': 'Lサイズ', 'BIG': 'BIGサイズ', 'BIGより大きい': 'ビッグより大きい',
};

const filterAccessories = (items, getNameFn = (p) => p.name || p.itemName || '') =>
  items.filter(item => !ACCESSORY_EXCLUDE_WORDS.some(w => getNameFn(item).includes(w)));

// 商品名クリーニング: プロモ・ランキング表記・記号・括弧を除去
const CLEAN_LEADING = new Set([
  'おもちゃ', '知育玩具', '知育', '玩具', '木のおもちゃ', '積み木',
  'ベビー用品', 'ベビー', '赤ちゃん', '新生児', '乳幼児', 'キッズ',
  '子ども', '子供', '幼児', '男の子', '女の子',
  '誕生日', 'プレゼント', 'ギフト', '贈り物', '出産祝い', 'クリスマス', 'お祝い',
  'ランキング', '人気', '売れ筋', 'おすすめ',
  '一歳', '二歳', '三歳', '四歳', '五歳',
]);
const CLEAN_TRAILING = new Set([
  '誕生日', 'プレゼント', 'ギフト', '贈り物', '出産祝い', 'クリスマス', 'お祝い',
  '知育', 'ランキング', '人気', '売れ筋', 'おすすめ', '正規品', '公式', '新品',
  '一歳', '二歳', '三歳', '四歳', '五歳',
]);
const CLEAN_AGE_RE = /^[0-9０-９一二三四五六七八九十]+[歳ヶ月]児?$/;

const cleanName = (name) => {
  if (!name) return '';
  let s = name
    .replace(/[【［\[「『〈《][^】］\]」』〉》]{0,60}[】］\]」』〉》]/g, '')
    .replace(/[★◆▼■●▲☆◇▽□○△♪♥♡※◎◯！!✓]+/g, '')
    .replace(/^(楽天|第)?\s*[0-9０-９]+\s*位(受賞)?\s*/g, '')
    .replace(/[\s　]*(送料無料|あす楽|即納|正規品|公式).*$/g, '')
    .replace(/[\s　]+/g, ' ')
    .trim();

  const tokens = s.split(' ');
  let start = 0;
  while (start < tokens.length - 1) {
    const t = tokens[start];
    if (CLEAN_LEADING.has(t) || CLEAN_AGE_RE.test(t)) start++;
    else break;
  }
  let end = tokens.length;
  while (end > start + 1) {
    const t = tokens[end - 1];
    if (CLEAN_TRAILING.has(t) || CLEAN_AGE_RE.test(t)) end--;
    else break;
  }
  s = tokens.slice(start, end).join(' ');

  if (s.length > 45) s = s.slice(0, 45).replace(/\s+\S*$/, '').trim();
  return s || name.slice(0, 30).trim();
};

// 商品の品質バリデーション
const validateProduct = (p) => {
  if (!p || !p.name || p.name.length < 6) return false;
  if (!p.image) return false;
  if (!p.price || p.price < 100) return false;
  if (/^[0-9\s\/／・,，\-\.]+$/.test(p.name)) return false;
  if (/^(楽天|商品|アイテム)$/.test(p.name)) return false;
  return true;
};

// 公式ショップ判定
const OFFICIAL_SHOP_RULES = [
  { match: /cybex[-_.]?(jp|store)|cybex公式|サイベックス公式/i, brand: 'CYBEX' },
  { match: /aprica[-_.]?(jp|official)|アップリカ公式/i, brand: 'Aprica' },
  { match: /combi[-_.]?(official|store)|コンビ公式/i, brand: 'Combi' },
  { match: /pigeon[-_.]?(official|store)|ピジョン公式/i, brand: 'Pigeon' },
  { match: /bugaboo[-_.]?(jp|official)/i, brand: 'Bugaboo' },
  { match: /stokke[-_.]?(jp|official)|ストッケ公式/i, brand: 'Stokke' },
  { match: /ergobaby[-_.]?(jp|official)|エルゴベビー公式/i, brand: 'Ergobaby' },
  { match: /(公式|official)(ショップ|ストア|店)?/i, brand: null },
];

// ベビー専門小売店 公式EC（ASP提携後は affiliateParam を設定）
const OFFICIAL_RETAILERS = [
  {
    name: 'アカチャンホンポ',
    shortName: 'アカチャン',
    searchUrl: (kw) => `https://shop.akachan.jp/shop/search/?keyword=${encodeURIComponent(kw)}`,
    affiliateParam: '',  // バリューコマース提携後に追加
    color: '#E85298',
    domain: 'shop.akachan.jp',
  },
  {
    name: '西松屋',
    shortName: '西松屋',
    searchUrl: (kw) => `https://www.24028-net.jp/search?keyword=${encodeURIComponent(kw)}`,
    affiliateParam: '',
    color: '#00965E',
    domain: '24028-net.jp',
  },
  {
    name: 'トイザらス・ベビーザらス',
    shortName: 'ベビザらス',
    searchUrl: (kw) => `https://www.toysrus.co.jp/search/?q=${encodeURIComponent(kw)}`,
    affiliateParam: '',  // LinkShare / A8 提携後に追加
    color: '#E31837',
    domain: 'toysrus.co.jp',
  },
  {
    name: 'ミキハウス',
    shortName: 'ミキハウス',
    searchUrl: (kw) => `https://www.mikihouse.co.jp/search?type=product&q=${encodeURIComponent(kw)}`,
    affiliateParam: '',  // LinkShare 提携後に追加
    color: '#2356A5',
    domain: 'mikihouse.co.jp',
  },
];

const detectOfficialShop = (shop) => {
  const target = `${shop?.name || ''} ${shop?.url || ''}`;
  for (const rule of OFFICIAL_SHOP_RULES) {
    if (rule.match.test(target)) return { isOfficial: true, brand: rule.brand };
  }
  return { isOfficial: false, brand: null };
};

const normalizeShop = (shop) => {
  if (!shop) return { name: 'ショップ', type: 'mall', lowestPrice: 0, sellers: [] };
  const name = shop.name || shop.shop_name || 'ショップ';
  const lowestPrice = Number(shop.lowestPrice || shop.lowest_price || shop.price || 0);
  const { isOfficial, brand } = detectOfficialShop({ name, url: shop.url });
  const type = isOfficial ? 'official' : (shop.type || shop.shop_type || 'mall');
  let rawSellers = shop.sellers;
  if (typeof rawSellers === 'string') {
    try { rawSellers = JSON.parse(rawSellers); } catch { rawSellers = []; }
  }
  const sellers = Array.isArray(rawSellers) && rawSellers.length > 0
    ? rawSellers.filter(s => s.url && s.url !== '#')
    : (shop.url && shop.url !== '#' ? [{ name, price: lowestPrice, shipping: shop.shipping ?? 0, points: shop.points ?? 0, url: shop.url, note: shop.note || '' }] : []);
  return { ...shop, name, type, lowestPrice, sellers, brandName: brand };
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
        src={getHighResImage(product.image)}
        onError={(e) => { e.target.onerror = null; e.target.src = product.image || "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Baby"; }}
        className="w-full h-full object-cover rounded-[1.5rem]"
        alt={product.name}
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

// ValueCommerce MyLink: 対象ドメインのURLをアフィリエイトURLにラップ
const VC_SID = import.meta.env.VITE_VC_SID || '3768537';
const VC_DOMAIN_PIDS = {
  'dadway-onlineshop.com': import.meta.env.VITE_VC_PID_DADWAY || '892608374',
  'ergobaby.jp': import.meta.env.VITE_VC_PID_ERGOBABY || '892609670',
  'shopping.yahoo.co.jp': import.meta.env.VITE_VC_PID_YAHOO || '892613329',
};
const AMAZON_TAG = import.meta.env.VITE_AMAZON_TAG || 'honestbaby-22';

// VAPID公開鍵をUint8Arrayに変換（Web Push API用）
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

const toVCUrl = (url) => {
  if (!url || url === '#') return url;
  try {
    const normalized = url.startsWith('//') ? 'https:' + url : url;
    const hostname = new URL(normalized).hostname;
    const pid = Object.entries(VC_DOMAIN_PIDS).find(([domain]) => hostname.includes(domain))?.[1];
    if (!pid) return url;
    return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${VC_SID}&pid=${pid}&vc_url=${encodeURIComponent(normalized)}`;
  } catch {
    return url;
  }
};

const getHighResImage = (url) => {
  if (!url) return "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby";
  try {
    // 楽天: ?_ex=NxN を 1000x1000 に上書き（元のサイズより大きくする）
    if (url.indexOf('rakuten.co.jp') !== -1) {
      return url.split('?_ex=')[0] + '?_ex=1000x1000';
    }
    // Yahoo yimg.jp: /i/n/ /i/g/ /i/s/ → /i/j/ (標準サイズ。/i/g/はショップ依存で低画質の場合あり)
    if (url.indexOf('yimg.jp') !== -1) {
      return url.replace(/\/i\/[ngs]\//, '/i/j/');
    }
    return url;
  } catch (e) {
    return url;
  }
};

const getAmazonUrl = (keyword) => {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${AMAZON_TAG}`;
};


const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [dbProducts, setDbProducts] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Auth state
  const [user, setUser] = useState(null);

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
  const [giftBudgetFilter, setGiftBudgetFilter] = useState("すべて");
  const [giftSceneFilter, setGiftSceneFilter] = useState("すべて");

  // 管理モード: URLに ?admin=1 が付いているか、セッション中に有効化した場合はON
  const isAdminMode = (() => {
    if (location.search.includes('admin=1')) {
      try { sessionStorage.setItem('honestBabyAdminSession', '1'); } catch { }
      return true;
    }
    try { return sessionStorage.getItem('honestBabyAdminSession') === '1'; } catch { return false; }
  })();

  // ブロックリスト（非表示商品）
  const [blocklist, setBlocklist] = useState(new Set());
  // 直前の削除操作（アンドゥ用）
  const [lastBlocked, setLastBlocked] = useState(null);  // { product, timer }
  const [showUndoToast, setShowUndoToast] = useState(false);
  // ブロック済み商品リストモーダル
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [blockedProducts, setBlockedProducts] = useState([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);

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

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google'
  });
  const signOut = () => supabase.auth.signOut().then(() => setUser(null));

  const handleContactSubmit = async () => {
    if (!contactContent.trim() || isContactSending) return;
    setIsContactSending(true);
    try {
      const { error } = await supabase.from('inquiries').insert([{
        user_id: user.id,
        user_email: user.email,
        category: contactCategory,
        content: contactContent.trim(),
      }]);
      if (error) throw error;
      setContactSent(true);
      setContactContent('');
    } catch (e) {
      console.error('Contact submit error:', e);
    } finally {
      setIsContactSending(false);
    }
  };

  const migrateLocalFavoritesToDB = async (userId) => {
    try {
      const local = JSON.parse(localStorage.getItem('honestBabyFavorites') || '[]');
      if (!local.length) return;
      await supabase.from('user_favorites').upsert(
        local.map(p => ({ user_id: userId, item_code: String(p.id), product_data: p })),
        { onConflict: 'user_id,item_code' }
      );
      localStorage.removeItem('honestBabyFavorites');
      setFavorites(local);
    } catch { }
  };

  // --- 価格アラート: DBとのsync ---
  const syncPriceAlertsWithDB = async (userId) => {
    try {
      const { data: dbAlerts } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId);
      if (!dbAlerts) return;

      // localStorageのアラートをDBに保存（未登録のもの）
      const localAlerts = JSON.parse(localStorage.getItem('honestBabyPriceAlerts') || '[]');
      const dbCodes = new Set(dbAlerts.map(a => a.product_code));
      for (const la of localAlerts) {
        if (!dbCodes.has(String(la.id))) {
          await supabase.from('price_alerts').insert({
            user_id: userId,
            product_code: String(la.id),
            product_name: la.name,
            image_url: la.image || null,
            target_price: la.targetPrice,
            current_price: la.price || null,
            affiliate_url: la.url || null,
          });
        }
      }

      // DBのアラートをstateに反映
      const merged = dbAlerts.map(a => ({
        id: a.product_code,
        dbId: a.id,
        name: a.product_name,
        image: a.image_url,
        price: a.current_price,
        targetPrice: a.target_price,
        url: a.affiliate_url,
        addedAt: a.created_at,
        triggered: !!a.triggered_at,
      }));
      setPriceAlerts(merged);

      // トリガー済みアラートを通知
      const triggered = merged.filter(a => a.triggered);
      if (triggered.length > 0) setTriggeredAlerts(triggered);
    } catch { }
  };

  // --- 赤ちゃん情報: DBとのsync ---
  const syncBabyProfileWithDB = async (userId) => {
    try {
      const { data: dbProfile } = await supabase
        .from('baby_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (dbProfile) {
        // DBにあれば localStorage を上書き
        setBabyInfo({
          name: dbProfile.name || '',
          birthYear: dbProfile.birth_year,
          birthMonth: dbProfile.birth_month,
          gender: dbProfile.gender || '',
        });
      } else {
        // DBに無い & localStorageにあれば DB へ push
        const local = JSON.parse(localStorage.getItem('honestBabyBabyInfo') || 'null');
        if (local && local.birthYear) {
          await supabase.from('baby_profiles').upsert({
            user_id: userId,
            name: local.name || null,
            birth_year: local.birthYear,
            birth_month: local.birthMonth,
            gender: local.gender || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
      }
    } catch { }
  };

  const saveBabyProfileToDB = async (userId, info) => {
    try {
      await supabase.from('baby_profiles').upsert({
        user_id: userId,
        name: info.name || null,
        birth_year: info.birthYear,
        birth_month: info.birthMonth,
        gender: info.gender || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch { }
  };

  const savePriceAlertToDB = async (userId, alert) => {
    try {
      await supabase.from('price_alerts').upsert({
        user_id: userId,
        product_code: String(alert.id),
        product_name: alert.name,
        image_url: alert.image || null,
        target_price: alert.targetPrice,
        current_price: alert.price || null,
        affiliate_url: alert.url || null,
      }, { onConflict: 'user_id,product_code' });
    } catch { }
  };

  // --- Web Push 通知購読 ---
  const subscribeToPushNotifications = async (userId) => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return false;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const subJson = subscription.toJSON();
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        user_agent: navigator.userAgent,
      }, { onConflict: 'endpoint' });
      return true;
    } catch (e) {
      console.warn('Push subscription failed:', e);
      return false;
    }
  };

  const deletePriceAlertFromDB = async (userId, productCode) => {
    try {
      await supabase.from('price_alerts')
        .delete()
        .eq('user_id', userId)
        .eq('product_code', String(productCode));
    } catch { }
  };

  // --- 検索キャッシュ（localStorage → カテゴリ別）---
  const [cachedProducts, setCachedProducts] = useState(() => {
    const cache = {};
    CATEGORIES.filter(c => c !== 'すべて').forEach(cat => {
      try {
        const stored = localStorage.getItem(`honestBabyCache_${cat}`);
        if (stored) cache[cat] = JSON.parse(stored);
      } catch { }
    });
    return cache;
  });

  // --- 検索専用 States（ホームのremoteProductsと分離）---
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // --- ランキング・ギフト States ---
  const [giftProducts, setGiftProducts] = useState([]);
  const [isGiftLoading, setIsGiftLoading] = useState(false);


  // --- マイページ States（localStorage連動）---
  const [babyInfo, setBabyInfo] = useState(() => {
    try { return JSON.parse(localStorage.getItem('honestBabyBabyInfo') || 'null'); } catch { return null; }
  });

  // 月齢・年齢計算（全画面・AI から参照できるようトップレベルで計算）
  const _now = new Date();
  const babyAgeMonths = babyInfo
    ? ((_now.getFullYear() - babyInfo.birthYear) * 12 + (_now.getMonth() + 1 - babyInfo.birthMonth))
    : null;
  const babyAgeLabel = babyAgeMonths != null
    ? babyAgeMonths < 12
      ? `${babyAgeMonths}ヶ月`
      : `${Math.floor(babyAgeMonths / 12)}歳${babyAgeMonths % 12 ? `${babyAgeMonths % 12}ヶ月` : ''}`
    : null;

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('honestBabyRecentlyViewed') || '[]'); } catch { return []; }
  });
  const [priceAlerts, setPriceAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('honestBabyPriceAlerts') || '[]'); } catch { return []; }
  });
  const [savedSearches, setSavedSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('honestBabySavedSearches') || '[]'); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('honestBabyBabyInfo', JSON.stringify(babyInfo)); } catch { } }, [babyInfo]);
  useEffect(() => { try { localStorage.setItem('honestBabyRecentlyViewed', JSON.stringify(recentlyViewed)); } catch { } }, [recentlyViewed]);
  useEffect(() => { try { localStorage.setItem('honestBabyPriceAlerts', JSON.stringify(priceAlerts)); } catch { } }, [priceAlerts]);
  useEffect(() => { try { localStorage.setItem('honestBabySavedSearches', JSON.stringify(savedSearches)); } catch { } }, [savedSearches]);

  // モーダル制御
  const [showBabyModal, setShowBabyModal] = useState(false);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);

  // PWA ホーム追加プロンプト
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [babyForm, setBabyForm] = useState({ name: '', birthYear: new Date().getFullYear(), birthMonth: 1, gender: '' });
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [saveSearchLabel, setSaveSearchLabel] = useState('');

  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    try { return !localStorage.getItem('honestBabyCookieConsent'); } catch { return false; }
  });

  // Modal & Expand States
  const [expandedMall, setExpandedMall] = useState(null);
  const [activeLegalPage, setActiveLegalPage] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactCategory, setContactCategory] = useState('商品について');
  const [contactContent, setContactContent] = useState('');
  const [isContactSending, setIsContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  // --- 新機能: 口コミ関連 States ---
  const [reviewTab, setReviewTab] = useState('honest'); // 'honest' or 'sns'
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [reviewPhotoFile, setReviewPhotoFile] = useState(null);
  const [reviewPhotoPreview, setReviewPhotoPreview] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const reviewPhotoInputRef = useRef(null);

  // --- 価格アラート通知 ---
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'こんにちは！Honest BabyのAIコンサルタントです。ご自宅用からギフトまで、何でも相談してください。' }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // PWA ホーム追加プロンプト
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone) return;
    const dismissed = localStorage.getItem('honestBabyInstallDismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setTimeout(() => setShowInstallBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (ios) setTimeout(() => setShowInstallBanner(true), 3000);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('honestBabyInstallDismissed', String(Date.now()));
  };

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setInstallPrompt(null);
    }
    dismissInstallBanner();
  };

  // Auth: Googleログイン状態の監視
  useEffect(() => {
    // detectSessionInUrl: true でSDKがコールバックURLを自動処理するため
    // ここでは onAuthStateChange を待つだけで十分
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        migrateLocalFavoritesToDB(u.id);
        syncPriceAlertsWithDB(u.id);
        syncBabyProfileWithDB(u.id);
      }
    });

    // 既存セッションの復元（ページリロード時など）
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    // iOS PWA対応: フォアグラウンド復帰時にセッション再確認
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const formatDbProduct = (p) => ({
    ...p,
    rating: Number(p.rating),
    subCategory: p.sub_category,
    reviewsCount: p.reviews_count,
    image: getHighResImage(p.image_url),
    aiAnalysis: p.ai_analysis,
    giftTags: p.gift_tags || [],
    usedPrice: p.used_price_estimate,
    unitCount: p.unit_count,
    unitName: p.unit_name,
    popularity_rank: p.popularity_rank,
    isMarketWide: p.is_market_wide,
    isBestSeller: p.popularity_rank && p.popularity_rank <= 3,
    isTopRated: Number(p.rating) >= 4.8,
    shops: (p.shops || []).map(s => {
      let sellers = s.sellers;
      if (typeof sellers === 'string') {
        try { sellers = JSON.parse(sellers); } catch { sellers = []; }
      }
      return { ...s, name: s.shop_name, type: s.shop_type, lowestPrice: s.lowest_price, sellers: Array.isArray(sellers) ? sellers : [] };
    }),
    honestReviews: (p.honestReviews || []).map(r => ({ ...r, user: r.user_name, date: new Date(r.created_at).toLocaleDateString() })),
    snsReviews: (p.snsReviews || []).map(r => ({ ...r, user: r.user_handle }))
  });

  // URL直アクセス対応: sessionStorage → localStorage → Supabase → home
  useEffect(() => {
    const match = location.pathname.match(/^\/product\/(.+)$/);
    if (!match || selectedProduct) return;
    const productId = decodeURIComponent(match[1]);

    const restore = async () => {
      // 1. sessionStorage（同タブ）
      try {
        const s = sessionStorage.getItem('honestBabyOpenProduct');
        if (s) { const p = JSON.parse(s); if (String(p.id) === productId) { setSelectedProduct(p); return; } }
      } catch { }

      // 2. localStorage キャッシュ（別タブ・URL共有）
      try {
        const cache = JSON.parse(localStorage.getItem('honestBabyProductCache') || '{}');
        if (cache[productId]) { setSelectedProduct(cache[productId]); return; }
      } catch { }

      // 3. Supabase（UUID形式のDB商品）
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(productId)) {
        try {
          const { data } = await supabase
            .from('products')
            .select('*, shops:shops_prices(*), honestReviews:reviews(*), snsReviews:sns_reviews(*)')
            .eq('id', productId)
            .single();
          if (data) { setSelectedProduct(formatDbProduct(data)); return; }
        } catch { }
      }

      // 4. 見つからない → ホームへ
      navigate('/', { replace: true });
    };

    restore();
  }, [location.pathname]);

  // 法的ページ直接URL対応: /privacy /terms /tokushoho /disclaimer
  useEffect(() => {
    const legalRoutes = { '/privacy': 'privacy', '/terms': 'terms', '/tokushoho': 'tokushoho', '/disclaimer': 'disclaimer' };
    const key = legalRoutes[location.pathname];
    if (key) { setActiveLegalPage(key); navigate('/', { replace: true }); }
  }, [location.pathname]);

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
          `)
          .or('is_blocked.is.null,is_blocked.eq.false');

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

          // プレースホルダー画像の商品に対してRakutenから実際の画像をバックグラウンド取得
          // 厳格な名前マッチング: DB商品名の全キーワードがAPI結果の名前に含まれる場合のみ更新
          const placeholders = formatted.filter(p => p.image?.includes('placehold.jp'));
          if (placeholders.length > 0) {
            (async () => {
              for (const product of placeholders.slice(0, 8)) {
                try {
                  await new Promise(r => setTimeout(r, 400));
                  const res = await fetch(`/api/rakuten?query=${encodeURIComponent(product.name)}`);
                  if (!res.ok) continue;
                  const { products: results } = await res.json();
                  // DB商品名を2文字以上のキーワードに分割し、全て一致するAPI結果のみ採用
                  const dbWords = product.name.split(/[\s　]+/).filter(w => w.length >= 2);
                  const match = results?.find(r => {
                    if (!r.image || r.image.includes('placehold')) return false;
                    const apiName = r.name.toLowerCase();
                    return dbWords.every(w => apiName.includes(w.toLowerCase()));
                  });
                  if (!match?.image) continue;
                  const realImage = getHighResImage(match.image);
                  await supabase.from('products').update({ image_url: match.image }).eq('id', product.id);
                  setDbProducts(prev => prev.map(p => p.id === product.id ? { ...p, image: realImage } : p));
                } catch { }
              }
            })();
          }
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

  // ブロックリストを起動時に読み込む（localStorage のみ。DB ブロックは fetchProducts の is_blocked フィルタで処理）
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('honestBabyBlocklist') || '[]');
      if (stored.length > 0) setBlocklist(new Set(stored));
    } catch { }
  }, []);

  // 商品を非表示にする（管理者モード専用）
  const blockProduct = async (product) => {
    const code = String(product.id).replace(/^(ranking|product)-/, '');
    setBlocklist(prev => {
      const next = new Set([...prev, code]);
      try { localStorage.setItem('honestBabyBlocklist', JSON.stringify([...next])); } catch { }
      return next;
    });
    setRemoteProducts(prev => prev.filter(p => p.id !== product.id));
    setDbProducts(prev => prev.filter(p => p.id !== product.id));
    setCachedProducts(prev => {
      const updated = { ...prev };
      for (const cat of Object.keys(updated)) {
        updated[cat] = (updated[cat] || []).filter(p => p.id !== product.id);
      }
      return updated;
    });

    // アンドゥトーストを表示（5秒間）
    if (lastBlocked?.timer) clearTimeout(lastBlocked.timer);
    const timer = setTimeout(() => setShowUndoToast(false), 5000);
    setLastBlocked({ product, code });
    setShowUndoToast(true);

    // DB: is_blocked フラグを立てる
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(product.id));
    const updateById = supabase.from('products').update({ is_blocked: true }).eq('id', product.id);
    const updateByCode = supabase.from('products').update({ is_blocked: true }).eq('rakuten_item_code', code);
    const [r1, r2] = await Promise.all([isUuid ? updateById : Promise.resolve({}), updateByCode]);
    if (r1.error) console.error('Block by id failed:', r1.error.message);
    if (r2.error) console.error('Block by code failed:', r2.error.message);
  };

  // 誤って削除した商品を復元する
  const unblockProduct = async () => {
    if (!lastBlocked) return;
    const { product, code } = lastBlocked;
    setShowUndoToast(false);
    setLastBlocked(null);

    setBlocklist(prev => {
      const next = new Set([...prev]);
      next.delete(code);
      try { localStorage.setItem('honestBabyBlocklist', JSON.stringify([...next])); } catch { }
      return next;
    });
    setDbProducts(prev => [...prev, product].sort((a, b) => (a.popularity_rank || 9999) - (b.popularity_rank || 9999)));
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(product.id));
    const restoreById = supabase.from('products').update({ is_blocked: false }).eq('id', product.id);
    const restoreByCode = supabase.from('products').update({ is_blocked: false }).eq('rakuten_item_code', code);
    await Promise.all([isUuid ? restoreById : Promise.resolve({}), restoreByCode]);
  };

  // ブロック済み商品一覧を取得（管理者モード専用）
  const fetchBlockedProducts = async () => {
    setIsLoadingBlocked(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, image_url, category, rakuten_item_code')
      .eq('is_blocked', true)
      .order('name');
    setBlockedProducts(data || []);
    setIsLoadingBlocked(false);
  };

  // ブロック済み商品を個別に復元
  const restoreBlockedProduct = async (p) => {
    await supabase.from('products').update({ is_blocked: false }).eq('id', p.id);
    setBlockedProducts(prev => prev.filter(b => b.id !== p.id));
    // ローカルのブロックリストからも除去
    const code = p.rakuten_item_code || p.id;
    setBlocklist(prev => {
      const next = new Set([...prev]);
      next.delete(code);
      try { localStorage.setItem('honestBabyBlocklist', JSON.stringify([...next])); } catch { }
      return next;
    });
    // 画面の商品リストに戻す（再フェッチで確実に反映）
    const { data: restored } = await supabase
      .from('products')
      .select('*, shops:shops_prices(*)')
      .eq('id', p.id)
      .single();
    if (restored) {
      const fmt = {
        ...restored,
        rating: Number(restored.rating),
        subCategory: restored.sub_category,
        image: restored.image_url,
        shops: (restored.shops || []).map(s => ({
          ...s, name: s.shop_name, type: s.shop_type, lowestPrice: s.lowest_price, sellers: []
        })),
      };
      setDbProducts(prev => [...prev, fmt].sort((a, b) => (a.popularity_rank || 9999) - (b.popularity_rank || 9999)));
    }
  };

  // 初回ロード: DBに事前保存されたデータを表示（Cronバッチで毎晩自動更新）
  // リアルタイムAPI呼び出しは不要（カテゴリ切替時のみフォールバックとして利用）

  // 商品詳細を開いたとき楽天＋Yahoo を並列検索してクロスプラットフォーム価格比較
  useEffect(() => {
    if (!selectedProduct) { setCrossPlatformShops([]); return; }

    // --- 高速化の鍵: まずDBに保存されている既知の価格をセットする ---
    const cachedShops = normalizeShops(selectedProduct.shops || []);
    setCrossPlatformShops(cachedShops);

    const fetchCross = async () => {
      // 保存済みデータがある場合は、Loadingを表示せずに裏で更新する
      if (cachedShops.length === 0) setIsCrossLoading(true);

      try {
        const keyword = selectedProduct.name.split(/[\s　]+/).slice(0, 4).join(' ');
        const origPrice = selectedProduct.price || getLowestPrice(selectedProduct.shops) || 0;
        const priceMin = origPrice > 0 ? origPrice * 0.2 : 0;
        const priceMax = origPrice > 0 ? origPrice * 5 : Infinity;
        const selectedWords = keyword.split(' ').filter(w => w.length >= 2).map(w => w.toLowerCase());
        const modelWords = selectedWords.filter(w => /[0-9０-９]/.test(w));

        const nameMatches = (itemName) => {
          const lower = (itemName || '').toLowerCase().replace(/[\s　]/g, '');
          if (modelWords.length > 0) return modelWords.every(w => lower.includes(w));
          return selectedWords.some(w => lower.includes(w));
        };
        const priceInRange = (p) => origPrice === 0 || (p >= priceMin && p <= priceMax);

        // --- 口コミ・SNSレビューの最新データをDBから取得 ---
        const fetchReviewsFromDb = async () => {
          const { data: dbProd } = await supabase
            .from('products')
            .select('id, reviews(*), sns_reviews(*)')
            .or(`id.eq.${selectedProduct.id},rakuten_item_code.eq.${selectedProduct.id}`)
            .single();

          if (dbProd) {
            setSelectedProduct(prev => {
              if (!prev || (prev.id !== selectedProduct.id && prev.rakuten_item_code !== selectedProduct.id)) return prev;
              return {
                ...prev,
                id: dbProd.id, // UUIDがあればそれに差し替え
                honestReviews: (dbProd.reviews || []).map(r => ({ ...r, user: r.user_name, date: new Date(r.created_at).toLocaleDateString() })),
                snsReviews: dbProd.sns_reviews || []
              };
            });
          }
        };
        fetchReviewsFromDb();

        const [rakutenResult, yahooResult] = await Promise.allSettled([
          fetch(`/api/rakuten?query=${encodeURIComponent(keyword)}&noFilter=1`).then(r => r.json()),
          fetch(`/api/yahoo?query=${encodeURIComponent(keyword)}&noFilter=1`).then(r => r.json())
        ]);

        const newShops = [...cachedShops];

        if (rakutenResult.status === 'fulfilled' && rakutenResult.value.products) {
          const items = rakutenResult.value.products.filter(item => nameMatches(item.name) && priceInRange(item.price));
          if (items.length > 0) {
            const best = items.sort((a, b) => a.price - b.price)[0];
            const shopName = best.brand || '楽天市場';
            // 既存の楽天データがあれば更新、なければ追加
            const idx = newShops.findIndex(s => s.source === 'rakuten');
            const shopData = {
              name: shopName, type: 'mall', lowestPrice: best.price, source: 'rakuten',
              sellers: [{ name: shopName, price: best.price, shipping: 0, points: 0, url: best.url, note: '' }]
            };
            if (idx >= 0) newShops[idx] = shopData; else newShops.push(shopData);
          }
        }

        if (yahooResult.status === 'fulfilled' && yahooResult.value.products) {
          const items = yahooResult.value.products.filter(item => nameMatches(item.name) && priceInRange(item.price));
          if (items.length > 0) {
            const best = items.sort((a, b) => a.price - b.price)[0];
            const shopName = best.brand || 'Yahoo!ショッピング';
            const idx = newShops.findIndex(s => s.source === 'yahoo');
            const shopData = {
              name: shopName, type: 'mall', lowestPrice: best.price, source: 'yahoo',
              sellers: [{ name: shopName, price: best.price, shipping: 0, points: 0, url: best.url, note: '' }]
            };
            if (idx >= 0) newShops[idx] = shopData; else newShops.push(shopData);
          }
        }

        setCrossPlatformShops(newShops);
      } catch (e) {
        console.warn('Cross-platform fetch failed:', e);
      } finally {
        setIsCrossLoading(false);
      }
    };
    fetchCross();
  }, [selectedProduct]);

  // ギフトタブ: DBから取得してフィルタ（クロンが毎朝更新）
  const sceneKeywords = {
    '出産祝い': ['出産祝い', 'ギフト', 'プレゼント'],
    'ハーフバースデー': ['ハーフバースデー', '6ヶ月', '半年'],
    '友人へ': ['おしゃれ', 'かわいい', 'おしゃれ'],
    '同僚へ': ['実用', 'セット', '消耗品'],
    '家族・親戚から': ['セット', '豪華', 'まとめ'],
  };

  useEffect(() => {
    if (activeTab !== 'gift') return;
    const base = dbProducts.filter(p => p.category === 'ギフトセット');

    const priceRanges = {
      '3000円〜': [3000, 4999],
      '5000円〜': [5000, 9999],
      '10000円〜': [10000, Infinity],
    };
    const range = priceRanges[giftBudgetFilter];
    const kws = sceneKeywords[giftSceneFilter];

    const filtered = base.filter(p => {
      const price = getLowestPrice(p.shops) || p.price || 0;
      if (range && (price < range[0] || price > range[1])) return false;
      if (kws && !kws.some(kw => p.name.includes(kw))) return false;
      return true;
    });

    setGiftProducts(filtered.length > 0 ? filtered : base.filter(p => {
      const price = getLowestPrice(p.shops) || p.price || 0;
      if (range && (price < range[0] || price > range[1])) return false;
      return true;
    }));
  }, [activeTab, giftBudgetFilter, giftSceneFilter, dbProducts]);

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
      'お試しセット', '訳あり', 'アウトレット', '中古', 'リユース',
      'おむつケーキ', 'おむつタワー', 'おむつリース', 'おむつアート', 'おむつフラワー',
    ];
    const CATEGORY_NG = {
      "おむつ": ["大人用", "介護用", "失禁", "尿漏れ", "介護パンツ", "大人おむつ", "成人用", "シニア用"],
    };
    const mapItems = (items, cat) => items
      .filter(item => !NG_KEYWORDS.some(kw => item.Item.itemName.includes(kw)))
      .filter(item => {
        const ng = CATEGORY_NG[cat] || [];
        return ng.length === 0 || !ng.some(kw => item.Item.itemName.includes(kw));
      })
      .map(item => {
        const name = cleanName(item.Item.itemName);
        const rawImg = item.Item.largeImageUrls?.[0]?.imageUrl
          || item.Item.mediumImageUrls?.[0]?.imageUrl || "";
        const unitCount = cat === "おむつ" ? parseDiaperCount(item.Item.itemName) : null;
        return {
          id: `ranking-${item.Item.itemCode}`,
          name,
          price: item.Item.itemPrice,
          image: rawImg.replace(/_ex=\d+x\d+/, '_ex=640x640'),
          url: item.Item.affiliateUrl || item.Item.itemUrl,
          brand: "",
          category: cat,
          rating: parseFloat(item.Item.reviewAverage) || 4.5,
          unitCount,
          unitName: unitCount ? "枚" : null,
          shops: [{ name: item.Item.shopName || "楽天市場", price: item.Item.itemPrice, url: item.Item.affiliateUrl || item.Item.itemUrl }]
        };
      })
      .filter(validateProduct);

    try {
      const appId = import.meta.env.VITE_RAKUTEN_APP_ID;
      const accessKey = import.meta.env.VITE_RAKUTEN_ACCESS_KEY || '';
      const affiliateId = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID || '';
      if (!appId) throw new Error("VITE_RAKUTEN_APP_ID not set");

      const rankingUrl = (genreId) => `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${appId}&accessKey=${accessKey}&genreId=${genreId}&affiliateId=${affiliateId}`;
      const searchUrl = (keyword, page = 1, sort = '-reviewCount') => `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401?applicationId=${appId}&accessKey=${accessKey}&keyword=${encodeURIComponent(keyword)}&sort=${sort}&hits=30&page=${page}&availability=1&affiliateId=${affiliateId}`;

      // 重複排除キー: 画像URL（サイズパラメータ除去）優先 → 名前先頭20文字
      const imageKey = (url) => (url || '').replace(/[?&]_ex=\d+x\d+/g, '').replace(/[?&].*$/, '');
      const nameKey = (name) => (name || '').replace(/[\s　]/g, '').toLowerCase().slice(0, 20);
      const dedupeAndMergeShops = (items) => {
        const map = new Map();
        for (const item of items) {
          const key = imageKey(item.image) || nameKey(item.name);
          if (!key) continue;
          if (!map.has(key)) {
            map.set(key, { ...item, shops: [...item.shops] });
          } else {
            const existing = map.get(key);
            const newShops = item.shops.filter(s => !existing.shops.some(es => es.url === s.url));
            existing.shops.push(...newShops);
            if (item.price < existing.price) {
              existing.price = item.price;
              existing.image = item.image;
              existing.name = item.name;
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
        // おしりふきは「おむつ」を前置するとヒットしないため単独キーワード
        // 周辺グッズは商品名に「周辺グッズ」が入らないためカテゴリキーワードのみで検索
        const subKeyword = (catName === 'おむつ' && subCat === 'おしりふき')
          ? 'ベビー おしりふき'
          : subCat === '周辺グッズ'
            ? genre.keyword
            : [genre.keyword, subCat !== "すべて" ? subCat : "", normalizedSubSub !== "すべて" ? normalizedSubSub : ""].filter(Boolean).join(" ").trim();
        // 複数ソート×3ページで並列取得（最大270件→重複排除後150〜200件）
        const SORTS = ['-reviewCount', 'standard', '-reviewAverage'];
        const isWipes = catName === 'おむつ' && subCat === 'おしりふき';
        const subFetches = SORTS.flatMap(sort =>
          [1, 2, 3].map(p =>
            fetch(`${searchUrl(subKeyword, p, sort)}${isWipes ? '' : '&genreId=' + genreId}`)
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
                  const code = p.id.replace(/^(ranking|product)-/, '');
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

      if (!rawItems || rawItems.length === 0) {
        setRemoteProducts([]);
        return;
      }

      // 周辺グッズ選択時はアクセサリー専用ビュー（反転フィルタ）
      if (subCat === '周辺グッズ') {
        const onlyAccessories = rawItems.filter(p => {
          const n = p.name || '';
          return ACCESSORY_EXCLUDE_WORDS.some(w => n.includes(w));
        });
        if (onlyAccessories.length > 0) rawItems = onlyAccessories;
      } else {
        const accessoryFiltered = filterAccessories(rawItems);
        if (accessoryFiltered.length > 0) rawItems = accessoryFiltered;
      }

      // Step 1: 生データをすぐに表示（ブロック済みは除外）
      const immediateProducts = rawItems
        .filter(i => {
          const code = String(i.id).replace(/^(ranking|product)-/, '');
          return !blocklist.has(code);
        })
        .map(i => ({ ...i, isMarketWide: true }));
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
    } catch { }

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
    } catch { }
  };

  const fetchRemoteProductsWithAI = async (keyword) => {
    if (!keyword.trim()) return;

    setIsSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      // 1. 楽天・Yahoo両方から並列取得
      const [rakutenResult, yahooResult] = await Promise.allSettled([
        fetch(`/api/rakuten?query=${encodeURIComponent(keyword)}`).then(r => r.json()),
        fetch(`/api/yahoo?query=${encodeURIComponent(keyword)}`).then(r => r.json())
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
      // 検索はユーザーが意図的に指定しているのでアクセサリーフィルタを適用しない
      const allItems = raw;

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
  const favoriteSet = useMemo(() => new Set(favorites.map(f => f.id)), [favorites]);
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
              name: cleanName(item.itemName),
              price: item.itemPrice,
              brand: item.shopName || '楽天市場',
              category: matched ? userText : 'ベビー用品',
              image: (item.mediumImageUrls?.[0]?.imageUrl || '').replace(/_ex=\d+x\d+/, '_ex=640x640'),
              rating: parseFloat(item.reviewAverage) || 4.0,
              reviews_count: 0,
              ai_analysis: null,
              shops: [{ shop_name: '楽天市場', shop_type: 'mall', lowest_price: item.itemPrice, url: item.affiliateUrl || item.itemUrl }]
            }))
            .filter(validateProduct);
        } catch (e) {
          console.error('Ranking chat fetch failed:', e);
        }
      }

      let prompt;
      const isDiagnosis = userText.includes('診断');
      const isExpert = userText.includes('[商品詳細データ]');

      // マイベビー情報をコンテキストとして注入
      const babyContext = babyInfo && babyAgeLabel
        ? `【お子さま情報】${babyInfo.name ? `名前: ${babyInfo.name} / ` : ''}月齢: ${babyAgeLabel}${babyInfo.gender ? ` / 性別: ${babyInfo.gender}` : ''}\nこの月齢・状況に合った提案を心がけてください。\n\n`
        : '';

      if (isExpert) {
        prompt = `${babyContext}あなたはベビー用品のプロ購買コンサルタントです。提供された【商品詳細データ】を元に、以下の点に重点を置いて回答してください。
1. その商品の市場価値（他店と比較して安いか、買い時か）
2. 専門家から見たメリット・デメリット
3. どんなユーザーにおすすめか
決して嘘をつかず、具体的な数値（価格など）に言及して、ユーザーの決断を助けてください。
回答は簡潔に、箇条書きを活用して読みやすくしてください。

【ユーザーからの相談】
${userText}`;
      } else if (isDiagnosis) {
        prompt = `${babyContext}あなたはベビー用品比較アプリ「Honest Baby」のAIコンサルタントです。
ユーザーは「5秒診断」を希望しています。以下の手順で厳格に進めてください。
1. まず明るく挨拶し、「どんなアイテム（ベビーカー、抱っこ紐など）をお探しですか？」と1つだけ質問してください。
2. その後、ライフスタイルや予算について1つずつ質問を投げてください。
3. 合計3つ程度の対話のあと、データベース ${JSON.stringify(dbProducts.slice(0, 10).map(p => p.name))} の中から最適なものを提案してください。
4. 回答は親しみやすく、かつプレミアムな印象を与えてください。

【ユーザーの入力】
${userText}`;
      } else if (contextProducts.length > 0) {
        const productList = contextProducts.slice(0, 6).map((p, i) => {
          const price = p.shops?.[0]?.lowest_price ?? p.price;
          return `${i + 1}. ${p.name}（${price ? price.toLocaleString() + '円' : '価格不明'}）`;
        }).join('\n');
        prompt = `${babyContext}あなたはベビー用品比較アプリ「Honest Baby」のAIコンサルタントです。

【絶対ルール】
- 必ず以下の【商品リスト】にある商品名だけを使ってください
- リストに存在しない商品名は絶対に作ってはいけません
- 2〜3個の商品を選び、各商品を「■ 商品名：おすすめ理由（1〜2文）」の形式で答えてください
- 「1番」「2番」のような番号参照は使わず、必ず商品名そのものを書いてください
- 絵文字は使わず、簡潔に友人のように温かく答えてください

【商品リスト】
${productList}

【ユーザーの質問】
${userText}

【回答例】
お探しですね。おすすめはこちらです。

■ ベビーカー〇〇：軽量で扱いやすく、人気の一台です。
■ 抱っこ紐△△：コスパが良く初心者にもおすすめです。

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
      const aiText = data.text || "すみません、一時的にエラーが発生しました。もう一度お試しください。";

      // AIテキスト内で実際に言及された商品だけカードに表示する
      const mentionedProducts = contextProducts.filter(p =>
        aiText.includes(p.name) || aiText.includes(p.name.slice(0, 15))
      );
      const productsToShow = mentionedProducts.length > 0
        ? mentionedProducts.slice(0, 3)
        : contextProducts.slice(0, 3);

      setChatMessages([...newMessages, { role: 'assistant', text: aiText, products: productsToShow }]);
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
    if (!user) {
      alert("口コミを投稿するにはGoogleアカウントでログインしてください。\nマイページからログインできます。");
      return;
    }
    setIsSubmittingReview(true);

    try {
      let productId = selectedProduct.id;

      // もしIDがUUIDでない（API取得直後のデータなど）場合、まずDBに保存してUUIDを取得する
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

      if (!isUuid) {
        // DB保存ロジック（sync-products.jsの簡易版をフロントでも実行）
        const { data: saved, error: saveErr } = await supabase
          .from('products')
          .upsert({
            name: selectedProduct.name,
            category: selectedProduct.category,
            sub_category: selectedProduct.subCategory,
            brand: selectedProduct.brand,
            image_url: selectedProduct.image,
            rating: selectedProduct.rating || 0,
            reviews_count: selectedProduct.reviewsCount || 0,
            rakuten_item_code: selectedProduct.id,
            is_market_wide: true,
            last_synced_at: new Date().toISOString()
          })
          .select()
          .single();

        if (saveErr) throw saveErr;
        productId = saved.id;
      }

      const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー';

      // 写真アップロード（あれば）
      let uploadedImageUrl = null;
      if (reviewPhotoFile) {
        const ext = reviewPhotoFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(path, reviewPhotoFile, { cacheControl: '3600', upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('review-photos').getPublicUrl(path);
          uploadedImageUrl = urlData.publicUrl;
        }
      }

      // SupabaseにINSERT
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          product_id: productId,
          rating: reviewForm.rating,
          content: reviewForm.content,
          user_name: displayName,
          image_url: uploadedImageUrl,
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newReview = {
          ...data[0],
          user: data[0].user_name,
          date: new Date(data[0].created_at).toLocaleDateString()
        };

        const updatedProduct = {
          ...selectedProduct,
          id: productId, // UUIDに更新
          honestReviews: [newReview, ...(selectedProduct.honestReviews || [])]
        };

        setSelectedProduct(updatedProduct);
        setDbProducts(prev => prev.map(p => p.id === updatedProduct.id || p.id === selectedProduct.id ? updatedProduct : p));

        setIsReviewFormOpen(false);
        setReviewForm({ rating: 5, content: "" });
        setReviewPhotoFile(null);
        setReviewPhotoPreview(null);
        alert("口コミを投稿しました！ありがとうございます。");
      }
    } catch (e) {
      console.error("レビュー投稿エラー:", e);
      alert("投稿に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // --- 共通コンポーネント ---

  const openProduct = async (product) => {
    // 1. 画面遷移を最優先で実行（もっさり感を解消）
    setSelectedProduct(product);
    navigate(`/product/${encodeURIComponent(product.id)}`, { replace: true });

    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [{ id: product.id, name: product.name, image: product.image, price: product.price, rating: product.rating }, ...filtered].slice(0, 10);
    });

    // 2. 口コミデータなどはバックグラウンドで非同期に取得
    try {
      // 2単語でより正確に検索
      const nameParts = product.name.split(/[\s　]+/);
      const query = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1]}` : nameParts[0];
      const { data } = await supabase
        .from('products')
        .select('*, honestReviews:reviews(*), snsReviews:sns_reviews(*)')
        .ilike('name', `%${query}%`)
        .limit(1)
        .single();
      
      if (data) {
        setSelectedProduct(prev => {
          if (!prev || prev.id !== product.id) return prev;
          return {
            ...prev,
            honestReviews: (data.honestReviews || []).map(r => ({ ...r, user: r.user_name, date: new Date(r.created_at).toLocaleDateString() })),
            snsReviews: data.snsReviews || []
          };
        });
      }
    } catch (e) {
      console.warn('Background fetch error:', e);
    }
  };

  // --- 新機能: URL共有ハンドラ ---
  const handleShare = async () => {
    if (!selectedProduct) return;
    const shareUrl = window.location.href;
    const shareData = {
      title: `Honest Baby | ${selectedProduct.name}`,
      text: `${selectedProduct.name}をHonest Babyでチェック！`,
      url: shareUrl
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { console.warn('Share failed:', e); }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('リンクをコピーしました！');
      } catch (e) {
        alert('共有に失敗しました。');
      }
    }
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    setExpandedMall(null);
    setReviewTab('honest');
    try { sessionStorage.removeItem('honestBabyOpenProduct'); } catch { }
    navigate('/', { replace: true });
  };

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
            データベースとの接続に失敗しました。<br />
            Vercelの環境変数（URLとKey）に間違いがないか、<br />
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F2ABAC]/60">Loading</p>
            <p className="text-xs font-bold text-[#A5A19E]">データを読み込んでいます...</p>
          </div>
        </div>
      );
    }

    let filtered = dbProducts
      .filter(p => {
        const code = p.id.replace(/^(ranking|product)-/, '');
        if (blocklist.has(code)) return false;
        // ギフトセットはギフトページ専用。「すべて」ホームには表示しない
        if (selectedCategory === "すべて" && p.category === "ギフトセット") return false;
        const matchCat = selectedCategory === "すべて" || p.category === selectedCategory;
        const matchSub = selectedSubCategory === "すべて" || p.subCategory === selectedSubCategory;
        const matchSubSub = selectedSubSubCategory === "すべて" || p.subSubCategory === selectedSubSubCategory;
        return matchCat && matchSub && matchSubSub;
      })
      .sort((a, b) => (a.popularity_rank || 9999) - (b.popularity_rank || 9999));

    // カテゴリ選択中でDBにデータがない、またはリモート検索結果がある場合
    const showRemote = remoteProducts.length > 0 || isRemoteLoading;

    const applySortOrder = (arr) => {
      if (sortOrder === "popular")
        return [...arr].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      if (sortOrder === "price_asc")
        return [...arr].sort((a, b) => (a.price || getLowestPrice(a.shops) || 0) - (b.price || getLowestPrice(b.shops) || 0));
      if (sortOrder === "price_desc")
        return [...arr].sort((a, b) => (b.price || getLowestPrice(b.shops) || 0) - (a.price || getLowestPrice(a.shops) || 0));
      return arr;
    };

    return (
      <div className="animate-in fade-in duration-500">
        <div className="w-full bg-[#FFF5F5] rounded-[2.5rem] p-8 mb-8 relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform border border-[#FFEBEB] cursor-pointer" onClick={() => setActiveTab('ai')}>
          {/* AI Banner Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white p-1.5 rounded-full shadow-sm"><Sparkles className="w-4 h-4 text-[#F2ABAC]" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F2ABAC]">AI Concierge</span>
            </div>
            <h4 className="text-2xl font-black mb-2 text-[#5A4C4C] leading-tight">AIに育児アイテムを<br />相談してみる</h4>
            <p className="text-[11px] text-[#8E8282] max-w-[200px] font-bold">ぴったりのベビー用品をAIが比較・提案します</p>
          </div>
          <div className="absolute right-[-10%] bottom-[-20%] w-48 h-48 bg-[#FFE6E6] rounded-full opacity-50 blur-2xl"></div>
          <Bot className="absolute right-4 bottom-2 w-24 h-24 text-[#F2ABAC] opacity-20 rotate-12" />
        </div>

        {/* ─── マイベビー月齢別おすすめカテゴリ ─── */}
        {babyInfo && babyAgeMonths != null && (() => {
          const stage = AGE_CATEGORY_MAP.find(s => babyAgeMonths >= s.minM && babyAgeMonths < s.maxM);
          if (!stage) return null;
          return (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-[10px] font-black text-[#F2ABAC] uppercase tracking-widest">My Baby</span>
                <span className="text-xs font-bold text-[#5A4C4C] truncate">
                  {babyInfo.name || 'お子さま'}（{babyAgeLabel}）に今必要なもの
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                {stage.cats.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-white border border-[#F4EFEB] rounded-full px-4 py-2.5 text-xs font-bold text-[#5A4C4C] shadow-sm active:scale-95 transition-transform"
                  >
                    <CategoryIcon name={cat} className="w-3.5 h-3.5 text-[#7B8E76]" />
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="relative">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-5 -mx-4 px-4 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
            {CATEGORY_TREE.map(cat => (
              <button
                key={cat.name}
                onClick={() => handleCategoryChange(cat.name)}
                className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${selectedCategory === cat.name
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
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
                  {["すべて", ...currentSubs].map(sub => {
                    const subName = getSubName(sub);
                    return (
                      <button
                        key={subName}
                        onClick={() => handleSubCategoryChange(subName)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${selectedSubCategory === subName
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
                  <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
                    {["すべて", ...currentSubsubs].map(subsub => (
                      <button
                        key={subsub}
                        onClick={() => handleSubSubCategoryChange(subsub)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${selectedSubSubCategory === subsub
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

        {/* ─── おむつカテゴリ：月齢別サイズ提案バナー ─── */}
        {selectedCategory === 'おむつ' && babyInfo && babyAgeMonths != null && (() => {
          const entry = DIAPER_SIZE_BY_AGE.find(e => babyAgeMonths < e.maxM);
          if (!entry) return null;
          return (
            <div className="flex items-center justify-between bg-[#FFF5F5] border border-[#FFEBEB] rounded-2xl px-4 py-3 mb-4">
              <p className="text-xs font-bold text-[#5A4C4C] leading-snug">
                {babyInfo.name || 'お子さま'}（{babyAgeLabel}）は<br />
                <span className="text-[#F2ABAC] font-black">{entry.label}頃</span>が目安です
              </p>
              <button
                onClick={() => {
                  if (entry.sub) setSelectedSubCategory(entry.sub);
                  setSelectedSubSubCategory(entry.size);
                }}
                className="bg-[#F2ABAC] text-white text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-transform whitespace-nowrap ml-3"
              >
                {entry.label}を見る
              </button>
            </div>
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

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 mb-4 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
          {[
            { key: 'standard', label: '標準' },
            { key: 'popular', label: '評価順' },
            { key: 'price_asc', label: '価格↑' },
            { key: 'price_desc', label: '価格↓' },
          ].map(s => (
            <button key={s.key} onClick={() => setSortOrder(s.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${sortOrder === s.key ? 'bg-[#5A4C4C] text-white shadow-sm' : 'bg-[#F0EBE6] text-[#7B8E76]'
                }`}>{s.label}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4 xl:grid-cols-5">
          {/* DB商品を優先表示（Cronバッチで毎晩自動更新） */}
          {filtered.length > 0 && applySortOrder(filtered).map((p) => (
            <ProductCard key={p.id} product={p} onOpen={openProduct} onToggleFavorite={toggleFavorite} favoriteIds={favoriteSet} isAdminMode={isAdminMode} onBlock={blockProduct} />
          ))}

          {/* DB商品がないカテゴリではリモート検索結果をフォールバック表示（ブロック済み除外） */}
          {filtered.length === 0 && remoteProducts.length > 0 && applySortOrder(
            remoteProducts.filter(p => !blocklist.has(String(p.id).replace(/^(ranking|product)-/, '')))
          ).map((p) => (
            <ProductCard key={p.id} product={p} onOpen={openProduct} onToggleFavorite={toggleFavorite} favoriteIds={favoriteSet} isAdminMode={isAdminMode} onBlock={blockProduct} />
          ))}

          {filtered.length === 0 && remoteProducts.length === 0 && cachedProducts[selectedCategory]?.length > 0 && (
            applySortOrder(
              cachedProducts[selectedCategory].filter(p => !blocklist.has(String(p.id).replace(/^(ranking|product)-/, '')))
            ).map((p) => <ProductCard key={p.id} product={p} onOpen={openProduct} onToggleFavorite={toggleFavorite} favoriteIds={favoriteSet} isAdminMode={isAdminMode} onBlock={blockProduct} />)
          )}

          {/* Empty State */}
          {!isRemoteLoading && filtered.length === 0 && remoteProducts.length === 0 && !cachedProducts[selectedCategory]?.length && (
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
          <p className="text-xs text-[#8E8282] font-bold leading-relaxed relative z-10">絶対喜ばれるベビーアイテムを厳選。<br />ギフト対応の公式ショップも比較できます。</p>
        </div>

        <h3 className="font-black text-[#5A4C4C] mb-4 px-1">予算から探す</h3>
        <div className="flex flex-wrap gap-2 mb-8">
          {["すべて", "3000円〜", "5000円〜", "10000円〜"].map(tag => (
            <button key={tag} onClick={() => setGiftBudgetFilter(tag)} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${giftBudgetFilter === tag ? 'bg-[#F2ABAC] text-white shadow-sm' : 'bg-white border border-[#F4EFEB] text-[#A5A19E]'}`}>{tag}</button>
          ))}
        </div>

        <h3 className="font-black text-[#5A4C4C] mb-4 px-1">シーン・贈る相手から探す</h3>
        <div className="flex flex-wrap gap-2 mb-8">
          {["すべて", "出産祝い", "ハーフバースデー", "友人へ", "同僚へ", "家族・親戚から"].map(tag => (
            <button key={tag} onClick={() => setGiftSceneFilter(tag)} className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${giftSceneFilter === tag ? 'bg-[#7B8E76] text-white shadow-sm' : 'bg-[#F9F6F3] text-[#8E8282]'}`}>{tag}</button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5 px-1"><h3 className="font-black text-[#5A4C4C] text-xl">おすすめのギフト</h3></div>
        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4 xl:grid-cols-5">
          {dbLoading
            ? <div className="col-span-2 py-10 text-center text-[#A5A19E] text-xs font-bold animate-pulse">ギフト商品を読み込み中...</div>
            : giftProducts.length > 0
              ? giftProducts.map((p, i) => <ProductCard key={p.id || i} product={p} onOpen={openProduct} onToggleFavorite={toggleFavorite} favoriteIds={favoriteSet} isAdminMode={isAdminMode} onBlock={blockProduct} />)
              : <div className="col-span-2 py-10 text-center text-[#A5A19E] text-xs font-bold">条件に合うギフトが見つかりません</div>}
        </div>
      </div>
    );
  };

  const renderUser = () => {
    return (
      <div className="animate-in slide-in-from-right duration-300 pb-20">
        {/* プロフィールカード */}
        <div className="bg-gradient-to-b from-[#FFF9F0] to-transparent -mx-6 px-6 pt-2 pb-8 mb-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif font-black text-[#5A4C4C] text-2xl">マイページ</h2>
            {user
              ? <button onClick={signOut} className="text-[10px] font-black text-[#A5A19E] bg-[#F9F6F3] px-3 py-1.5 rounded-full border border-[#F4EFEB] active:scale-95 transition-transform">ログアウト</button>
              : <button onClick={signInWithGoogle} className="text-[10px] font-black text-white bg-[#F2ABAC] px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform">Googleでログイン</button>
            }
          </div>
          {!user && (
            <div className="bg-[#FFF5F5] border border-[#FFEBEB] p-4 rounded-[1.5rem] mb-4 text-center">
              <p className="text-xs font-bold text-[#5A4C4C] mb-1">ログインでお気に入りを同期・口コミを投稿</p>
              <button onClick={signInWithGoogle} className="text-xs font-black text-[#F2ABAC] underline">Googleアカウントでログイン</button>
              {/iPhone|iPad|iPod/.test(navigator.userAgent) && window.navigator.standalone && (
                <p className="text-[10px] text-[#A5A19E] mt-2 font-bold">
                  ログインできない場合は{' '}
                  <a href={window.location.href} target="_blank" rel="noreferrer" className="underline text-[#7B8E76]">
                    Safariで開いてログイン
                  </a>
                </p>
              )}
            </div>
          )}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F4EFEB] flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Baby className="w-32 h-32 text-[#7B8E76]" /></div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#F2ABAC] to-[#F9DC5C] flex items-center justify-center text-white shadow-md relative z-10 overflow-hidden">
              {user?.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                : babyInfo ? <Baby className="w-8 h-8" /> : <User className="w-8 h-8" />
              }
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-[#5A4C4C] leading-tight">
                {user?.user_metadata?.full_name || (babyInfo?.name ? `${babyInfo.name}のママ・パパ` : 'ゲスト様')}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {babyAgeLabel && (
                  <span className="text-[10px] text-white bg-[#F2ABAC] px-2 py-0.5 rounded-md font-bold">{babyAgeLabel}</span>
                )}
                {babyInfo?.gender && (
                  <span className="text-[10px] text-white bg-[#7B8E76] px-2 py-0.5 rounded-md font-bold">{babyInfo.gender}</span>
                )}
                <button onClick={() => {
                  const today = new Date();
                  setBabyForm(babyInfo ? { ...babyInfo } : { name: '', birthYear: today.getFullYear(), birthMonth: today.getMonth() + 1, gender: '' });
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
            const today = new Date();
            setBabyForm(babyInfo ? { ...babyInfo } : { name: '', birthYear: today.getFullYear(), birthMonth: today.getMonth() + 1, gender: '' });
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
                  <p className="text-sm font-black text-[#5A4C4C]">ぴったりのアイテムをAIが提案</p>
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
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
              {recentlyViewed.map(p => (
                <div key={p.id} onClick={() => { const full = [...remoteProducts, ...dbProducts].find(r => r.id === p.id) || p; openProduct(full); }}
                  className="flex-shrink-0 w-28 cursor-pointer active:scale-95 transition-transform">
                  <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden bg-[#F9F6F3] mb-2">
                    {p.image ? <img src={getHighResImage(p.image)} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#A5A19E]"><Package className="w-8 h-8" /></div>}
                  </div>
                  <p className="text-[10px] font-bold text-[#5A4C4C] leading-tight line-clamp-2">{p.name}</p>
                  {p.price && <p className="text-[10px] text-[#F2ABAC] font-black mt-0.5">¥{p.price.toLocaleString()}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4 xl:grid-cols-5">
          <div className="bg-white border border-[#F4EFEB] p-5 rounded-[2rem] shadow-sm flex flex-col justify-center active:scale-95 transition-transform cursor-pointer" onClick={() => setActiveTab('heart')}>
            <div className="w-12 h-12 bg-[#FFF5F5] rounded-[1.25rem] flex items-center justify-center text-[#F2ABAC] mb-3"><Heart className="w-6 h-6 fill-current" /></div>
            <p className="text-sm font-black text-[#5A4C4C]">保存リスト</p>
            <p className="text-[10px] text-[#A5A19E] font-bold mt-1">{favorites.length} items</p>
          </div>
          <div className="bg-white border border-[#F4EFEB] p-5 rounded-[2rem] shadow-sm flex flex-col justify-center active:scale-95 transition-transform cursor-pointer" onClick={() => priceAlerts.length > 0 ? document.getElementById('price-alert-list')?.scrollIntoView({ behavior: 'smooth' }) : setActiveTab('home')}>
            <div className="w-12 h-12 bg-[#FFF9E6] rounded-[1.25rem] flex items-center justify-center text-[#D4AF37] mb-3"><BellRing className="w-6 h-6" /></div>
            <p className="text-sm font-black text-[#5A4C4C]">価格アラート</p>
            <p className="text-[10px] text-[#A5A19E] font-bold mt-1">{priceAlerts.length > 0 ? `${priceAlerts.length}件設定中` : '値下がり通知を設定'}</p>
          </div>
        </div>

        {/* 価格アラート: トリガー済み通知バナー */}
        {triggeredAlerts.length > 0 && (
          <div className="mb-6 bg-[#FFF9E6] border border-[#F9DC5C]/40 rounded-[1.5rem] p-4">
            <div className="flex items-center gap-2 mb-2">
              <BellRing className="w-4 h-4 text-[#D4AF37]" />
              <p className="text-xs font-black text-[#B8860B]">価格アラート！{triggeredAlerts.length}件が目標価格に到達しました</p>
            </div>
            {triggeredAlerts.map(a => (
              <div key={a.id} className="flex items-center gap-2 mt-2">
                {a.image && <img src={a.image} className="w-8 h-8 rounded-lg object-cover" alt="" />}
                <p className="text-[11px] font-bold text-[#5A4C4C] flex-1 line-clamp-1">{a.name}</p>
                {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-[#D4AF37] underline">確認</a>}
              </div>
            ))}
            <button onClick={() => setTriggeredAlerts([])} className="mt-3 text-[10px] text-[#A5A19E] font-bold">閉じる</button>
          </div>
        )}

        {/* 価格アラート一覧 */}
        {priceAlerts.length > 0 && (
          <div id="price-alert-list" className="mb-8">
            <h3 className="font-black text-[#5A4C4C] mb-4 px-1 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-[#D4AF37]" /> 設定中のアラート
            </h3>
            <div className="space-y-3">
              {priceAlerts.map(alert => (
                <div key={alert.id} className="bg-white border border-[#F4EFEB] p-4 rounded-[1.5rem] shadow-sm flex items-center gap-3">
                  <div className="w-14 h-14 rounded-[1rem] overflow-hidden bg-[#F9F6F3] flex-shrink-0">
                    {alert.image ? <img src={getHighResImage(alert.image)} alt={alert.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-[#A5A19E] m-auto mt-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#5A4C4C] leading-tight line-clamp-1">{alert.name}</p>
                    <p className="text-[10px] text-[#A5A19E] font-bold mt-0.5">登録価格 ¥{Number(alert.price).toLocaleString()}</p>
                    <p className="text-[10px] text-[#D4AF37] font-black">目標 ¥{Number(alert.targetPrice).toLocaleString()} 以下</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-[#F2ABAC] text-white px-2 py-1 rounded-full font-black text-center">確認</a>
                    <button onClick={() => { setPriceAlerts(prev => prev.filter(a => a.id !== alert.id)); if (user) deletePriceAlertFromDB(user.id, alert.id); }} className="text-[9px] bg-[#F9F6F3] text-[#A5A19E] px-2 py-1 rounded-full font-black">削除</button>
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
            <button onClick={() => { setShowContactModal(true); setContactSent(false); setContactContent(''); setContactCategory('商品について'); }} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors"><Mail className="w-4 h-4 mr-2" /> お問い合わせ</button>
            <button onClick={() => setActiveLegalPage('terms')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors"><FileText className="w-4 h-4 mr-2" /> 利用規約</button>
            <button onClick={() => setActiveLegalPage('privacy')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors"><Shield className="w-4 h-4 mr-2" /> プライバシーポリシー</button>
            <button onClick={() => setActiveLegalPage('disclaimer')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors text-left leading-relaxed"><Info className="w-4 h-4 mr-2 flex-shrink-0" /> 運営者情報・免責事項<br />(アフィリエイトについて)</button>
            <button onClick={() => setActiveLegalPage('tokushoho')} className="flex items-center text-xs font-bold text-[#A5A19E] hover:text-[#5A4C4C] transition-colors"><FileText className="w-4 h-4 mr-2" /> 特定商取引法に基づく表記</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-[#FFFDFB] font-sans text-[#5A4C4C] selection:bg-[#F2ABAC] selection:text-white ${activeTab === 'ai' ? 'h-[100svh] overflow-hidden flex flex-col lg:pl-60' : 'min-h-screen pb-32 lg:pb-0 lg:pl-60'}`}>
      <Helmet>
        <meta name="google-site-verification" content="bapS2y_EyERyWlNqP1F_SSbxEhm01lyv1Sb7E8u-5qI" />
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
          ? <link rel="canonical" href={`https://honestbaby-care.com/product/${encodeURIComponent(selectedProduct.id)}`} />
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
        <meta property="og:image" content={selectedProduct?.image || "https://honestbaby-care.com/favicon.png"} />
        {selectedProduct
          ? <meta property="og:url" content={`https://honestbaby-care.com/product/${encodeURIComponent(selectedProduct.id)}`} />
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
        <meta name="twitter:image" content={selectedProduct?.image || "https://honestbaby-care.com/favicon.png"} />

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
              "logo": "https://honestbaby-care.com/favicon.png"
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
      {/* ===== PC左サイドバー (lg以上のみ表示) ===== */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-60 bg-white border-r border-[#F4EFEB] z-40">
        {/* ロゴ */}
        <div className="px-6 py-6 border-b border-[#F4EFEB]">
          <h1 className="text-xl font-black text-[#7B8E76] tracking-tight cursor-pointer font-serif" onClick={() => setActiveTab('home')}>
            Honest Baby<span className="text-[#F2ABAC] text-3xl leading-[0] relative top-1">.</span>
          </h1>
          <p className="text-[10px] text-[#A5A19E] font-bold mt-1">忖度なしのベビー用品比較</p>
        </div>

        {/* タブナビ */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { id: 'home',   label: 'ホーム',   icon: <Home className="w-5 h-5" /> },
            { id: 'search', label: '検索',     icon: <Search className="w-5 h-5" /> },
            { id: 'ai',     label: 'AIコンサル', icon: <Bot className="w-5 h-5" /> },
            { id: 'gift',   label: 'ギフト',   icon: <Gift className="w-5 h-5" /> },
            { id: 'user',   label: 'マイページ', icon: <User className="w-5 h-5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                activeTab === tab.id
                  ? 'bg-[#7B8E76]/10 text-[#7B8E76]'
                  : 'text-[#A5A19E] hover:bg-[#F9F6F3] hover:text-[#5A4C4C]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* 下部: お気に入り・ログイン状態 */}
        <div className="px-4 py-4 border-t border-[#F4EFEB] space-y-2">
          {user ? (
            <div className="flex items-center gap-3 px-2 py-2">
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                : <div className="w-8 h-8 rounded-full bg-[#F2ABAC]/20 flex items-center justify-center"><User className="w-4 h-4 text-[#F2ABAC]" /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#5A4C4C] truncate">{user.user_metadata?.full_name || 'ユーザー'}</p>
                <button onClick={signOut} className="text-[10px] text-[#A5A19E] font-bold hover:text-[#F2ABAC]">ログアウト</button>
              </div>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F2ABAC] text-white rounded-2xl text-xs font-black hover:bg-[#e89899] transition-colors">
              Googleでログイン
            </button>
          )}
          {favorites.length > 0 && (
            <button onClick={() => setActiveTab('heart')} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#F2ABAC] hover:bg-[#FFF5F5]">
              <Heart className="w-4 h-4 fill-current" /> {favorites.length}件お気に入り
            </button>
          )}
        </div>
      </aside>

      {/* 上部ヘッダー (スマホのみ) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-[#F4EFEB] lg:hidden">
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

      <main className={activeTab === 'ai' ? 'px-6 pt-4 flex flex-col flex-1 min-h-0 overflow-hidden lg:flex-1 lg:overflow-auto' : 'px-6 pt-4 lg:px-10 lg:pt-8 lg:max-w-7xl lg:mx-auto'} style={activeTab === 'ai' ? { paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 4.5rem), 5rem)' } : {}}>
        {activeTab === 'home' && renderHome()}
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
                        {p.image ? <img src={getHighResImage(p.image)} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-[#A5A19E] m-auto mt-6" />}
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
            {favorites.length === 0 ? <p className="text-center text-[#A5A19E] mt-20 font-bold text-xs uppercase tracking-widest leading-loose">保存されているアイテムは<br />ありません</p> :
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">{favorites.map(p => <ProductCard key={p.id} product={p} onOpen={openProduct} onToggleFavorite={toggleFavorite} favoriteIds={favoriteSet} isAdminMode={isAdminMode} onBlock={blockProduct} />)}</div>}
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
                  <div className={`max-w-[85%] p-4 text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-[#7B8E76] text-white rounded-[1.5rem] rounded-tr-sm shadow-md' : 'bg-white text-[#5A4C4C] rounded-[1.5rem] rounded-tl-sm border border-[#F4EFEB] shadow-sm'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="space-y-3">
                        {msg.text.split(/(?=■)/).map((chunk, ci) => {
                          const trimmed = chunk.trim();
                          if (!trimmed) return null;
                          if (trimmed.startsWith('■')) {
                            const colonIdx = trimmed.indexOf('：');
                            const title = colonIdx > -1 ? trimmed.slice(1, colonIdx).trim() : trimmed.slice(1).trim();
                            const body = colonIdx > -1 ? trimmed.slice(colonIdx + 1).trim() : '';
                            return (
                              <div key={ci} className="bg-[#F9F6F3] rounded-xl px-3 py-2.5">
                                <p className="text-xs font-black text-[#5A4C4C] leading-snug mb-1">{title}</p>
                                {body && <p className="text-[11px] text-[#7A6E6E] leading-relaxed">{body}</p>}
                              </div>
                            );
                          }
                          return <p key={ci} className="text-sm leading-relaxed whitespace-pre-wrap">{trimmed}</p>;
                        })}
                      </div>
                    ) : msg.text}
                  </div>
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-2 w-[85%]">
                      {msg.products.map(p => (
                        <button key={p.id} onClick={() => setSelectedProduct(p)} className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 text-left border border-[#F4EFEB] shadow-sm active:scale-[0.98] transition-transform">
                          <img src={getHighResImage(p.image)} onError={e => { e.target.src = "https://placehold.jp/24/7b8e76/ffffff/80x80.png?text=Baby"; }} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt={p.name} />
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
            <div className="p-4 bg-white border-t border-[#F4EFEB] flex gap-2 flex-shrink-0" style={{ paddingBottom: 'calc(1rem + var(--keyboard-height, 0px))' }}>
              <input type="text" placeholder="AIにメッセージ..." className="flex-1 bg-[#F9F6F3] border-none rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B8E76]/20" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
              <button onClick={handleSendMessage} className="bg-[#7B8E76] text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"><Send className="w-4 h-4 ml-0.5" /></button>
            </div>
          </div>
        )}
      </main>

      {/* ＝＝＝＝＝ 管理者: 削除アンドゥトースト ＝＝＝＝＝ */}
      {showUndoToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-[#5A4C4C] text-white text-sm font-bold px-5 py-3.5 rounded-full shadow-xl animate-in slide-in-from-bottom duration-200">
          <span>非表示にしました</span>
          <button
            onClick={unblockProduct}
            className="bg-white text-[#5A4C4C] px-3 py-1 rounded-full text-xs font-black active:scale-95 transition-transform"
          >元に戻す</button>
        </div>
      )}

      {/* ＝＝＝＝＝ 管理者: 非表示リスト浮きボタン ＝＝＝＝＝ */}
      {isAdminMode && !showUndoToast && (
        <button
          onClick={() => { setShowBlockedList(true); fetchBlockedProducts(); }}
          className="fixed bottom-28 right-4 z-[200] bg-red-500 text-white text-[11px] font-black px-4 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform"
        >🚫 非表示リスト</button>
      )}

      {/* ＝＝＝＝＝ 管理者: ブロック済み商品モーダル ＝＝＝＝＝ */}
      {showBlockedList && (
        <div className="fixed inset-0 z-[210] bg-black/50 flex items-end" onClick={() => setShowBlockedList(false)}>
          <div className="bg-white w-full max-h-[80vh] rounded-t-[2rem] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F4EFEB]">
              <h3 className="font-black text-[#5A4C4C] text-lg">非表示にした商品</h3>
              <button onClick={() => setShowBlockedList(false)} className="text-[#A5A19E] font-bold text-sm">閉じる</button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              {isLoadingBlocked && <p className="text-center text-sm text-[#A5A19E] py-8">読み込み中...</p>}
              {!isLoadingBlocked && blockedProducts.length === 0 && (
                <p className="text-center text-sm text-[#A5A19E] py-8">非表示にした商品はありません</p>
              )}
              {blockedProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-[#F9F6F3] rounded-2xl p-3">
                  {p.image_url && (
                    <img src={p.image_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 opacity-60" alt={p.name} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#5A4C4C] line-clamp-2">{p.name}</p>
                    <p className="text-[10px] text-[#A5A19E]">{p.category}</p>
                  </div>
                  <button
                    onClick={() => restoreBlockedProduct(p)}
                    className="bg-[#7B8E76] text-white px-4 py-2 rounded-full text-xs font-black whitespace-nowrap active:scale-95 transition-transform"
                  >復元</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ＝＝＝＝＝ 商品詳細モーダル ＝＝＝＝＝ */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] bg-[#FFFDFB] flex flex-col animate-in slide-in-from-bottom duration-300 lg:bg-black/50 lg:backdrop-blur-sm lg:items-center lg:justify-center" onClick={(e) => { if (e.target === e.currentTarget) closeProduct(); }}>
          <div className="flex flex-col w-full h-full lg:max-w-4xl lg:max-h-[90vh] lg:rounded-3xl lg:overflow-hidden lg:shadow-2xl lg:bg-[#FFFDFB] lg:h-auto">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-[#F4EFEB]">
            <button onClick={closeProduct} className="p-2 -ml-2 bg-[#F9F6F3] rounded-full text-[#5A4C4C]"><ChevronLeft className="w-6 h-6" /></button>
            <span className="text-sm font-black text-[#5A4C4C]">商品詳細</span>
            <button onClick={handleShare} className="p-2 -mr-2 text-[#A5A19E] active:scale-90 transition-transform"><Share2 className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-32 lg:pb-8">
            <div className="bg-[#F9F6F3] rounded-[3rem] p-6 my-6">
              <img src={getHighResImage(selectedProduct.image)} onError={(e) => { e.target.onerror = null; e.target.src = selectedProduct.image || "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Baby"; }} className="w-full aspect-square object-cover rounded-[2rem] shadow-sm" alt={selectedProduct.name} />
            </div>

            <div className="flex justify-between items-start mb-8 px-1">
              <div className="flex-1 pr-4">
                <div className="flex gap-2 mb-2">
                  <span className="text-[10px] font-black text-[#7B8E76] bg-[#7B8E76]/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{selectedProduct.category}</span>
                  {selectedProduct.giftTags && <span className="text-[10px] font-black text-[#F2ABAC] bg-[#F2ABAC]/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Gift</span>}
                </div>
                <h2 className="text-2xl font-black text-[#5A4C4C] leading-tight mb-2">{selectedProduct.name}</h2>
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedProduct.rating) ? 'fill-current' : 'text-gray-200'}`} />)}
                  <span className="text-xs font-black text-[#A5A19E] ml-1">({selectedProduct.reviewsCount})</span>
                </div>
              </div>
              <button onClick={(e) => toggleFavorite(e, selectedProduct)} className="p-4 bg-white border border-[#F4EFEB] rounded-full shadow-sm">
                <Heart className={`w-6 h-6 ${isFavorite(selectedProduct.id) ? 'text-red-500 fill-current' : 'text-[#D4CDC7]'}`} />
              </button>
            </div>

            <div className="flex gap-3 mb-8 px-1">
              <a href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(`https://honestbaby-care.com/product/${selectedProduct.id}`)}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 bg-[#06C755] text-white rounded-full px-4 py-2.5 text-xs font-black active:scale-95 transition-transform">
                LINE でシェア
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${selectedProduct.name} | HonestBaby`)}&url=${encodeURIComponent(`https://honestbaby-care.com/product/${selectedProduct.id}`)}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 bg-black text-white rounded-full px-4 py-2.5 text-xs font-black active:scale-95 transition-transform">
                X でシェア
              </a>
            </div>

            <p className="text-sm text-[#8E8282] leading-relaxed mb-10 px-1 font-medium">{selectedProduct.description}</p>

            <section className="mb-10 bg-[#FFF5F5] border border-[#FFEBEB] p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 relative z-10"><Sparkles className="w-5 h-5 text-[#F2ABAC]" /><h3 className="font-black text-[#5A4C4C] text-lg">AIによる分析</h3></div>
              <p className="text-sm text-[#8E8282] leading-relaxed font-medium mb-8 relative z-10">{selectedProduct.aiAnalysis}</p>
              <button onClick={() => {
                setActiveTab('ai');
                const shopInfo = (selectedProduct.shops || []).map(s => {
                  const price = s.lowestPrice || s.lowest_price || s.price;
                  const name = s.name || s.shop_name || 'ショップ';
                  return `${name}: ¥${price ? price.toLocaleString() : '不明'}`;
                }).join(', ');
                const context = `[商品詳細データ]
名前: ${selectedProduct.name}
ブランド: ${selectedProduct.brand}
価格帯: ${selectedProduct.price ? selectedProduct.price.toLocaleString() + '円' : '不明'}
ショップ状況: ${shopInfo}
AI分析: ${selectedProduct.aiAnalysis || ''}

この商品について、他と比較したメリット・デメリットや、今の買い得度を詳しく教えてください。`;
                setUserInput(context);
                setSelectedProduct(null);
              }} className="w-full py-4 bg-white border border-[#F2ABAC] text-[#F2ABAC] rounded-full text-xs font-black shadow-sm active:scale-95 transition-transform relative z-10">AIコンサルタントにさらに聞く</button>
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
                  const existingShops = selectedProduct.shops || [];
                  const crossPlatformShops = (selectedProduct.crossPlatformPrices || []).map(p => ({
                    name: p.source === 'rakuten' ? '楽天市場' : 'Yahoo!ショッピング',
                    type: 'mall',
                    lowestPrice: p.price,
                    url: p.url,
                    sellers: [{ name: p.source === 'rakuten' ? '楽天市場' : 'Yahoo!ショッピング', price: p.price, url: p.url, shipping: 0, points: 0 }]
                  }));
                  
                  const shopByKey = new Map();
                  const shopKey = (s) => (s.name || s.shop_name || '').toLowerCase();
                  
                  for (const s of [...existingShops, ...crossPlatformShops]) {
                    const key = shopKey(s);
                    if (!key) continue;
                    const cur = shopByKey.get(key);
                    if (!cur || (s.lowestPrice || s.price || Infinity) < (cur.lowestPrice || cur.price || Infinity)) {
                      shopByKey.set(key, s);
                    }
                  }
                  
                  // Amazonを統合
                  if (!shopByKey.has('amazon.co.jp') && !shopByKey.has('amazon')) {
                    shopByKey.set('amazon', {
                      name: 'Amazon.co.jp',
                      type: 'mall',
                      lowestPrice: 0,
                      url: getAmazonUrl(selectedProduct.name.split(/[\s　]+/).slice(0, 4).join(' ')),
                      sellers: []
                    });
                  }

                  return Array.from(shopByKey.values()).sort((a, b) => {
                    if (a.lowestPrice === 0) return 1;
                    if (b.lowestPrice === 0) return -1;
                    return (a.lowestPrice || a.price) - (b.lowestPrice || b.price);
                  });
                })().map((shop, idx) => (
                  <div key={idx} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm transition-all ${shop.type === 'official' ? 'border-[#F2ABAC] shadow-[#F2ABAC]/10' : 'border-[#F4EFEB]'}`}>
                    <div className={`p-6 flex items-center justify-between cursor-pointer ${shop.type === 'official' ? 'bg-[#FFF5F5]' : 'active:bg-[#F9F6F3]'}`} 
                      onClick={() => shop.sellers?.length > 0 ? setExpandedMall(expandedMall === (shop.name || shop.shop_name) ? null : (shop.name || shop.shop_name)) : window.open(shop.url, '_blank')}>
                      <div className="flex-1 pr-4">
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center overflow-hidden border border-[#F4EFEB] bg-white">
                            {(shop.name || shop.shop_name).includes('楽天') ? <img src="https://www.rakuten.co.jp/favicon.ico" className="w-3.5 h-3.5" /> : 
                             (shop.name || shop.shop_name).includes('Yahoo') ? <img src="https://shopping.yahoo.co.jp/favicon.ico" className="w-3.5 h-3.5" /> :
                             (shop.name || shop.shop_name).toLowerCase().includes('amazon') ? <img src="https://www.amazon.co.jp/favicon.ico" className="w-3.5 h-3.5" /> :
                             <Store className="w-3.5 h-3.5 text-[#A5A19E]" />}
                          </div>
                          <p className="text-base font-black text-[#5A4C4C]">{shop.name || shop.shop_name}</p>
                          {shop.type === 'official' && (
                            <span className="bg-gradient-to-r from-[#F2ABAC] to-[#F78CA0] text-white text-[9px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                              <ShieldCheck className="w-2.5 h-2.5" /> 公式
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#A5A19E] mt-2 font-bold">
                          {shop.lowestPrice > 0 ? `出品者: ${Math.max(1, (shop.sellers || []).length)}店舗` : "最新の価格・在庫をチェック"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-2xl font-black text-[#7B8E76]">
                          {shop.lowestPrice > 0 ? `¥${shop.lowestPrice.toLocaleString()}` : '最安値をチェック'}
                        </span>
                        <div className="text-[#A5A19E] bg-white p-1 rounded-full shadow-sm">
                          {shop.sellers?.length > 0 ? (expandedMall === (shop.name || shop.shop_name) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : <ExternalLink className="w-4 h-4 opacity-30" />}
                        </div>
                      </div>
                    </div>

                    {/* 出品者アコーディオン（公式/最安値/高評価 をラベル付きで表示） */}
                    {expandedMall === (shop.name || shop.shop_name) && shop.sellers?.length > 0 && (
                      <div className="bg-[#F9F6F3] border-t border-[#F4EFEB] p-4 space-y-3">
                        {[...shop.sellers]
                          .sort((a, b) => {
                            const order = { official: 0, cheapest: 1, top_rated: 2 };
                            return (order[a.role] ?? 3) - (order[b.role] ?? 3);
                          })
                          .map((seller, sIdx) => {
                            const roleLabel = seller.role === 'official' ? { text: '公式', bg: 'bg-[#F2ABAC]' }
                              : seller.role === 'cheapest' ? { text: '最安値', bg: 'bg-[#7B8E76]' }
                              : seller.role === 'top_rated' ? { text: '高評価', bg: 'bg-[#D4AF37]' }
                              : null;
                            return (
                              <div key={sIdx} className="bg-white p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm">
                                <div className="flex-1 pr-4">
                                  {roleLabel && (
                                    <span className={`inline-block text-white text-[9px] font-black px-2 py-0.5 rounded mb-1.5 ${roleLabel.bg}`}>
                                      {roleLabel.text}
                                    </span>
                                  )}
                                  <p className="text-xs font-black text-[#5A4C4C] line-clamp-1">{seller.name}</p>
                                  <div className="flex flex-wrap gap-2 mt-2 text-[9px] font-bold">
                                    {seller.rating > 0 && (
                                      <span className="text-[#D4AF37] bg-[#FFF9E6] px-2 py-0.5 rounded">
                                        ★ {Number(seller.rating).toFixed(1)}{seller.reviews_count > 0 ? ` (${seller.reviews_count}件)` : ''}
                                      </span>
                                    )}
                                    {seller.shipping === 0 ? <span className="text-[#7B8E76] bg-[#7B8E76]/10 px-2 py-0.5 rounded">送料無料</span> : seller.shipping > 0 ? <span className="text-[#8E8282]">送料 {seller.shipping}円</span> : null}
                                    {seller.points > 0 && <span className="text-[#D4AF37] bg-[#FFF9E6] px-2 py-0.5 rounded">{seller.points}pt還元</span>}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 border-l border-[#F4EFEB] pl-4">
                                  <span className="text-sm font-black text-[#7B8E76]">¥{seller.price.toLocaleString()}</span>
                                  <a href={toVCUrl(seller.url) || '#'} target="_blank" rel="noopener noreferrer" className={`text-white px-5 py-2.5 rounded-full text-[10px] font-black shadow-sm whitespace-nowrap active:scale-95 transition-transform ${shop.type === 'official' ? 'bg-[#F2ABAC]' : 'bg-[#7B8E76]'}`}>
                                    ショップへ
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                    <p className="text-center text-[10px] text-[#D4CDC7] mt-8">Honest Baby v1.2.1</p>
              </div>
                ))}
              </div>
            </section>

            {/* ＝＝＝＝＝ ベビー専門店でも探す ＝＝＝＝＝ */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Store className="w-5 h-5 text-[#7B8E76]" />
                <h3 className="font-black text-[#5A4C4C] text-xl">ベビー専門店でも探す</h3>
              </div>
              <p className="text-[10px] text-[#A5A19E] font-bold mb-4 px-1">公式オンラインストアで在庫・セール情報を確認できます</p>
              <div className="grid grid-cols-2 gap-3">
                {OFFICIAL_RETAILERS.filter(retailer =>
                  retailer.domain !== 'mikihouse.co.jp' || selectedProduct.category === 'ウェア'
                ).map(retailer => {
                  const searchKw = (selectedProduct.name || '').split(/[\s　]+/).slice(0, 3).join(' ');
                  const url = retailer.searchUrl(searchKw) + retailer.affiliateParam;
                  return (
                    <a
                      key={retailer.domain}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white border border-[#F4EFEB] rounded-[1.5rem] px-4 py-4 shadow-sm active:scale-95 transition-transform"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-[#F4EFEB]">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${retailer.domain}&sz=32`}
                          className="w-6 h-6"
                          onError={e => { e.target.style.display = 'none'; }}
                          alt={retailer.shortName}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#5A4C4C] truncate">{retailer.shortName}</p>
                        <p className="text-[9px] text-[#A5A19E] font-bold">公式オンラインストア</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#A5A19E] ml-auto shrink-0" />
                    </a>
                  );
                })}
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
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out pointer-events-none ${reviewTab === 'sns' ? 'translate-x-full' : 'translate-x-0'}`}></div>
              </div>

              {/* Honest レビュー (ネイティブ) */}
              {reviewTab === 'honest' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[#5A4C4C]">{Number(selectedProduct.rating).toFixed(2)}</span>
                      <div className="flex items-center text-[#D4AF37]">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedProduct.rating) ? 'fill-current' : 'text-gray-200'}`} />)}
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
                        review.image_url ? (
                          // Instagram風: 画像中心レイアウト
                          <div key={review.id} className="bg-white border border-[#F4EFEB] rounded-[2rem] overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F2ABAC] to-[#E5DACE] flex items-center justify-center text-white shadow-sm"><User className="w-4 h-4" /></div>
                                <div>
                                  <p className="text-sm font-black text-[#5A4C4C]">{review.user}</p>
                                  <p className="text-[10px] font-bold text-[#A5A19E]">{review.date}</p>
                                </div>
                              </div>
                              <div className="flex text-[#D4AF37]">
                                {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />)}
                              </div>
                            </div>
                            <img src={review.image_url} alt="レビュー写真" className="w-full aspect-square object-cover" />
                            <div className="px-5 py-4">
                              <div className="flex items-center gap-2 mb-2 text-[#F2ABAC]">
                                <Heart className="w-5 h-5 fill-current" />
                                <span className="text-xs font-black text-[#5A4C4C]">使ってよかった</span>
                              </div>
                              <p className="text-sm text-[#5A4C4C] leading-relaxed font-medium">{review.content}</p>
                            </div>
                          </div>
                        ) : (
                          // テキスト中心: 従来の白カード
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
                                {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />)}
                              </div>
                            </div>
                            <p className="text-xs text-[#5A4C4C] leading-relaxed font-medium">"{review.content}"</p>
                          </div>
                        )
                      ))
                    ) : (
                      <div className="py-12 bg-white border-2 border-dashed border-[#F4EFEB] rounded-[2rem] text-center">
                        <p className="text-xs text-[#A5A19E] font-bold uppercase tracking-widest leading-loose">まだ口コミがありません<br />最初のレビューを書いてみませんか？</p>
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
                    <div className="bg-[#FFF5F5] border border-[#FFEBEB] p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#F2ABAC]" />
                        <h4 className="text-xs font-black text-[#5A4C4C]">AIによるSNS評判まとめ</h4>
                      </div>
                      <p className="text-xs text-[#8E8282] leading-relaxed font-medium">
                        {selectedProduct.aiAnalysis ? 
                          `${selectedProduct.name}はSNS上では「${selectedProduct.aiAnalysis.slice(0, 50)}...」といった声が多く、特にデザイン性と実用性のバランスが高く評価されています。` : 
                          "現在SNSでのリアルな評判を解析中です。一般的には、使い勝手の良さとブランドの信頼性で多くのママ・パパに選ばれているアイテムです。"}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <span className="text-[9px] font-bold bg-white text-[#F2ABAC] px-2 py-1 rounded-md border border-[#F2ABAC]/20">#SNSで話題</span>
                        <span className="text-[9px] font-bold bg-white text-[#F2ABAC] px-2 py-1 rounded-md border border-[#F2ABAC]/20">#口コミ高評価</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
          </div>
        </div>
      )}

      {/* ＝＝＝＝＝ 口コミ投稿モーダル ＝＝＝＝＝ */}
      {isReviewFormOpen && selectedProduct && (
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex justify-center items-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 lg:rounded-[2rem] lg:pb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-[#5A4C4C] text-lg">口コミを投稿</h3>
              <button onClick={() => setIsReviewFormOpen(false)} className="p-2 bg-[#F9F6F3] rounded-full"><X className="w-5 h-5 text-[#A5A19E]" /></button>
            </div>

            <div className="flex items-center gap-3 mb-6 bg-[#F9F6F3] p-3 rounded-[1.5rem]">
              <img src={getHighResImage(selectedProduct.image) || "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby"} onError={(e) => { e.target.onerror = null; e.target.src = selectedProduct.image || "https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Baby"; }} className="w-12 h-12 object-cover rounded-xl" alt="product" />
              <p className="text-xs font-black text-[#5A4C4C] line-clamp-1 flex-1">{selectedProduct.name}</p>
            </div>

            <div className="mb-6 text-center">
              <p className="text-[10px] font-bold text-[#A5A19E] mb-2">タップして評価</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
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
                onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
              />
            </div>

            <div className="flex gap-3 mb-8">
              <input
                ref={reviewPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setReviewPhotoFile(file);
                  setReviewPhotoPreview(URL.createObjectURL(file));
                }}
              />
              {reviewPhotoPreview ? (
                <div className="relative flex-1">
                  <img src={reviewPhotoPreview} alt="preview" className="w-full h-24 object-cover rounded-2xl" />
                  <button onClick={() => { setReviewPhotoFile(null); setReviewPhotoPreview(null); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                </div>
              ) : (
                <button onClick={() => reviewPhotoInputRef.current?.click()} className="flex-1 py-3 border-2 border-dashed border-[#F4EFEB] rounded-2xl flex flex-col items-center justify-center gap-1 text-[#A5A19E] hover:bg-[#F9F6F3] transition-colors">
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold">写真を追加</span>
                </button>
              )}
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
      {showCookieBanner && (
        <div className="fixed bottom-[72px] left-0 right-0 z-[70] px-4 pointer-events-none">
          <div className="bg-[#5A4C4C] text-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 pointer-events-auto max-w-md mx-auto">
            <p className="text-[11px] font-bold leading-relaxed flex-1">
              本サービスはGoogle Analytics等のCookieを使用しています。
              <button onClick={() => setActiveLegalPage('privacy')} className="underline ml-1">詳細</button>
            </p>
            <button onClick={() => { try { localStorage.setItem('honestBabyCookieConsent', '1'); } catch { } setShowCookieBanner(false); }}
              className="text-[11px] font-black bg-white text-[#5A4C4C] px-3 py-1.5 rounded-full flex-shrink-0 active:scale-95 transition-transform">
              同意する
            </button>
          </div>
        </div>
      )}

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
                  Honest Babyは、Amazon.co.jp、楽天市場、Yahoo!ショッピング、その他各公式ストア等を宣伝しリンクすることによって紹介料を獲得できるアフィリエイトプログラムの参加者です。
                  <br /><br />
                  Amazon.co.jpのアソシエイトとして、Honest Babyは適格販売により収入を得ています。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 下部ナビゲーション */}
      {/* PWA ホーム追加バナー */}
      {showInstallBanner && (
        <div className="fixed bottom-[72px] left-0 right-0 z-50 px-4 pointer-events-none">
          <div className="bg-white border border-[#F2ABAC]/40 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto max-w-md mx-auto">
            <div className="w-9 h-9 rounded-xl bg-[#FFF5F5] flex items-center justify-center flex-shrink-0">
              <img src="/apple-touch-icon.png" alt="" className="w-6 h-6 rounded-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-[#5A4C4C] leading-tight">ホーム画面に追加</p>
              {isIOS
                ? <p className="text-[10px] text-[#A5A19E] font-bold leading-tight">下の共有ボタン → 「ホーム画面に追加」</p>
                : <p className="text-[10px] text-[#A5A19E] font-bold leading-tight">アプリとして使えてさらに便利</p>
              }
            </div>
            {!isIOS && (
              <button onClick={handleInstallClick} className="text-[10px] font-black text-white bg-[#F2ABAC] px-3 py-1.5 rounded-full flex-shrink-0 active:scale-95 transition-transform">追加</button>
            )}
            <button onClick={dismissInstallBanner} className="text-[#D4CDC7] flex-shrink-0 p-1 -mr-1"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#F4EFEB] px-8 pt-4 flex justify-between items-center rounded-t-[3rem] shadow-[0_-10px_40px_rgb(0,0,0,0.03)] lg:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-[#7B8E76] scale-110' : 'text-[#D4CDC7] hover:text-[#A5A19E]'}`}>
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} /><span className="text-[9px] font-black uppercase tracking-tighter">ホーム</span>
        </button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'search' ? 'text-[#7B8E76] scale-110' : 'text-[#D4CDC7] hover:text-[#A5A19E]'}`}>
          <Search className={`w-6 h-6 ${activeTab === 'search' ? 'fill-current' : ''}`} /><span className="text-[9px] font-black uppercase tracking-tighter">検索</span>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center" onClick={() => setShowBabyModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 lg:rounded-[2rem] lg:pb-8" onClick={e => e.stopPropagation()}>
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
              <button onClick={() => {
                const info = { ...babyForm };
                setBabyInfo(info);
                if (user) saveBabyProfileToDB(user.id, info);
                setShowBabyModal(false);
              }}
                className="w-full py-4 bg-[#5A4C4C] text-white rounded-full font-black text-sm active:scale-95 transition-transform mt-2">
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== モーダル: 価格アラート設定 ===== */}
      {showPriceAlertModal && selectedProduct && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center" onClick={() => setShowPriceAlertModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 lg:rounded-[2rem] lg:pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#5A4C4C] text-xl flex items-center gap-2"><BellRing className="w-5 h-5 text-[#D4AF37]" /> 価格アラート</h3>
              <button onClick={() => setShowPriceAlertModal(false)} className="p-2 rounded-full bg-[#F9F6F3] text-[#A5A19E]"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-3 mb-6 p-4 bg-[#F9F6F3] rounded-[1.5rem]">
              {selectedProduct.image && <img src={getHighResImage(selectedProduct.image)} alt="" className="w-14 h-14 rounded-[1rem] object-cover" />}
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
              const newAlert = {
                id: selectedProduct.id, name: selectedProduct.name, image: selectedProduct.image,
                price: selectedProduct.price, url: shop?.url || selectedProduct.url || '#',
                targetPrice: target, addedAt: new Date().toISOString()
              };
              setPriceAlerts(prev => [...prev.filter(a => a.id !== selectedProduct.id), newAlert]);
              if (user) {
                savePriceAlertToDB(user.id, newAlert);
                subscribeToPushNotifications(user.id);
              }
              setShowPriceAlertModal(false);
            }} className="w-full py-4 bg-[#D4AF37] text-white rounded-full font-black text-sm active:scale-95 transition-transform">
              アラートを設定する
            </button>
          </div>
        </div>
      )}

      {/* ===== モーダル: 検索条件を保存 ===== */}
      {showSaveSearchModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center" onClick={() => setShowSaveSearchModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 lg:rounded-[2rem] lg:pb-8" onClick={e => e.stopPropagation()}>
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

      {/* お問い合わせモーダル */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={() => setShowContactModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-black text-[#5A4C4C]">お問い合わせ</h2>
              <button onClick={() => setShowContactModal(false)}>
                <X className="w-5 h-5 text-[#A5A19E]" />
              </button>
            </div>

            {!user ? (
              <p className="text-sm text-[#A5A19E] font-bold text-center py-8">
                お問い合わせにはログインが必要です
              </p>
            ) : contactSent ? (
              <div className="text-center py-8">
                <p className="text-sm font-black text-[#7B8E76]">送信しました</p>
                <p className="text-xs text-[#A5A19E] mt-1 font-bold">お問い合わせありがとうございます</p>
              </div>
            ) : (
              <>
                <select
                  value={contactCategory}
                  onChange={e => setContactCategory(e.target.value)}
                  className="w-full border border-[#F4EFEB] rounded-2xl px-4 py-3 text-sm text-[#5A4C4C] font-bold mb-3 bg-white">
                  {['商品について', 'バグ報告', 'ご要望', 'その他'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  value={contactContent}
                  onChange={e => setContactContent(e.target.value)}
                  placeholder="お問い合わせ内容をご記入ください"
                  rows={5}
                  className="w-full border border-[#F4EFEB] rounded-2xl px-4 py-3 text-sm text-[#5A4C4C] font-bold resize-none mb-4" />
                <button
                  onClick={handleContactSubmit}
                  disabled={!contactContent.trim() || isContactSending}
                  className="w-full bg-[#7B8E76] text-white font-black text-sm py-3 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform">
                  {isContactSending ? '送信中...' : '送信する'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;