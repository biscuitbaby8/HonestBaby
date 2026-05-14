import { createClient } from '@supabase/supabase-js';
import { sendPushNotification, isPushConfigured } from '../lib/web-push.js';

// =============================================
// 夜間自動同期クローラー (Vercel Cron)
// 全カテゴリの楽天ランキング＋検索APIを巡回し、
// 商品データと各モール価格をSupabaseに自動保存する
// =============================================

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY || '';
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID || '';
const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID || process.env.VITE_YAHOO_CLIENT_ID;
const VC_SID = process.env.VITE_VC_SID || '3768537';

// カテゴリ定義（App.jsx の CATEGORY_TREE と同期）
const CATEGORIES = [
  { name: "おむつ",       genreId: "101070", keyword: "紙おむつ 赤ちゃん" },
  { name: "ベビーカー",   genreId: "501062", keyword: "ベビーカー" },
  { name: "抱っこ紐",     genreId: "209214", keyword: "抱っこ紐 新生児" },
  { name: "ウェア",       genreId: "110464", keyword: "ベビー服 赤ちゃん" },
  { name: "ミルク・授乳", genreId: "101077", keyword: "ベビー 哺乳瓶" },
  { name: "離乳食・食器", genreId: "101078", keyword: "離乳食 ベビーフード" },
  { name: "寝具・ベッド", genreId: "101071", keyword: "ベビーベッド 赤ちゃん布団" },
  { name: "おもちゃ",     genreId: "101074", keyword: "赤ちゃん おもちゃ 知育" },
  { name: "安全グッズ",   genreId: "101076", keyword: "ベビー 安全グッズ ゲート" },
  { name: "お風呂用品",   genreId: "101075", keyword: "ベビー お風呂 沐浴" },
  { name: "トイレ用品",   genreId: "101072", keyword: "ベビー おしりふき 赤ちゃん" },
  { name: "車用品",       genreId: "501063", keyword: "チャイルドシート 新生児" },
  { name: "マタニティ",   genreId: "101080", keyword: "マタニティ 妊娠" },
  { name: "ギフトセット", genreId: "101079", keyword: "出産祝い ギフトセット 赤ちゃん" },
];

// カテゴリ別のキーワードフィルタ（本体のみ残す）
const REQUIRED_KEYWORDS = {
  "おむつ":       ["おむつ", "オムツ", "おしりふき"],
  "ベビーカー":   ["ベビーカー", "バギー", "ストローラー"],
  "抱っこ紐":     ["抱っこ紐", "だっこひも", "スリング", "ヒップシート", "キャリア"],
  "ウェア":       ["ロンパース", "カバーオール", "肌着"],
  "ミルク・授乳": ["哺乳瓶", "搾乳", "授乳クッション", "母乳", "哺乳"],
  "離乳食・食器": ["離乳食", "ベビーフード", "ベビーチェア", "ベビー食器"],
  "寝具・ベッド": ["ベビーベッド", "布団", "スリーパー", "ベビー布団"],
  "おもちゃ":     ["おもちゃ", "知育", "ガラガラ", "メリー", "プレイマット"],
  "安全グッズ":   ["ゲート", "コーナーガード", "ドアロック", "転倒防止", "ベビーガード"],
  "お風呂用品":   ["沐浴", "ベビーバス", "体温計", "保湿", "ベビーソープ"],
  "トイレ用品":   ["おまる", "補助便座", "トイトレ", "おしりふき"],
  "車用品":       ["チャイルドシート", "ジュニアシート"],
  "マタニティ":   ["マタニティ", "妊娠", "授乳ブラ", "葉酸", "産前"],
  "ギフトセット": ["ギフト", "出産祝い", "プレゼント"],
};

// 除外キーワード（全カテゴリ共通）
const NG_KEYWORDS = [
  'ふるさと納税', 'ポイント消化', 'クーポン対象', 'お試しセット',
  '訳あり', 'アウトレット', '中古', 'リユース', 'メール便のみ',
  // ギフト専用商品（ホームのランキングには不要）
  'おむつケーキ', 'おむつタワー', 'おむつリース', 'おむつアート', 'おむつフラワー',
];

