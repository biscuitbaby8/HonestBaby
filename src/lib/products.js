// 共有データユーティリティ（サーバー/クライアント両用、Reactに依存しない）
// SSRページ（app/category, app/product）と ProductCard で利用する。

export const CATEGORY_TREE = [
  { name: "すべて", id: "100533", keyword: "", subs: [] },
  {
    name: "おむつ", id: "205197", keyword: "おむつ", subs: [
      { name: "テープタイプ", subsubs: ["新生児", "S", "M", "L", "BIG", "BIGより大きい"] },
      { name: "パンツタイプ", subsubs: ["S", "M", "L", "BIG", "BIGより大きい"] },
      { name: "夜用おむつ", subsubs: ["M", "L", "BIG", "BIGより大きい"] },
      { name: "おしりふき" },
      { name: "ゴミ箱・袋", subsubs: ["おむつポット", "防臭袋"] },
    ]
  },
  { name: "ベビーカー", id: "200833", keyword: "ベビーカー", subs: ["A型", "B型", "AB型", "バギー", "周辺グッズ"] },
  { name: "抱っこ紐", id: "412209", keyword: "抱っこ紐", subs: ["縦抱き", "横抱き", "スリング", "ヒップシート", "周辺グッズ"] },
  { name: "ウェア", id: "111102", keyword: "ベビー服", subs: ["ロンパース", "カバーオール", "肌着", "アウター", "スタイ"] },
  { name: "ミルク・授乳", id: "205208", keyword: "ミルク 授乳", subs: ["ミルク", "哺乳瓶", "搾乳器", "授乳クッション", "母乳パッド"] },
  { name: "離乳食・食器", id: "213980", keyword: "離乳食", subs: ["ベビーフード", "食器セット", "ベビーチェア", "スプーン"] },
  { name: "寝具・ベッド", id: "200822", keyword: "ベビーベッド", subs: ["ベビーベッド", "ベビー布団", "スリーパー", "まくら"] },
  { name: "おもちゃ", id: "201591", keyword: "おもちゃ", subs: ["0ヶ月〜", "3ヶ月〜", "6ヶ月〜", "1歳〜"] },
  // 絵本: 楽天では「本・雑誌・コミック」ジャンル配下のため、ベビー用品ジャンル(100533)
  // 直下にIDを持たせず、レンタルと同様にキーワードマッチで関連性を担保する
  { name: "絵本", id: null, keyword: "絵本 赤ちゃん", subs: ["0歳〜", "1歳〜", "2歳〜", "しかけ絵本"] },
  { name: "安全グッズ", id: "200841", keyword: "ベビーゲート", subs: ["ベビーゲート", "コーナーガード", "扉ロック", "転倒防止", "ベビーモニター"] },
  { name: "お風呂用品", id: "200815", keyword: "ベビー お風呂", subs: ["ベビーバス", "ベビー用ソープ", "保湿クリーム"] },
  { name: "トイレ用品", id: "200819", keyword: "おまる", subs: ["補助便座", "おまる", "トイトレ", "おしりふき"] },
  { name: "車用品", id: "566088", keyword: "チャイルドシート", subs: ["新生児用", "1歳以上", "ジュニアシート", "2wayタイプ", "周辺グッズ"] },
  { name: "マタニティ", id: "553946", keyword: "マタニティ", subs: ["マタニティウェア", "腹帯", "葉酸サプリ", "授乳ブラ", "ノンカフェイン"] },
  { name: "ギフトセット", id: "205222", keyword: "出産祝い ギフト", subs: ["ロンパース・服", "おもちゃ", "スキンケア", "タオル・スタイ", "食器・哺乳瓶", "ブランドギフト"] },
  // レンタル: 単一ジャンルに集約されていないため genreId は持たせず、
  // keyword + サブカテゴリのキーワードマッチで関連性を担保する
  { name: "レンタル", keyword: "ベビー用品 レンタル", subs: ["ベビーカー", "チャイルドシート", "ベビーベッド", "抱っこ紐", "おもちゃ"] },
];

export const CATEGORIES = CATEGORY_TREE.map((c) => c.name);

