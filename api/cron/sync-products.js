import { createClient } from '@supabase/supabase-js';

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
  "おむつ":       ["おむつ", "オムツ"],
  "ベビーカー":   ["ベビーカー", "バギー", "ストローラー"],
  "抱っこ紐":     ["抱っこ紐", "だっこひも", "スリング", "ヒップシート", "キャリア"],
  "ウェア":       ["ロンパース", "カバーオール", "肌着", "コンビ"],
  "ミルク・授乳": ["哺乳瓶", "搾乳", "授乳クッション", "母乳"],
  "離乳食・食器": ["離乳食", "ベビーフード", "ベビーチェア"],
  "寝具・ベッド": ["ベビーベッド", "布団", "スリーパー"],
  "おもちゃ":     ["おもちゃ", "知育", "ガラガラ", "メリー"],
  "安全グッズ":   ["ゲート", "コーナーガード", "ドアロック", "転倒防止"],
  "お風呂用品":   ["沐浴", "ベビーバス", "体温計", "保湿"],
  "トイレ用品":   ["おまる", "補助便座", "トイトレ"],
  "車用品":       ["チャイルドシート"],
  "マタニティ":   ["マタニティ", "妊娠", "授乳ブラ", "葉酸"],
  "ギフトセット": ["ギフト", "出産祝い"],
};

// 除外キーワード
const NG_KEYWORDS = [
  'ふるさと納税', 'ポイント消化', 'クーポン対象', 'お試しセット',
  '訳あり', 'アウトレット', '中古', 'リユース', 'メール便のみ'
];

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

// --- Yahoo API呼び出し（フォールバック用） ---
async function fetchYahooSearchFallback(keyword, category) {
  if (!YAHOO_CLIENT_ID) return [];
  
  let allHits = [];
  try {
    // 2ページ分（最大200件）取得して網羅性を高める
    for (let page = 1; page <= 2; page++) {
      const start = (page - 1) * 100;
      const url = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${YAHOO_CLIENT_ID}&query=${encodeURIComponent(keyword)}&results=100&start=${start}&sort=-review_count`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        allHits = [...allHits, ...(data.hits || [])];
      }
      await new Promise(r => setTimeout(r, 500)); // 連続アクセス防止
    }
    
    const requiredKws = REQUIRED_KEYWORDS[category] || [];
    
    return allHits
      .filter(item => !NG_KEYWORDS.some(kw => item.name.includes(kw)))
      .filter(item => requiredKws.length === 0 || requiredKws.some(kw => item.name.includes(kw)))
      .map(item => {
        const rawName = item.name;
        const name = cleanName(rawName);
        const brand = extractBrand(rawName);
        const unitCount = category === 'おむつ' ? parseDiaperCount(rawName) : null;
        let rawUrl = item.url || '';
        if (/yahoo\.co\.jp/.test(rawUrl)) {
          const sep = rawUrl.includes('?') ? '&' : '?';
          rawUrl = `${rawUrl}${sep}sc_e=afvc_shp_${VC_SID}`;
        }
        
        return {
          name,
          category,
          brand,
          image_url: item.image?.medium || '',
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
      });
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

  return items
    .filter(item => !NG_KEYWORDS.some(kw => item.Item.itemName.includes(kw)))
    .filter(item => requiredKws.length === 0 || requiredKws.some(kw => item.Item.itemName.includes(kw)))
    .map((item, idx) => {
      const rawName = item.Item.itemName;
      const name = cleanName(rawName);
      const brand = extractBrand(rawName);
      const unitCount = category === 'おむつ' ? parseDiaperCount(rawName) : null;
      const rawImg = item.Item.mediumImageUrls?.[0]?.imageUrl || '';

      return {
        name,
        category,
        brand,
        image_url: rawImg.replace(/_ex=\d+x\d+/, '_ex=400x400'),
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

// --- メイン同期処理 ---
async function syncCategory(cat, log) {
  log.push(`📦 カテゴリ「${cat.name}」の同期開始...`);

  if (!RAKUTEN_APP_ID) {
    log.push(`  ⚠️ RAKUTEN_APP_IDが設定されていません`);
  }

  let allItems = [];
  let rakutenFailed = false;

  try {
    // 検索API（レビュー数順、2ページ分）
    const res1 = await fetchRakutenSearch(cat.keyword, cat.genreId, 1);
    const res2 = await fetchRakutenSearch(cat.keyword, cat.genreId, 2);
    
    allItems = [
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
    allItems = [...allItems, ...rankingItems];
  } catch (e) {
    log.push(`  ⚠️ 楽天ランキングAPI失敗: ${e.message}`);
    rakutenFailed = true;
  }

  // 楽天が完全に失敗した場合はYahooから取得（フォールバック）
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

  // ブロックリスト取得
  const { data: blocklist } = await supabase.from('product_blocklist').select('item_code');
  const blockedCodes = new Set((blocklist || []).map(b => b.item_code));

  // タイムアウト回避のため、上位40件に限定
  const productsToProcess = deduplicated.slice(0, 40);
  log.push(`  ⏱ タイムアウト防止のため、上位 ${productsToProcess.length}件を処理します`);

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

      // --- Yahoo価格を取得（上位10件のみ詳細調査、それ以外はスキップして高速化） ---
      if (i < 10) {
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

      // APIレート制限対策: 1商品あたり少し待つ
      if (i % 5 === 4) await new Promise(r => setTimeout(r, 500));

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
  if (filterCat) {
    targetCategories = CATEGORIES.filter(c => c.name === filterCat);
    if (targetCategories.length === 0) {
      return res.status(400).json({ error: `Category "${filterCat}" not found` });
    }
    log.push(`🎯 フィルタ適用: カテゴリ「${filterCat}」のみ同期します`);
  }

  for (const cat of targetCategories) {
    try {
      const count = await syncCategory(cat, log);
      totalSaved += count;
    } catch (e) {
      log.push(`❌ カテゴリ「${cat.name}」で致命的エラー: ${e.message}`);
    }
  }

  log.push(`\n🎉 同期完了: 合計 ${totalSaved}件保存`);

  return res.status(200).json({
    success: true,
    totalSaved,
    log,
    timestamp: new Date().toISOString()
  });
}