// カテゴリ別追加除外キーワード
const CATEGORY_NG_KEYWORDS = {
  "おむつ": [
    "大人用", "介護用", "失禁", "尿漏れ", "介護パンツ", "大人おむつ", "成人用", "シニア用",
    "大人", // 「大人のおむつ」等も除外
  ],
};

// Yahoo画像URLを標準サイズに正規化（/i/g/はショップ依存で低画質の場合あり）
function upgradeYahooImage(url) {
  if (!url) return url;
  return url.replace(/\/i\/[ngs]\//, '/i/j/');
}

// 商品名クリーニング
function cleanName(name) {
  return name
    .replace(/[【［\[「『〈《][^】］\]」』〉》]{0,60}[】］\]」』〉》]/g, '')
    .replace(/[★◆▼■●▲☆◇▽□○△♪♥♡※◎◯]+/g, '')
    .replace(/\s*(送料無料|あす楽|即納|限定|新品|正規品|公式|人気|売れ筋|ランキング1位).*$/g, '')
    .replace(/[\s　]+/g, ' ')
    .trim()
    .slice(0, 80);
}

// ブランド名推定
function extractBrand(itemName) {
  const brands = [
    'パンパース', 'メリーズ', 'ムーニー', 'グーン', 'マミーポコ',
    'コンビ', 'アップリカ', 'ピジョン', 'エルゴベビー', 'ベビービョルン',
    'サイベックス', 'ジョイー', 'エアバギー', 'グレコ', 'カトージ',
    'リッチェル', 'コンビ', 'ミキハウス', 'ファミリア', '西松屋',
    'アカチャンホンポ', 'ユニクロ', 'ナイキ', 'ニューバランス',
    'ビーンスターク', '和光堂', 'キューピー', 'まるごと鶏レバー',
    'タカタ', 'レカロ', 'ブリタックス', 'マキシコシ', 'ネビオ',
    'ボバ', 'ナップナップ', 'ベビーアムール', 'ケラッタ'
  ];
  for (const brand of brands) {
    if (itemName.includes(brand)) return brand;
  }
  return '';
}

// おむつ枚数パーサー
function parseDiaperCount(name) {
  const packMatch = name.match(/(\d+)枚[×x＊*](\d+)/);
  if (packMatch) return parseInt(packMatch[1]) * parseInt(packMatch[2]);
  const m = name.match(/(\d+)枚/);
  return m ? parseInt(m[1]) : null;
}

// サブカテゴリ推定ロジック
function extractSubCategory(category, itemName) {
  const rules = {
    "おむつ": [
      { match: /パンツ/, sub: "パンツタイプ" },
      { match: /テープ/, sub: "テープタイプ" },
      { match: /おしりふき/, sub: "おしりふき" },
    ],
    "ベビーカー": [
      // 周辺グッズを先に判定（本体より優先）
      { match: /レインカバー|雨カバー|防雨カバー/, sub: "周辺グッズ" },
      { match: /ドリンクホルダー|カップホルダー|スマホホルダー|スマートフォンホルダー/, sub: "周辺グッズ" },
      { match: /フットマフ|ハンドルカバー|バンパーバー|サンキャノピー|サンシェード/, sub: "周辺グッズ" },
      { match: /フック|収納ポーチ|サイドバッグ|アームバー/, sub: "周辺グッズ" },
      { match: /よだれカバー|防寒ケープ|ベビーカーシート|シートカバー/, sub: "周辺グッズ" },
      { match: /AB型|ＡＢ型/, sub: "AB型" },
      { match: /[AＡ]型/, sub: "A型" },
      { match: /[BＢ]型/, sub: "B型" },
      { match: /バギー/, sub: "バギー" },
    ],
    "抱っこ紐": [
      // 周辺グッズを先に判定
      { match: /よだれパッド|ケープ|抱っこ紐カバー|防寒カバー/, sub: "周辺グッズ" },
      { match: /スリング/, sub: "スリング" },
      { match: /ヒップシート/, sub: "ヒップシート" },
    ],
    "車用品": [
      { match: /ジュニアシート/, sub: "ジュニアシート" },
      { match: /新生児/, sub: "新生児用" },
    ]
  };

  const catRules = rules[category];
  if (catRules) {
    for (const r of catRules) {
      if (r.match.test(itemName)) return r.sub;
    }
  }
  return "本体"; // デフォルト
}