// カテゴリ別 月齢→サブカテゴリ提案（おむつのサイズ、ベビーカー・車用品のタイプ切り替えなど）
// sub: 設定するサブカテゴリ（nullなら変更しない）/ subsub: 設定するサブサブカテゴリ（nullなら変更しない）
export const CATEGORY_AGE_SUGGESTIONS = {
  'おむつ': [
    { maxM: 1,   sub: 'テープタイプ', subsub: '新生児', label: '新生児サイズ' },
    { maxM: 5,   sub: 'テープタイプ', subsub: 'S',      label: 'Sサイズ' },
    { maxM: 13,  sub: null,           subsub: 'M',      label: 'Mサイズ' },
    { maxM: 25,  sub: null,           subsub: 'L',      label: 'Lサイズ' },
    { maxM: 999, sub: null,           subsub: 'BIG',    label: 'BIGサイズ' },
  ],
  'ベビーカー': [
    { maxM: 7,   sub: 'A型', subsub: null, label: 'A型' },
    { maxM: 999, sub: 'B型', subsub: null, label: 'B型' },
  ],
  '車用品': [
    { maxM: 12,  sub: '新生児用', subsub: null, label: '新生児用チャイルドシート' },
    { maxM: 999, sub: '1歳以上', subsub: null, label: '1歳以上向けチャイルドシート' },
  ],
};

// 後方互換: 既存コードからの参照用（おむつ専用の旧名称）
export const DIAPER_SIZE_BY_AGE = CATEGORY_AGE_SUGGESTIONS['おむつ'];

// カテゴリごとの SEO メタ情報（タイトル・説明）
export const CAT_META = {
  'おむつ':       { title: 'おむつ比較・おすすめランキング', desc: 'テープ・パンツ・布おむつをパパママの口コミと価格で徹底比較。' },
  'ベビーカー':   { title: 'ベビーカー比較・おすすめランキング', desc: 'A型・B型・バギー・二人乗りをタイプ別に徹底比較。最安値もチェック。' },
  '抱っこ紐':     { title: '抱っこ紐比較・おすすめランキング', desc: 'エルゴ・コニー・スリングなど人気ブランドを口コミ・価格で比較。' },
  'ウェア':       { title: 'ベビー服・ウェア比較', desc: 'ロンパース・カバーオール・肌着をブランド・価格で比較。' },
  'ミルク・授乳': { title: 'ミルク・授乳グッズ比較', desc: '哺乳瓶・粉ミルク・搾乳器をパパママの口コミで比較。' },
  '離乳食・食器': { title: '離乳食・食器比較', desc: 'ベビーフード・食器セット・ベビーチェアを口コミ・価格で比較。' },
  '寝具・ベッド': { title: 'ベビーベッド・寝具比較', desc: 'ベビーベッド・ベビー布団・スリーパーを安全性・価格で比較。' },
  'おもちゃ':     { title: 'ベビーおもちゃ比較・おすすめ', desc: '知育玩具・メリー・ぬいぐるみを月齢・口コミで比較。' },
  '絵本':         { title: 'ベビー絵本比較・おすすめ', desc: 'しかけ絵本・知育絵本を月齢・口コミで比較。' },
  '安全グッズ':   { title: 'ベビー安全グッズ比較', desc: 'ベビーゲート・コーナーガード・ベビーモニターを口コミ・価格で比較。' },
  'お風呂用品':   { title: 'ベビーお風呂用品比較', desc: 'ベビーバス・ソープ・保湿クリームを口コミ・価格で比較。' },
  'トイレ用品':   { title: 'トイトレグッズ比較', desc: '補助便座・おまる・おしりふきをパパママの口コミで比較。' },
  '車用品':       { title: 'チャイルドシート比較・おすすめ', desc: '新生児用・1歳以上・ジュニアシートを安全性・価格で徹底比較。' },
  'マタニティ':   { title: 'マタニティグッズ比較', desc: 'マタニティウェア・腹帯・葉酸サプリを口コミ・価格で比較。' },
  'ギフトセット': { title: '出産祝い・ベビーギフト比較', desc: '出産祝い・誕生日ギフト・名入れギフトをシーン別に比較。' },
  'ゴミ箱・袋':   { title: 'おむつゴミ箱・防臭袋比較', desc: 'おむつポット・防臭袋・サニタリーボックスを口コミ・価格で比較。' },
  'レンタル':     { title: 'ベビー用品レンタル比較', desc: 'ベビーカー・チャイルドシート・ベビーベッドなど、楽天市場のレンタルサービスを比較。短い期間しか使わないアイテムはレンタルがお得です。' },
};