// --- 楽天API呼び出し（リトライ付き） ---
async function fetchWithRetry(url, maxRetries = 1) {
  for (let i = 0; i <= maxRetries; i++) {
    const res = await fetch(url, {
      headers: { 'Referer': 'https://honestbaby-care.com', 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.ok) return res.json();
    
    // 403 (Invalid Key) の場合は即座にエラーにしてリトライしない（Vercelの60秒タイムアウト防止）
    if (res.status === 403) {
      throw new Error(`API Error 403: Forbidden or Invalid Key`);
    }

    if (res.status === 429 && i < maxRetries) {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
    throw new Error(`API Error ${res.status}`);
  }
}

async function fetchRakutenSearch(keyword, genreId, page = 1) {
  const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401?applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}&keyword=${encodeURIComponent(keyword)}&sort=-reviewCount&hits=30&page=${page}&availability=1&genreId=${genreId}&affiliateId=${RAKUTEN_AFFILIATE_ID}`;
  return fetchWithRetry(url);
}

async function fetchRakutenRanking(genreId) {
  const url = `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?format=json&applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}&genreId=${genreId}&affiliateId=${RAKUTEN_AFFILIATE_ID}`;
  return fetchWithRetry(url);
}

// --- Yahoo商品データを正規化（共通化） ---
function normalizeYahooItem(item, category) {
  const rawName = item.name;
  const name = cleanName(rawName);
  const brand = extractBrand(rawName);
  const subCategory = extractSubCategory(category, rawName);
  const unitCount = category === 'おむつ' ? parseDiaperCount(rawName) : null;
  let rawUrl = item.url || '';
  if (/yahoo\.co\.jp/.test(rawUrl)) {
    const sep = rawUrl.includes('?') ? '&' : '?';
    rawUrl = `${rawUrl}${sep}sc_e=afvc_shp_${VC_SID}`;
  }
  return {
    name,
    category,
    sub_category: subCategory,
    brand,
    image_url: upgradeYahooImage(item.image?.large || item.image?.medium || ''),
    rating: parseFloat(item.review?.rate) || 0,
    reviews_count: parseInt(item.review?.count) || 0,
    rakuten_item_code: `yahoo-${item.code}`,
    is_market_wide: true,
    unit_count: unitCount,
    unit_name: unitCount ? '枚' : null,
    last_synced_at: new Date().toISOString(),
    _rakuten_shop: {
      shop_name: item.seller?.name || 'Yahoo!ショッピング',
      price: item.price,
      url: rawUrl,
      shipping: item.shipping?.code === 2 ? 0 : null,
      points: 0,
    }
  };
}

// --- Yahoo常時補完取得（楽天と並行して市場網羅を高める。1ページ50件） ---
async function fetchYahooSupplement(keyword, category) {
  if (!YAHOO_CLIENT_ID) return [];
  try {
    const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${YAHOO_CLIENT_ID}&query=${encodeURIComponent(keyword)}&results=50&sort=-review_count`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || [])
      .filter(item => !NG_KEYWORDS.some(kw => (item.name || '').includes(kw)))
      .map(item => normalizeYahooItem(item, category));
  } catch {
    return [];
  }
}