// 楽天・Yahoo由来の商品名は【送料無料】等の販促ノイズで長くなりがちで、
// そのまま<title>に使うと全商品ページが類似タイトルになりCTRも下がる。
// 販促ブロックだけを除去し、長すぎる場合は語境界で切り詰める（SEO用）。
const PROMO_WORDS_RE = /(送料無料|ポイント\d*倍|クーポン|あす楽|即納|翌日発送|正規品|公式|ラッピング|のし|熨斗|母の日|父の日|ギフト対応|ランキング\d*位|楽天\S*1位|SALE|セール|期間限定|割引|%OFF|お買い物マラソン|スーパーセール|レビュー特典|プレゼント付き?)/i;
export const cleanProductName = (name, maxLen = 50) => {
  let n = String(name || '');
  n = n.replace(/[【\[（(]([^】\]）)]*)[】\]）)]/g, (m, inner) =>
    PROMO_WORDS_RE.test(inner) ? ' ' : m
  );
  n = n.replace(/\s+/g, ' ').trim();
  if (n.length > maxLen) {
    const cut = n.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(' ');
    n = (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
  }
  return n || String(name || '');
};

export const getHighResImage = (url) => {
  if (!url) return 'https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby';
  try {
    if (url.indexOf('rakuten.co.jp') !== -1) {
      return url.split('?_ex=')[0] + '?_ex=1000x1000';
    }
    if (url.indexOf('yimg.jp') !== -1) {
      // /i/j/ は存在しないショップが多く画像欠落の原因になるため、確実に表示できる
      // native medium（/i/g/）を使う（APIが返す元のサイズコードはそのまま温存）。
      return url.replace(/\/i\/j\//, '/i/g/');
    }
    return url;
  } catch {
    return url;
  }
};

// 商品名からカテゴリを判定する（検索キーワードではなく「商品名」で判定するのが肝心）。
// サーバー同期(REQUIRED_KEYWORDS)と整合させ、表示・取り込みの両方で使う単一の判定源。
// 配列の順序＝優先順位（先にマッチしたものを採用）。具体的な語ほど上に置く。
// 例: 「アップリカ バスチェア ... お風呂」→ お風呂用品（バスチェア/お風呂で一致）。
export const CATEGORY_KEYWORDS = [
  ['おむつ', ['おむつ', 'オムツ', 'おしりふき', 'お尻拭き', 'おしり拭き', '防臭袋', 'おむつポット', 'おむつゴミ箱', 'おむつ用ゴミ箱']],
  ['抱っこ紐', ['抱っこ紐', '抱っこひも', 'だっこひも', 'ベビースリング', 'スリング', 'ヒップシート', 'ベビーキャリア', '抱っこ補助']],
  ['ベビーカー', ['ベビーカー', 'バギー', 'ストローラー']],
  ['車用品', ['チャイルドシート', 'ジュニアシート', 'ベビーシート', 'カーシート', '回転式シート']],
  ['マタニティ', ['マタニティ', '妊婦', '授乳ブラ', '葉酸', '腹帯', '妊娠', '産前産後']],
  ['お風呂用品', ['ベビーバス', '沐浴', 'バスチェア', 'バスマット', 'お風呂', 'おふろ', '湯温計', 'ベビーソープ', 'ベビーシャンプー', 'ベビーローション', '保湿クリーム', 'ベビーオイル', 'スイマーバ']],
  ['ミルク・授乳', ['哺乳瓶', '哺乳びん', '搾乳', '授乳クッション', '母乳パッド', '粉ミルク', '液体ミルク', 'フォローアップ', '調乳', '乳首', 'ニップル']],
  ['離乳食・食器', ['離乳食', 'ベビーフード', 'ベビーチェア', 'ハイチェア', 'ローチェア', 'ベビー食器', '食器セット', 'お食い初め', 'ストローマグ', 'マグカップ', '離乳食スプーン']],
  ['寝具・ベッド', ['ベビーベッド', 'ベビー布団', 'スリーパー', 'ベビー枕', 'ドーナツ枕', 'おやすみ', 'ベビーマットレス', '寝かしつけ']],
  ['安全グッズ', ['ベビーゲート', 'コーナーガード', 'ドアロック', '転倒防止', 'ベビーモニター', '見守りカメラ', 'チャイルドロック', 'ベビーフェンス']],
  ['トイレ用品', ['おまる', '補助便座', 'トイレトレーニング', 'トイトレ', 'トレーニングパンツ']],
  ['ウェア', ['ロンパース', 'カバーオール', '肌着', 'ベビー服', 'ボディスーツ', 'ツーウェイオール', 'プレオール', 'スタイ', 'よだれかけ', 'おくるみ', 'ベビーウェア', '前開き']],
  ['おもちゃ', ['おもちゃ', '知育玩具', 'ガラガラ', 'にぎにぎ', 'メリー', 'プレイマット', 'ぬいぐるみ', '積み木', '歯固め', 'ベビージム', '布絵本']],
  ['絵本', ['絵本', 'えほん', 'しかけ絵本', '飛び出す絵本']],
  ['ギフトセット', ['出産祝い', 'ギフトセット', 'おむつケーキ', '出産準備セット']],
];

// 商品名→カテゴリ名（CATEGORY_TREE のいずれか）。該当なしは null。
export const categorizeByName = (name) => {
  const n = name || '';
  for (const [cat, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => n.includes(k))) return cat;
  }
  return null;
};