// --- Yahoo API呼び出し（楽天全滅時のフォールバック用、3ページ網羅） ---
async function fetchYahooSearchFallback(keyword, category) {
  if (!YAHOO_CLIENT_ID) return [];
  let allHits = [];
  try {
    for (let page = 1; page <= 3; page++) {
      const start = (page - 1) * 100;
      const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${YAHOO_CLIENT_ID}&query=${encodeURIComponent(keyword)}&results=100&start=${start}&sort=-review_count`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        allHits = [...allHits, ...(data.hits || [])];
      }
      await new Promise(r => setTimeout(r, 300));
    }
    return allHits
      .filter(item => !NG_KEYWORDS.some(kw => item.name.includes(kw)))
      .map(item => normalizeYahooItem(item, category));
  } catch {
    return [];
  }
}

// --- Yahoo API呼び出し（価格取得用） ---
async function fetchYahooPrice(keyword) {
  if (!YAHOO_CLIENT_ID) return [];
  const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${YAHOO_CLIENT_ID}&query=${encodeURIComponent(keyword)}&results=5&sort=-review_count`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || []).map(item => {
      let rawUrl = item.url || '';
      if (/yahoo\.co\.jp/.test(rawUrl)) {
        const sep = rawUrl.includes('?') ? '&' : '?';
        rawUrl = `${rawUrl}${sep}sc_e=afvc_shp_${VC_SID}`;
      }
      return {
        name: item.seller?.name || 'Yahoo!ショッピング',
        price: item.price,
        url: rawUrl,
        source: 'yahoo'
      };
    });
  } catch {
    return [];
  }
}

// --- 楽天の検索結果を正規化 ---
function normalizeRakutenItems(items, category) {
  const requiredKws = REQUIRED_KEYWORDS[category] || [];
  const extraNG = CATEGORY_NG_KEYWORDS[category] || [];

  return items
    .filter(item => !NG_KEYWORDS.some(kw => item.Item.itemName.includes(kw)))
    .filter(item => extraNG.length === 0 || !extraNG.some(kw => item.Item.itemName.includes(kw)))
    .filter(item => requiredKws.length === 0 || requiredKws.some(kw => item.Item.itemName.includes(kw)))
    .map((item, idx) => {
      const rawName = item.Item.itemName;
      const name = cleanName(rawName);
      const brand = extractBrand(rawName);
      const subCategory = extractSubCategory(category, rawName);
      const unitCount = category === 'おむつ' ? parseDiaperCount(rawName) : null;
      const rawImg = item.Item.largeImageUrls?.[0]?.imageUrl
        || item.Item.mediumImageUrls?.[0]?.imageUrl || '';

      return {
        name,
        category,
        sub_category: subCategory,
        brand,
        image_url: rawImg.replace(/_ex=\d+x\d+/, '_ex=640x640'),
        rating: parseFloat(item.Item.reviewAverage) || 0,
        reviews_count: parseInt(item.Item.reviewCount) || 0,
        rakuten_item_code: item.Item.itemCode,
        is_market_wide: true,
        unit_count: unitCount,
        unit_name: unitCount ? '枚' : null,
        last_synced_at: new Date().toISOString(),
        // ショップ情報（後でshops_pricesに保存）
        _rakuten_shop: {
          shop_name: item.Item.shopName || '楽天市場',
          price: item.Item.itemPrice,
          url: item.Item.affiliateUrl || item.Item.itemUrl,
          shipping: item.Item.postageFlag === 1 ? 0 : null,
          points: item.Item.pointRate || 0,
        }
      };
    });
}

// --- 重複統合（同名商品をマージ）---
function deduplicateProducts(products) {
  const map = new Map();
  for (const p of products) {
    const key = p.name.replace(/[\s　]/g, '').toLowerCase().slice(0, 30);
    if (!map.has(key)) {
      map.set(key, p);
    } else {
      const existing = map.get(key);
      // レビュー数が多い方を優先
      if (p.reviews_count > existing.reviews_count) {
        map.set(key, { ...p });
      }
    }
  }
  return Array.from(map.values());
}

// --- 商品名キー化（重複判定用） ---
function productNameKey(name) {
  return (name || '').replace(/[\s　]/g, '').toLowerCase().slice(0, 30);
}

// --- メイン同期処理 ---
async function syncCategory(cat, log, opts = {}) {
  const {
    limitCount = 30,
    includeYahooSupplement = true,
    includeYahooPrice = true,
  } = opts;

  log.push(`📦 カテゴリ「${cat.name}」の同期開始...`);

  if (!RAKUTEN_APP_ID) {
    log.push(`  ⚠️ RAKUTEN_APP_IDが設定されていません`);
  }

  let rakutenItems = [];
  let rakutenFailed = false;

  try {
    // 検索API（レビュー数順、2ページ分）
    const res1 = await fetchRakutenSearch(cat.keyword, cat.genreId, 1);
    const res2 = await fetchRakutenSearch(cat.keyword, cat.genreId, 2);
    rakutenItems = [
      ...normalizeRakutenItems(res1.Items || [], cat.name),
      ...normalizeRakutenItems(res2.Items || [], cat.name),
    ];
  } catch (e) {
    log.push(`  ⚠️ 楽天検索API失敗: ${e.message}`);
    rakutenFailed = true;
  }

  // ランキングAPIも追加取得
  try {
    const rankingData = await fetchRakutenRanking(cat.genreId);
    const rankingItems = normalizeRakutenItems(rankingData.Items || [], cat.name);
    rakutenItems = [...rakutenItems, ...rankingItems];
  } catch (e) {
    log.push(`  ⚠️ 楽天ランキングAPI失敗: ${e.message}`);
    rakutenFailed = true;
  }

  let allItems = [...rakutenItems];

  // Yahoo常時補完（楽天と重複しない商品だけ追加。市場網羅を高める）
  if (includeYahooSupplement && !rakutenFailed && rakutenItems.length > 0) {
    try {
      const yahooSupp = await fetchYahooSupplement(cat.keyword, cat.name);
      const rakutenKeys = new Set(rakutenItems.map(p => productNameKey(p.name)));
      const yahooUnique = yahooSupp.filter(p => !rakutenKeys.has(productNameKey(p.name)));
      log.push(`  🛒 楽天 ${rakutenItems.length}件 + Yahoo独占 ${yahooUnique.length}件（${yahooSupp.length - yahooUnique.length}件は楽天と重複のため除外）`);
      allItems = [...allItems, ...yahooUnique];
    } catch (e) {
      log.push(`  ⚠️ Yahoo補完取得失敗: ${e.message}`);
    }
  }

  // 楽天が完全に失敗した場合はYahoo全件フォールバック
  if (allItems.length === 0 && rakutenFailed) {
    log.push(`  🔄 楽天API全滅のため、YahooショッピングAPIから代替取得を試みます...`);
    const yahooItems = await fetchYahooSearchFallback(cat.keyword, cat.name);
    if (yahooItems.length > 0) {
      log.push(`  ✅ Yahoo APIから ${yahooItems.length}件 取得成功`);
      allItems = yahooItems;
    } else {
      log.push(`  ⚠️ Yahoo APIからも取得できませんでした`);
    }
  }

  if (allItems.length === 0) {
    log.push(`  ❌ 商品0件、スキップ`);
    return 0;
  }

  // 重複統合
  const deduplicated = deduplicateProducts(allItems);
  log.push(`  📊 ${allItems.length}件 → 重複統合後 ${deduplicated.length}件`);

  let savedCount = 0;

  // ブロック済み商品コードを取得（is_blocked=true の rakuten_item_code）
  const { data: blocklist } = await supabase
    .from('products')
    .select('rakuten_item_code')
    .eq('is_blocked', true);
  const blockedCodes = new Set((blocklist || []).map(b => b.rakuten_item_code).filter(Boolean));

  const productsToProcess = deduplicated.slice(0, limitCount);
  log.push(`  ⏱ 上位 ${productsToProcess.length}件を保存します`);

  for (let i = 0; i < productsToProcess.length; i++) {
    const product = productsToProcess[i];
    product.popularity_rank = i + 1;

    // ブロックリストチェック
    if (blockedCodes.has(product.rakuten_item_code)) continue;

    const shopInfo = product._rakuten_shop;
    delete product._rakuten_shop;

    try {
      // 既存商品をrakuten_item_codeで検索
      let productId;
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('rakuten_item_code', product.rakuten_item_code)
        .single();

      if (existing) {
        // 更新
        productId = existing.id;
        await supabase
          .from('products')
          .update({
            name: product.name,
            image_url: product.image_url,
            rating: product.rating,
            reviews_count: product.reviews_count,
            popularity_rank: product.popularity_rank,
            sub_category: product.sub_category,
            brand: product.brand || undefined,
            last_synced_at: product.last_synced_at,
          })
          .eq('id', productId);
      } else {
        // 新規挿入
        const { data: inserted, error: insertError } = await supabase
          .from('products')
          .insert([product])
          .select('id');

        if (insertError) {
          log.push(`  ❌ 挿入エラー: ${insertError.message}`);
          continue;
        }
        productId = inserted[0].id;
      }

      // --- 楽天ショップ情報をshops_pricesに保存 ---
      await supabase
        .from('shops_prices')
        .upsert([{
          product_id: productId,
          shop_name: shopInfo.shop_name,
          shop_type: 'mall',
          lowest_price: shopInfo.price,
          source: 'rakuten',
          sellers: JSON.stringify([{
            name: shopInfo.shop_name,
            price: shopInfo.price,
            shipping: shopInfo.shipping ?? 0,
            points: shopInfo.points ?? 0,
            url: shopInfo.url,
            note: ''
          }])
        }], { onConflict: 'product_id,shop_name', ignoreDuplicates: false });

      // --- Yahoo価格を取得（上位5件のみ詳細調査） ---
      if (includeYahooPrice && i < 5) {
        const searchKeyword = product.name.split(/[\s　]+/).slice(0, 3).join(' ');
        const yahooResults = await fetchYahooPrice(searchKeyword);

        if (yahooResults.length > 0) {
          // 最安値のものを選択
          const best = yahooResults.sort((a, b) => a.price - b.price)[0];
          await supabase
            .from('shops_prices')
            .upsert([{
              product_id: productId,
              shop_name: best.name || 'Yahoo!ショッピング',
              shop_type: 'mall',
              lowest_price: best.price,
              source: 'yahoo',
              sellers: JSON.stringify([{
                name: best.name || 'Yahoo!ショッピング',
                price: best.price,
                shipping: 0,
                points: 0,
                url: best.url,
                note: ''
              }])
            }], { onConflict: 'product_id,shop_name', ignoreDuplicates: false });
        }
      }

      savedCount++;

      // APIレート制限対策: 10商品ごとに少し待つ
      if (i % 10 === 9) await new Promise(r => setTimeout(r, 300));

    } catch (e) {
      log.push(`  ⚠️ ${product.name.slice(0, 20)}... エラー: ${e.message}`);
    }
  }

  log.push(`  ✅ ${savedCount}件保存完了`);
  return savedCount;
}