// 商品一覧カードのサムネイル用。詳細表示は getHighResImage の1000x1000を使う。
// 楽天画像は ?_ex= で任意の表示サイズを指定できる（CDN側で元画像から動的生成）ため、
// retinaディスプレイでも粗く見えないよう600x600を指定する。
// Yahoo(yimg)はサイズコードの安全な拡大方法が未確認のため、元のまま返す。
export const getCardImage = (url) => {
  if (!url) return 'https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby';
  try {
    if (url.indexOf('rakuten.co.jp') !== -1) {
      return url.split('?_ex=')[0] + '?_ex=600x600';
    }
    return getHighResImage(url);
  } catch {
    return url;
  }
};

// 商品画像を同一オリジンの画像プロキシ(/api/img)経由のURLに変換する。
// 楽天・Yahooの画像はサーバー側で「高画質→存在確認→確実なURL」とフォールバック
// してから配信するため、ホットリンク制限やサイズコードの当て推量による
// 「一部表示されない／画質が荒い」問題を解消できる。
// variant: 'card'（一覧サムネ）/ 'hero'（詳細表示、最大サイズ）。
// プロキシ対象外（自前画像・プレースホルダ等）はそのまま返す。
export const getProxiedImage = (url, variant = 'card') => {
  if (!url) return 'https://placehold.jp/24/7b8e76/ffffff/400x400.png?text=Honest+Baby';
  try {
    if (/(^|\.)yimg\.jp|rakuten\.co\.jp/.test(new URL(url).hostname)) {
      const v = variant === 'hero' ? 'hero' : 'card';
      return `/api/img?v=${v}&url=${encodeURIComponent(url)}`;
    }
    return url;
  } catch {
    return url;
  }
};

// shops 配列から最安値を取得（表示用、official正規化なしの軽量版）
export const getLowestPrice = (shops) => {
  if (!shops || shops.length === 0) return 0;
  const prices = shops
    .map((s) => Number(s.lowestPrice ?? s.lowest_price ?? s.price ?? 0))
    .filter((p) => p > 0 && isFinite(p));
  return prices.length > 0 ? Math.min(...prices) : 0;
};

// Supabase の products 行をフロントエンド共通フォーマットへ変換（SSR用）
export const formatDbProduct = (p) => {
  const rating = Number(p.rating) || 0;
  return {
    ...p,
    rating,
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
    isBestSeller: !!(p.popularity_rank && p.popularity_rank <= 3),
    isTopRated: rating >= 4.8,
    shops: (p.shops || []).map((s) => {
      let sellers = s.sellers;
      if (typeof sellers === 'string') {
        try { sellers = JSON.parse(sellers); } catch { sellers = []; }
      }
      return {
        ...s,
        name: s.shop_name,
        type: s.shop_type,
        lowestPrice: s.lowest_price,
        sellers: Array.isArray(sellers) ? sellers : [],
      };
    }),
  };
};