// --- Vercel Cron エンドポイント ---
export default async function handler(req, res) {
  // Cron認証（Vercel Cronは CRON_SECRET ヘッダーを送信する）
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];

  // 手動実行（?manual=1）またはCron認証
  const isManual = req.query.manual === '1';
  const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isManual && !isCronAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const log = [];
  log.push(`🚀 同期開始: ${new Date().toISOString()}`);

  let totalSaved = 0;

  let targetCategories = CATEGORIES;
  const filterCat = req.query.category;
  const batch = req.query.batch; // '1' or '2'

  if (filterCat) {
    targetCategories = CATEGORIES.filter(c => c.name === filterCat);
    if (targetCategories.length === 0) {
      return res.status(400).json({ error: `Category "${filterCat}" not found` });
    }
    log.push(`🎯 フィルタ適用: カテゴリ「${filterCat}」のみ同期します`);
  } else if (batch === '1') {
    // 前半7カテゴリ（60秒制限内に確実に収めるため2分割）
    targetCategories = CATEGORIES.slice(0, 7);
    log.push(`📦 バッチ1: ${targetCategories.map(c => c.name).join('、')}`);
  } else if (batch === '2') {
    targetCategories = CATEGORIES.slice(7);
    log.push(`📦 バッチ2: ${targetCategories.map(c => c.name).join('、')}`);
  }

  // カテゴリ指定あり = 単発テスト用（軽量処理）、それ以外 = 通常同期（フル処理）
  const isSingleCategory = !!filterCat;
  const opts = isSingleCategory
    ? { limitCount: 20, includeYahooSupplement: false, includeYahooPrice: false }
    : { limitCount: 15, includeYahooSupplement: true, includeYahooPrice: false };

  for (const cat of targetCategories) {
    try {
      const count = await syncCategory(cat, log, opts);
      totalSaved += count;
    } catch (e) {
      log.push(`❌ カテゴリ「${cat.name}」で致命的エラー: ${e.message}`);
    }
  }

  log.push(`\n🎉 同期完了: 合計 ${totalSaved}件保存`);

  // 価格アラートのトリガー判定 + Push通知送信
  try {
    const notifyResult = await checkAndNotifyPriceAlerts();
    log.push(`🔔 アラート確認: ${notifyResult.checked}件中 ${notifyResult.triggered}件トリガー、${notifyResult.pushed}件にプッシュ送信`);
  } catch (e) {
    log.push(`⚠️ アラート確認失敗: ${e.message}`);
  }

  return res.status(200).json({
    success: true,
    totalSaved,
    log,
    timestamp: new Date().toISOString()
  });
}

// --- 価格アラートをチェックし、トリガーしたらPush通知を送る ---
async function checkAndNotifyPriceAlerts() {
  let checked = 0, triggered = 0, pushed = 0;

  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('*')
    .is('triggered_at', null);
  if (!alerts || alerts.length === 0) return { checked: 0, triggered: 0, pushed: 0 };

  checked = alerts.length;

  for (const alert of alerts) {
    // product_code から products.id を解決
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alert.product_code);
    const { data: product } = isUuid
      ? await supabase.from('products').select('id').eq('id', alert.product_code).maybeSingle()
      : await supabase.from('products').select('id').eq('rakuten_item_code', alert.product_code).maybeSingle();
    if (!product) continue;

    // 最安値を取得
    const { data: prices } = await supabase
      .from('shops_prices')
      .select('lowest_price')
      .eq('product_id', product.id);
    if (!prices || prices.length === 0) continue;
    const minPrice = Math.min(...prices.map(p => p.lowest_price).filter(p => p > 0));
    if (!isFinite(minPrice)) continue;
    if (minPrice > alert.target_price) continue;

    // トリガー！
    triggered++;
    await supabase.from('price_alerts')
      .update({ triggered_at: new Date().toISOString(), current_price: minPrice })
      .eq('id', alert.id);

    // Push通知送信
    if (!isPushConfigured()) continue;
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', alert.user_id);
    if (!subs) continue;

    for (const sub of subs) {
      const result = await sendPushNotification(sub, {
        title: '値下がりしました！',
        body: `${alert.product_name} が ¥${minPrice.toLocaleString()} に（目標 ¥${alert.target_price.toLocaleString()}）`,
        icon: alert.image_url || '/favicon.png',
        image: alert.image_url,
        url: alert.affiliate_url || '/',
        tag: `price-alert-${alert.id}`,
      });
      if (result.ok) {
        pushed++;
      } else if (result.statusCode === 410 || result.statusCode === 404) {
        // 期限切れ購読は削除
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return { checked, triggered, pushed };
}
