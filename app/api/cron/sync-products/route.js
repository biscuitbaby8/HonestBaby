import { createClient } from '@supabase/supabase-js';
import { sendPushNotification, isPushConfigured } from '@/lib/webPush';
import { request as httpsRequest } from 'node:https';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// =============================================
// 夜間自動同期クローラー (Vercel Cron)
// 全カテゴリの楽天ランキング＋検索APIを巡回し、
// 商品データと各モール価格をSupabaseに自動保存する
// =============================================

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'
);

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || process.env.VITE_RAKUTEN_ACCESS_KEY || '';
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || process.env.VITE_RAKUTEN_AFFILIATE_ID || '';
// 新・楽天API(openapi.rakuten.co.jp)は Referer/Origin が
// アプリ登録時の「許可するWebサイト」と一致しないと403になる。
// 既定はサイト本番ドメイン。登録URLが異なる場合は RAKUTEN_REFERER で上書き可。
const RAKUTEN_REFERER = process.env.RAKUTEN_REFERER || 'https://honestbaby-care.com';
const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID || process.env.VITE_YAHOO_CLIENT_ID;
const VC_SID = process.env.VITE_VC_SID || '3768537';

// カテゴリ定義（src/lib/products.js の CATEGORY_TREE と同期）
// keyword     … カテゴリ全体の広い検索（path1 / syncCategory が使用）
// subs[].sub  … CATEGORY_TREE の sub 文字列と「完全一致」させること（1文字違うと空タブになる）
// subs[].keywords … サブカテゴリ専用の検索（path2 / syncCategorySubQueries が使用。見つけた枠に
//                   sub_category を直接確定するので、各サブタブに確実に商品が並ぶ）
// subs[].yahooKeyword … 楽天が空のときのYahooフォールバック用の広めキーワード（任意）
const CATEGORIES = [
  { name: "おむつ", genreId: "101070", keyword: "紙おむつ 赤ちゃん", subs: [
    { sub: "テープタイプ", keywords: ["おむつ テープ"], yahooKeyword: "おむつ テープ 赤ちゃん" },
    { sub: "パンツタイプ", keywords: ["おむつ パンツ"], yahooKeyword: "おむつ パンツ 赤ちゃん" },
    { sub: "夜用おむつ",   keywords: ["おむつ 夜用"], yahooKeyword: "夜用 おむつ" },
    { sub: "おしりふき",   keywords: ["おしりふき 赤ちゃん"], yahooKeyword: "おしりふき" },
  ]},
  { name: "ゴミ箱・袋", genreId: "101070", keyword: "おむつ ゴミ箱 防臭", subs: [
    { sub: "ゴミ箱・袋", keywords: ["おむつ ゴミ箱 防臭", "おむつ 防臭袋"], yahooKeyword: "おむつ ゴミ箱 防臭" },
  ]},
  { name: "ベビーカー", genreId: "501062", keyword: "ベビーカー", subs: [
    { sub: "A型",       keywords: ["ベビーカー A型"], yahooKeyword: "ベビーカー A型" },
    { sub: "B型",       keywords: ["ベビーカー B型 軽量"], yahooKeyword: "ベビーカー B型" },
    { sub: "AB型",      keywords: ["ベビーカー AB型"], yahooKeyword: "ベビーカー AB型" },
    { sub: "バギー",    keywords: ["ベビーカー バギー 軽量"], yahooKeyword: "ベビーカー バギー" },
    { sub: "周辺グッズ", keywords: ["ベビーカー レインカバー", "ベビーカー フック"], yahooKeyword: "ベビーカー アクセサリー" },
  ]},
  { name: "抱っこ紐", genreId: "209214", keyword: "抱っこ紐 新生児", subs: [
    { sub: "縦抱き",     keywords: ["抱っこ紐 縦抱き"], yahooKeyword: "抱っこ紐 縦抱き" },
    { sub: "横抱き",     keywords: ["抱っこ紐 横抱き 新生児"], yahooKeyword: "抱っこ紐 横抱き" },
    { sub: "スリング",   keywords: ["ベビースリング 抱っこ"], yahooKeyword: "ベビースリング" },
    { sub: "ヒップシート", keywords: ["ヒップシート 抱っこ紐"], yahooKeyword: "ヒップシート" },
    { sub: "周辺グッズ", keywords: ["抱っこ紐 よだれカバー", "抱っこ紐 ケープ"], yahooKeyword: "抱っこ紐 カバー" },
  ]},
  { name: "ウェア", genreId: "110464", keyword: "ベビー服 赤ちゃん", subs: [
    { sub: "ロンパース",   keywords: ["ベビー ロンパース"], yahooKeyword: "ベビー ロンパース" },
    { sub: "カバーオール", keywords: ["ベビー カバーオール"], yahooKeyword: "ベビー カバーオール" },
    { sub: "肌着",         keywords: ["ベビー 肌着 コンビ肌着"], yahooKeyword: "ベビー 肌着" },
    { sub: "アウター",     keywords: ["ベビー アウター ジャンパー"], yahooKeyword: "ベビー アウター" },
    { sub: "スタイ",       keywords: ["ベビー スタイ よだれかけ"], yahooKeyword: "ベビー スタイ" },
  ]},
  { name: "ミルク・授乳", genreId: "101077", keyword: "ベビー 哺乳瓶", subs: [
    { sub: "ミルク",       keywords: ["粉ミルク 育児用ミルク"], yahooKeyword: "粉ミルク 赤ちゃん" },
    { sub: "哺乳瓶",       keywords: ["哺乳瓶 ベビー"], yahooKeyword: "哺乳瓶" },
    { sub: "搾乳器",       keywords: ["搾乳器"], yahooKeyword: "搾乳器" },
    { sub: "授乳クッション", keywords: ["授乳クッション"], yahooKeyword: "授乳クッション" },
    { sub: "母乳パッド",   keywords: ["母乳パッド"], yahooKeyword: "母乳パッド" },
  ]},
  { name: "離乳食・食器", genreId: "101078", keyword: "離乳食 ベビーフード", subs: [
    { sub: "ベビーフード", keywords: ["ベビーフード 離乳食"], yahooKeyword: "ベビーフード" },
    { sub: "食器セット",   keywords: ["ベビー食器 セット"], yahooKeyword: "ベビー食器 セット" },
    { sub: "ベビーチェア", keywords: ["ベビーチェア ハイチェア"], yahooKeyword: "ベビーチェア" },
    { sub: "スプーン",     keywords: ["離乳食 スプーン ストローマグ"], yahooKeyword: "離乳食 スプーン" },
  ]},
  { name: "寝具・ベッド", genreId: "101071", keyword: "ベビーベッド 赤ちゃん布団", subs: [
    { sub: "ベビーベッド", keywords: ["ベビーベッド"], yahooKeyword: "ベビーベッド" },
    { sub: "ベビー布団",   keywords: ["ベビー布団 セット"], yahooKeyword: "ベビー布団 セット" },
    { sub: "スリーパー",   keywords: ["スリーパー ベビー"], yahooKeyword: "スリーパー ベビー" },
    { sub: "まくら",       keywords: ["ベビー枕 ドーナツ枕"], yahooKeyword: "ベビー枕" },
  ]},
  { name: "おもちゃ", genreId: "101074", keyword: "赤ちゃん おもちゃ 知育", subs: [
    { sub: "0ヶ月〜", keywords: ["ベビー おもちゃ ガラガラ モービル にぎにぎ 新生児"], yahooKeyword: "ベビー おもちゃ 新生児" },
    { sub: "3ヶ月〜", keywords: ["ベビー おもちゃ 歯固め ラトル にぎにぎ 3ヶ月"], yahooKeyword: "ベビー おもちゃ 3ヶ月" },
    { sub: "6ヶ月〜", keywords: ["ベビー おもちゃ 6ヶ月", "おもちゃ プレイマット 積み木"], yahooKeyword: "ベビー おもちゃ 6ヶ月 プレイマット" },
    { sub: "1歳〜",   keywords: ["知育玩具 おもちゃ パズル ブロック ぬいぐるみ 1歳"], yahooKeyword: "知育玩具 おもちゃ 1歳" },
  ]},
  { name: "安全グッズ", genreId: "101076", keyword: "ベビー 安全グッズ ゲート", subs: [
    { sub: "ベビーゲート",   keywords: ["ベビーゲート"], yahooKeyword: "ベビーゲート" },
    { sub: "コーナーガード", keywords: ["コーナーガード ベビー"], yahooKeyword: "コーナーガード ベビー" },
    { sub: "扉ロック",       keywords: ["ベビー ドアロック いたずら防止"], yahooKeyword: "ベビー ドアロック" },
    { sub: "転倒防止",       keywords: ["家具 転倒防止 ベビー"], yahooKeyword: "家具 転倒防止" },
    { sub: "ベビーモニター", keywords: ["ベビーモニター 見守りカメラ"], yahooKeyword: "ベビーモニター" },
  ]},
  { name: "お風呂用品", genreId: "101075", keyword: "ベビー お風呂 沐浴", subs: [
    { sub: "ベビーバス",   keywords: ["ベビーバス 沐浴"], yahooKeyword: "ベビーバス" },
    { sub: "ベビー用ソープ", keywords: ["ベビーソープ 全身シャンプー"], yahooKeyword: "ベビーソープ" },
    { sub: "保湿クリーム", keywords: ["ベビー 保湿 ローション クリーム"], yahooKeyword: "ベビー 保湿クリーム" },
  ]},
  { name: "トイレ用品", genreId: "101072", keyword: "ベビー おしりふき 赤ちゃん", subs: [
    { sub: "補助便座", keywords: ["補助便座"], yahooKeyword: "補助便座" },
    { sub: "おまる",   keywords: ["おまる"], yahooKeyword: "おまる" },
    { sub: "トイトレ", keywords: ["トイレトレーニング パンツ"], yahooKeyword: "トイレトレーニング" },
    { sub: "おしりふき", keywords: ["おしりふき 赤ちゃん"], yahooKeyword: "おしりふき" },
  ]},
  { name: "車用品", genreId: "501063", keyword: "チャイルドシート 新生児", subs: [
    { sub: "新生児用",     keywords: ["チャイルドシート 新生児"], yahooKeyword: "チャイルドシート 新生児" },
    { sub: "1歳以上",      keywords: ["チャイルドシート 1歳"], yahooKeyword: "チャイルドシート 1歳" },
    { sub: "ジュニアシート", keywords: ["ジュニアシート"], yahooKeyword: "ジュニアシート" },
    { sub: "2wayタイプ",   keywords: ["チャイルドシート 回転式"], yahooKeyword: "チャイルドシート 回転式" },
    { sub: "周辺グッズ",   keywords: ["チャイルドシート 保護マット", "チャイルドシート ミラー"], yahooKeyword: "チャイルドシート アクセサリー" },
  ]},
  { name: "マタニティ", genreId: "101080", keyword: "マタニティ 妊娠", subs: [
    { sub: "マタニティウェア", keywords: ["マタニティ ウェア パジャマ"], yahooKeyword: "マタニティ ウェア" },
    { sub: "腹帯",         keywords: ["腹帯 マタニティ"], yahooKeyword: "腹帯 マタニティ" },
    { sub: "葉酸サプリ",   keywords: ["葉酸 サプリ 妊娠"], yahooKeyword: "葉酸 サプリ" },
    { sub: "授乳ブラ",     keywords: ["授乳ブラ マタニティブラ"], yahooKeyword: "授乳ブラ" },
    { sub: "ノンカフェイン", keywords: ["ノンカフェイン 妊婦 ハーブティー"], yahooKeyword: "ノンカフェイン 妊婦" },
  ]},
  { name: "ギフトセット", genreId: "101079", keyword: "出産祝い ギフトセット 赤ちゃん", subs: [
    { sub: "ロンパース・服",   keywords: ["出産祝い ロンパース ベビー服 セット"], yahooKeyword: "出産祝い ベビー服 セット" },
    { sub: "おもちゃ",         keywords: ["出産祝い 知育玩具 おもちゃ ガラガラ"], yahooKeyword: "出産祝い おもちゃ" },
    { sub: "スキンケア",       keywords: ["出産祝い スキンケア ベビー ケアセット"], yahooKeyword: "出産祝い スキンケア セット" },
    { sub: "タオル・スタイ",   keywords: ["出産祝い タオル スタイ ガーゼ"], yahooKeyword: "出産祝い タオル スタイ" },
    { sub: "食器・哺乳瓶",     keywords: ["出産祝い 食器セット 哺乳瓶 マグ"], yahooKeyword: "出産祝い 食器セット" },
    { sub: "ブランドギフト",   keywords: ["出産祝い ブランド", "出産祝い ミキハウス"], yahooKeyword: "出産祝い ブランド ギフト" },
  ]},
];

// カテゴリ別のキーワードフィルタ（本体のみ残す）
const REQUIRED_KEYWORDS = {
  "おむつ":       ["おむつ", "オムツ", "おしりふき"],
  "ゴミ箱・袋":   ["ゴミ箱", "ごみ箱", "防臭袋", "防臭ポット", "おむつポット", "おむつゴミ箱", "サニタリー"],
  "ベビーカー":   ["ベビーカー", "バギー", "ストローラー"],
  "抱っこ紐":     ["抱っこ紐", "だっこひも", "スリング", "ヒップシート", "キャリア"],
  "ウェア":       ["ロンパース", "カバーオール", "肌着", "ベビー服", "ボディスーツ", "ツーウェイオール", "プレオール", "つなぎ", "スタイ", "アウター", "おくるみ"],
  "ミルク・授乳": ["哺乳瓶", "搾乳", "授乳クッション", "母乳", "哺乳", "粉ミルク", "液体ミルク", "ミルク", "乳首"],
  "離乳食・食器": ["離乳食", "ベビーフード", "ベビーチェア", "ベビー食器", "食器", "スプーン", "マグ", "おやつ"],
  "寝具・ベッド": ["ベビーベッド", "布団", "スリーパー", "ベビー布団", "まくら", "枕", "マットレス"],
  "おもちゃ":     ["おもちゃ", "知育", "ガラガラ", "メリー", "プレイマット", "ぬいぐるみ", "積み木", "歯固め", "玩具"],
  "安全グッズ":   ["ゲート", "コーナーガード", "ドアロック", "転倒防止", "ベビーガード", "ベビーモニター", "見守りカメラ", "ロック", "安全"],
  "お風呂用品":   ["沐浴", "ベビーバス", "体温計", "保湿", "ベビーソープ", "お風呂", "バスチェア", "湯温計", "ローション"],
  "トイレ用品":   ["おまる", "補助便座", "トイトレ", "おしりふき", "トイレトレーニング"],
  "車用品":       ["チャイルドシート", "ジュニアシート", "ベビーシート", "回転式", "シートベルト"],
  "マタニティ":   ["マタニティ", "妊娠", "授乳ブラ", "葉酸", "産前"],
  "ギフトセット": ["ギフト", "出産祝い", "プレゼント"],
};

// 除外キーワード（全カテゴリ共通）
const NG_KEYWORDS = [
  'ふるさと納税', 'ポイント消化', 'クーポン対象', 'お試しセット',
  '訳あり', 'アウトレット', '中古', 'リユース', 'メール便のみ',
  // ギフト専用商品（ホームのランキングには不要）
  'おむつケーキ', 'おむつタワー', 'おむつリース', 'おむつアート', 'おむつフラワー',
  // ペット用品（全カテゴリ共通で除外。「ペットボトル」を誤爆しないよう具体語のみ）
  'ペットゲート', 'ペットカート', 'ペットシーツ', 'ペットシート', 'ペット用', 'ペット対応',
  '犬用', '猫用', '子猫', '犬ドライ', 'ドッグフード', 'ドッグミルク', 'ロイヤルカナン',
  '愛犬', '愛猫', 'わんちゃん', 'ねこちゃん',
  // 大人・介護用品（赤ちゃん用サイトには不要。多用途の「介護 子ども」等は誤爆しないよう具体語のみ）
  '大人用', '介護用', '介護パンツ', '大人おむつ', '成人用', 'シニア用', '高齢者', '要介護', '失禁', '尿漏れ',
  // 蚊帳テント・その他明らかに無関係（「蚊帳付きプレイヤード」は誤爆しないよう蚊帳単体は除外せず）
  'ムカデ', 'モスキートネット',
  // 名前がレビュー誘導・抱き合わせ等のノイズ商品
  'レビューを書いて', 'あわせ買い',
  // ペット用おむつ／大人介護用品ブランド（どのカテゴリでも赤ちゃん用品にはなり得ないので全カテゴリ共通で除外）
  // 「リフレ」は「リフレクター」を誤爆しないようブランド表記の半角スペース込みで指定
  'マナーウェア', 'アテント', 'リフレ ', 'ライフリー', 'サルバ', 'ポイズ ', '安楽尿器', '幸和製作所', 'V-check', 'V−ｃｈｅｃｋ',
];

// カテゴリ別追加除外キーワード
const CATEGORY_NG_KEYWORDS = {
  "おむつ": [
    "大人用", "介護用", "失禁", "尿漏れ", "介護パンツ", "大人おむつ", "成人用", "シニア用",
    "大人",
    "ゴミ箱", "ごみ箱", "防臭袋", "防臭ポット", "おむつポット", "サニタリーボックス",
    "ペット", "犬用", "猫用", "ペットシーツ", "ペットシート", "犬", "猫", "わんちゃん", "ねこ",
    "トイレシーツ", "ペット用", "愛犬", "愛猫",
    "犬猫", "わんにゃん", "ペットシーツ", "トイレシート", "ワンちゃん", "ネコちゃん",
    "動物", "アニマル", "ペット対応",
    // おむつ本体ではない別カテゴリ商品（おむつ自体に言及していても本体ではない）
    // ※ペット用おむつ／大人介護用品ブランドは全カテゴリ共通のNG_KEYWORDSで除外済み
    "抱っこ紐", "抱っこひも", "ヒップシート", "キャリア",
    "ウェットシートケース", "ベビーカー用収納", "マザーズバッグ", "マザーズリュック", "ベビーヘルメット",
    "ブルマ", "PUレザーパンツ", "防晒",
    // おむつと無関係な汎用大型ゴミ箱
    "クリーンボックス", "SANKA", "サンカ", "自動開閉", "センサーゴミ箱", "ステンレスゴミ箱", "Re・De Bin", "キッチン用ゴミ箱",
  ],
  // ギフトは写真集・アルバム等の物販でないものを除外
  "ギフトセット": ["アルバム", "フォトアルバム", "絵本", "色紙", "メッセージカード単品"],
  // ベビーカー: 「ベビーカーでも使える」等で関連語を含むだけの無関係商品を除外
  // （エアラブ/ベビーカーシート等の正規のベビーカー用冷却シートは具体語を避けて誤爆しないようにする）
  "ベビーカー": [
    "クリップ扇風機", "ハンディファン", "卓上扇風機", "クリップ式扇風機", "ミニ扇風機", "車載用 扇風機", "携帯扇風機", "クリップファン",
    "チャイルドシート 保護マット", "チャイルドシート 抜け出し防止", "イージーファンチャイルドシート", "カーシートカバー",
    "キャリーケース", "スーツケース",
    "ドアストッパー", "ドアストップ",
    "ティッシュケース", "ティッシュカバー",
    "鼻吸い器", "鼻水吸引器",
    "傘スタンド", "傘ホルダー", "傘立て", "傘固定",
    "水筒底カバー", "水筒カバー",
    "アヒル", "自転車ベル", "自転車ライト",
    "ホンダ", "フリード", "ラゲッジネット", "GoPro", "ゴープロ",
    "ソート＆カウント", "ひも通し",
    "プレイジム", "プレイマット",
    "ドルフィンデザインキーホルダー", "交通安全グッズ反射板", "お先にどうぞ",
    "スマートフォン iPhone",
    "シートバックポケット", "カーポケット",
  ],
};

// Yahoo画像URLを標準サイズに正規化（/i/g/はショップ依存で低画質の場合あり）
function upgradeYahooImage(url) {
  if (!url) return url;
  return url.replace(/\/i\/[ngs]\//, '/i/j/');
}

// 先頭ノイズトークンセット（スペース区切りで完全一致するもののみ除去）
const LEADING_NOISE_SET = new Set([
  'おもちゃ', '知育玩具', '知育', '玩具', '木のおもちゃ', '積み木',
  'ベビー用品', 'ベビー', '赤ちゃん', '新生児', '乳幼児', 'キッズ',
  '子ども', '子供', '幼児', '男の子', '女の子',
  '誕生日', 'プレゼント', 'ギフト', '贈り物', '出産祝い', 'クリスマス', 'お祝い',
  'ランキング', '人気', '売れ筋', 'おすすめ',
  '一歳', '二歳', '三歳', '四歳', '五歳',
]);
const TRAILING_NOISE_SET = new Set([
  '誕生日', 'プレゼント', 'ギフト', '贈り物', '出産祝い', 'クリスマス', 'お祝い',
  '知育', 'ランキング', '人気', '売れ筋', 'おすすめ', '正規品', '公式', '新品',
  '一歳', '二歳', '三歳', '四歳', '五歳',
]);
const AGE_TOKEN_RE = /^[0-9０-９一二三四五六七八九十]+[歳ヶ月]児?$/;

// 商品名クリーニング（SEOキーワード羅列を除去してシンプルな商品名に）
function cleanName(name) {
  let s = name
    .replace(/[【［\[「『〈《][^】］\]」』〉》]{0,60}[】］\]」』〉》]/g, '')
    .replace(/[★◆▼■●▲☆◇▽□○△♪♥♡※◎◯！!✓]+/g, '')
    .replace(/[\s　]*(送料無料|あす楽|即納|正規品|公式).*$/g, '')
    .replace(/[\s　]+/g, ' ')
    .trim();

  const tokens = s.split(' ');

  // 先頭のSEOノイズトークンを除去（最低1トークン残す）
  let start = 0;
  while (start < tokens.length - 1) {
    const t = tokens[start];
    if (LEADING_NOISE_SET.has(t) || AGE_TOKEN_RE.test(t)) start++;
    else break;
  }

  // 末尾のSEOノイズトークンを除去（最低1トークン残す）
  let end = tokens.length;
  while (end > start + 1) {
    const t = tokens[end - 1];
    if (TRAILING_NOISE_SET.has(t) || AGE_TOKEN_RE.test(t)) end--;
    else break;
  }

  s = tokens.slice(start, end).join(' ');

  // 45文字でカット（単語の途中を避ける）
  if (s.length > 45) {
    s = s.slice(0, 45).replace(/\s+\S*$/, '').trim();
  }

  return s || name.slice(0, 30).trim();
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

// サブカテゴリ推定ロジック（全カテゴリ対応）
function extractSubCategory(category, itemName) {
  const rules = {
    "おむつ": [
      { match: /夜用|よる用|夜間/, sub: "夜用おむつ" },
      { match: /ゴミ箱|ごみ箱|防臭袋|防臭ポット|おむつポット|サニタリー/, sub: "ゴミ箱・袋" },
      { match: /おしりふき|おしり拭き/, sub: "おしりふき" },
      { match: /パンツ/, sub: "パンツタイプ" },
      { match: /テープ/, sub: "テープタイプ" },
    ],
    // ゴミ箱・袋はDBではカテゴリ"ゴミ箱・袋"で保存されるため全件にsub付与
    "ゴミ箱・袋": [
      { match: /[\s\S]*/, sub: "ゴミ箱・袋" },
    ],
    "おもちゃ": [
      // 月齢表記を優先
      { match: /0[ヶヵか]月|新生児/, sub: "0ヶ月〜" },
      { match: /3[ヶヵか]月/, sub: "3ヶ月〜" },
      { match: /6[ヶヵか]月|ハーフバースデー/, sub: "6ヶ月〜" },
      { match: /1歳|一歳|12[ヶヵか]月/, sub: "1歳〜" },
      { match: /2歳|二歳|3歳|三歳|24[ヶヵか]月|36[ヶヵか]月/, sub: "1歳〜" },
      // 月齢表記なし → 製品タイプで判定
      { match: /メリー|ベッドメリー|モビール|ガラガラ|にぎにぎ/, sub: "0ヶ月〜" },
      { match: /歯固め|フィンガーパペット/, sub: "3ヶ月〜" },
      { match: /プレイマット|引き車|ソフトブロック|積み木|くもん/, sub: "6ヶ月〜" },
      { match: /乗用|ままごと|パズル|型はめ|ブロックセット|シルバニア|木製玩具/, sub: "1歳〜" },
    ],
    "ベビーカー": [
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
      { match: /よだれパッド|ケープ|抱っこ紐カバー|防寒カバー/, sub: "周辺グッズ" },
      { match: /スリング/, sub: "スリング" },
      { match: /ヒップシート/, sub: "ヒップシート" },
      { match: /横抱き|フロントキャリー/, sub: "横抱き" },
      { match: /縦抱き/, sub: "縦抱き" },
    ],
    "ウェア": [
      { match: /スタイ|よだれかけ|ビブ/, sub: "スタイ" },
      { match: /アウター|ジャケット|コート|ベスト|ジャンパー|ブルゾン|ポンチョ/, sub: "アウター" },
      { match: /カバーオール|プレオール|つなぎ|オールインワン/, sub: "カバーオール" },
      { match: /肌着|インナー|コンビ肌着|短肌着|ボディスーツ/, sub: "肌着" },
      { match: /ロンパース/, sub: "ロンパース" },
    ],
    "ミルク・授乳": [
      { match: /母乳パッド|ブレストパッド|乳パッド/, sub: "母乳パッド" },
      { match: /搾乳器|搾乳機|さく乳/, sub: "搾乳器" },
      { match: /授乳クッション|抱き枕/, sub: "授乳クッション" },
      { match: /哺乳瓶|哺乳びん|乳首|ニプル|乳頭/, sub: "哺乳瓶" },
      { match: /粉ミルク|液体ミルク|フォローアップ|育児用ミルク|調製粉乳/, sub: "ミルク" },
    ],
    "離乳食・食器": [
      { match: /ベビーチェア|ハイチェア|バウンサー|ローチェア|バンボ/, sub: "ベビーチェア" },
      { match: /スプーン|フォーク|ストローマグ|ストロー|マグカップ|コップ飲み/, sub: "スプーン" },
      { match: /食器|お椀|ベビー皿|プレート|ランチプレート|お茶碗/, sub: "食器セット" },
      { match: /ベビーフード|離乳食|レトルト|ベビー食品|おかゆ|フリーズドライ/, sub: "ベビーフード" },
    ],
    "寝具・ベッド": [
      { match: /スリーパー|スリープバッグ|着る布団|寝袋/, sub: "スリーパー" },
      { match: /まくら|枕|頭の形|頭型/, sub: "まくら" },
      { match: /布団セット|ふとんセット|掛け布団|敷き布団|羽毛布団|肌布団/, sub: "ベビー布団" },
      { match: /ベビーベッド|ミニベッド|ハーフベッド|ベビーベット|添い寝/, sub: "ベビーベッド" },
    ],
    "安全グッズ": [
      { match: /ベビーモニター|見守りカメラ|モニタリングカメラ/, sub: "ベビーモニター" },
      { match: /転倒防止|家具固定|転落防止|耐震|倒れ防止/, sub: "転倒防止" },
      { match: /扉ロック|ドアロック|引き出しロック|キャビネットロック|チャイルドロック/, sub: "扉ロック" },
      { match: /コーナーガード|コーナークッション|角クッション|テーブルクッション/, sub: "コーナーガード" },
      { match: /ベビーゲート|ゲート|柵|フェンス|バリケード/, sub: "ベビーゲート" },
    ],
    "お風呂用品": [
      { match: /保湿|ローション|クリーム|ベビーオイル|セラミド|乳液/, sub: "保湿クリーム" },
      { match: /ソープ|石けん|シャンプー|ボディウォッシュ|全身洗浄|泡|ボディソープ/, sub: "ベビー用ソープ" },
      { match: /ベビーバス|沐浴|バスネット|お風呂マット|バスチェア|温度計/, sub: "ベビーバス" },
    ],
    "トイレ用品": [
      { match: /おしりふき|おしり拭き|ウェットティッシュ/, sub: "おしりふき" },
      { match: /トイトレ|トイレトレーニング/, sub: "トイトレ" },
      { match: /おまる|ポッティ/, sub: "おまる" },
      { match: /補助便座|便座シート|トイレシート/, sub: "補助便座" },
    ],
    "車用品": [
      { match: /シートプロテクター|座席保護|シート保護|保護シート|保護マット|チェアプロテクター/, sub: "周辺グッズ" },
      { match: /シートカバー|チェアカバー|座席カバー/, sub: "周辺グッズ" },
      { match: /ミラー|カーミラー|後部座席ミラー/, sub: "周辺グッズ" },
      { match: /サンシェード|日よけ|UVカット|車用遮光|車用日除け/, sub: "周辺グッズ" },
      { match: /シートベルトカバー|シートベルトパッド|ベルトパッド/, sub: "周辺グッズ" },
      { match: /ネックピロー|ヘッドサポート|ヘッドレスト/, sub: "周辺グッズ" },
      { match: /収納|ポーチ|トレイ|オーガナイザー/, sub: "周辺グッズ" },
      { match: /ジュニアシート/, sub: "ジュニアシート" },
      { match: /新生児/, sub: "新生児用" },
      { match: /2way|2ウェイ|二way|コンバーチブル/, sub: "2wayタイプ" },
      { match: /1歳以上|1歳から|一歳以上|12[ヶヵか]月以上/, sub: "1歳以上" },
    ],
    "マタニティ": [
      { match: /ノンカフェイン|カフェインゼロ|ハーブティー|麦茶|ルイボス|カモミール/, sub: "ノンカフェイン" },
      { match: /葉酸|DHA|鉄分|サプリ|マルチビタミン/, sub: "葉酸サプリ" },
      { match: /授乳ブラ|授乳インナー|マタニティブラ|授乳キャミ/, sub: "授乳ブラ" },
      { match: /腹帯|マタニティベルト|骨盤ベルト|サポートベルト|腹巻/, sub: "腹帯" },
      { match: /マタニティウェア|マタニティ服|マタニティパンツ|マタニティワンピース|授乳服|マタニティジーンズ/, sub: "マタニティウェア" },
    ],
    "ギフトセット": [
      { match: /ロンパース|カバーオール|ベビー服|ベビーウェア|肌着|ボディスーツ|コンビ肌着|短肌着/, sub: "ロンパース・服" },
      { match: /おもちゃ|知育玩具|ガラガラ|メリー|にぎにぎ|フィジェット|積み木|パペット|ぬいぐるみ/, sub: "おもちゃ" },
      { match: /スキンケア|ローション|クリーム|石けん|ソープ|シャンプー|保湿|ケアセット|ベビーオイル|全身|ボディウォッシュ/, sub: "スキンケア" },
      { match: /タオル|スタイ|よだれかけ|ガーゼ|ハンカチ|フェイスタオル|バスタオル|おくるみ/, sub: "タオル・スタイ" },
      { match: /食器|哺乳瓶|マグ|スプーン|フォーク|お食い初め|離乳食セット|ストローカップ|コップ/, sub: "食器・哺乳瓶" },
      { match: /ミキハウス|ファミリア|ラルフローレン|バーバリー|ブランド|プチバトー|アナスイ|セレモニー/, sub: "ブランドギフト" },
    ],
  };

  const catRules = rules[category];
  if (catRules) {
    for (const r of catRules) {
      if (r.match.test(itemName)) return r.sub;
    }
  }
  if (category === 'ギフトセット') return 'ギフトセット総合';
  return '本体';
}

// node:https でHTTPリクエスト（Referer等の禁止ヘッダーも送れる）
function nodeHttpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

// --- 楽天API呼び出し（リトライ付き） ---
// 新・楽天APIに渡す共通ヘッダー。Referer と Origin の両方を送らないと
// REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING (403) になる。
function rakutenHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0',
    'Referer': RAKUTEN_REFERER,
    'Origin': RAKUTEN_REFERER,
  };
}

async function fetchWithRetry(url, maxRetries = 1) {
  for (let i = 0; i <= maxRetries; i++) {
    const { statusCode, text } = await nodeHttpsGet(url, rakutenHeaders());

    if (statusCode === 200) return JSON.parse(text);
    if (statusCode === 403) throw new Error(`API Error 403: ${text.slice(0, 100)}`);
    if (statusCode === 400) throw new Error(`API Error 400: ${text.slice(0, 100)}`);
    if (statusCode === 429 && i < maxRetries) {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
    throw new Error(`API Error ${statusCode}`);
  }
}

async function fetchRakutenSearch(keyword, genreId, page = 1) {
  // genreId が指定されたときだけジャンルで絞る。サブカテゴリ補完は genreId 無しで広く探す
  // （ニッチ商品が隣接ジャンルに居て取りこぼすため。sub_category は呼び出し側で確定する）。
  const genrePart = genreId ? `&genreId=${genreId}` : '';
  const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}&keyword=${encodeURIComponent(keyword)}&sort=-reviewCount&hits=30&page=${page}&availability=1${genrePart}&affiliateId=${RAKUTEN_AFFILIATE_ID}`;
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
      rating: parseFloat(item.review?.rate) || 0,
      reviews_count: parseInt(item.review?.count) || 0,
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
        source: 'yahoo',
        rating: parseFloat(item.review?.rate) || 0,
        reviews_count: parseInt(item.review?.count) || 0,
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
          rating: parseFloat(item.Item.reviewAverage) || 0,
          reviews_count: parseInt(item.Item.reviewCount) || 0,
        }
      };
    });
}

// --- 重複統合（同名商品をマージ。各 _rakuten_shop を _all_sellers に集約）---
function deduplicateProducts(products) {
  const map = new Map();
  for (const p of products) {
    const key = p.name.replace(/[\s　]/g, '').toLowerCase().slice(0, 30);
    if (!map.has(key)) {
      map.set(key, { ...p, _all_sellers: p._rakuten_shop ? [p._rakuten_shop] : [] });
    } else {
      const existing = map.get(key);
      if (p._rakuten_shop) existing._all_sellers.push(p._rakuten_shop);
      // レビュー数が多い方を代表として採用（sellers は引き継ぐ）
      if (p.reviews_count > existing.reviews_count) {
        map.set(key, { ...p, _all_sellers: existing._all_sellers });
      }
    }
  }
  return Array.from(map.values());
}

// --- 複数 seller にロール（公式/最安値/高評価）を付与 ---
function assignRoles(sellers) {
  if (!sellers || sellers.length === 0) return [];
  // 同一ショップ名は除去（同じ店が複数入るのを防ぐ）
  const unique = [];
  const seen = new Set();
  for (const s of sellers) {
    const key = (s.shop_name || s.name || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...s, isOfficial: /公式|直営|メーカー/.test(key) });
  }

  const withPrice = unique.filter(s => (s.price || 0) > 0);
  if (withPrice.length === 0) return unique;

  // 最安値
  const cheapest = withPrice.reduce((a, b) => (a.price <= b.price ? a : b));
  cheapest.role = 'cheapest';

  // 高評価（最安値と異なる + レビューあり、評価値→レビュー数 の順で比較）
  const topRated = withPrice
    .filter(s => s !== cheapest && (s.reviews_count || 0) > 0)
    .sort((a, b) => {
      if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
      return (b.reviews_count || 0) - (a.reviews_count || 0);
    })[0];
  if (topRated) topRated.role = 'top_rated';

  // 公式（まだロールが付いてないもの優先）
  const official = unique.find(s => s.isOfficial && !s.role)
    || unique.find(s => s.isOfficial);
  if (official && !official.role) official.role = 'official';

  return unique;
}

// --- seller オブジェクトを sellers JSONB 用の形式に整形 ---
function serializeSeller(s) {
  return {
    name: s.shop_name || s.name,
    price: s.price,
    url: s.url,
    shipping: s.shipping ?? 0,
    points: s.points ?? 0,
    rating: s.rating || 0,
    reviews_count: s.reviews_count || 0,
    role: s.role || null,
    isOfficial: !!s.isOfficial,
  };
}

// --- 商品名キー化（重複判定用） ---
function productNameKey(name) {
  return (name || '').replace(/[\s　]/g, '').toLowerCase().slice(0, 30);
}

// --- メイン同期処理 ---
async function syncCategory(cat, log, opts = {}, startDelay = 0) {
  const {
    limitCount = 30,
    includeYahooSupplement = true,
    includeYahooPrice = true,
    deadline = 0,
  } = opts;

  log.push(`📦 カテゴリ「${cat.name}」の同期開始...`);

  if (!RAKUTEN_APP_ID) {
    log.push(`  ⚠️ RAKUTEN_APP_IDが設定されていません`);
  }

  // 楽天レート制限回避: カテゴリごとに開始をずらす
  if (startDelay > 0) await new Promise(r => setTimeout(r, startDelay));

  let rakutenItems = [];
  let rakutenFailed = false;

  try {
    // 検索API（レビュー数順、2ページ分）。ジャンルIDが無効なカテゴリがあるため genreId は付けず、
    // normalizeRakutenItems の REQUIRED_KEYWORDS で関連性を担保する（無効ジャンルでの0件・Yahoo頼みを回避）。
    const res1 = await fetchRakutenSearch(cat.keyword, null, 1);
    const res2 = await fetchRakutenSearch(cat.keyword, null, 2);
    rakutenItems = [
      ...normalizeRakutenItems(res1.Items || [], cat.name),
      ...normalizeRakutenItems(res2.Items || [], cat.name),
    ];
  } catch (e) {
    log.push(`  ⚠️ 楽天検索API失敗: ${e.message}`);
    rakutenFailed = true;
  }

  // ランキングAPIも追加取得（ジャンルID依存。失敗しても検索で賄えるため致命視しない）
  try {
    const rankingData = await fetchRakutenRanking(cat.genreId);
    const rankingItems = normalizeRakutenItems(rankingData.Items || [], cat.name);
    rakutenItems = [...rakutenItems, ...rankingItems];
  } catch (e) {
    log.push(`  ⚠️ 楽天ランキングAPI失敗（検索で代替）: ${e.message}`);
    // 検索が成功していれば致命的ではないので rakutenFailed は立てない（Yahoo補完は維持）
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

  // ブロック済み商品を取得（is_blocked=true の rakuten_item_code と name）
  const { data: blocklist } = await supabase
    .from('products')
    .select('rakuten_item_code, name')
    .eq('is_blocked', true);
  const blockedCodes = new Set((blocklist || []).map(b => b.rakuten_item_code).filter(Boolean));
  // 同名商品が別ショップコードで再登録されるケースも弾く
  const blockedNames = new Set((blocklist || []).map(b => productNameKey(b.name)).filter(Boolean));

  const productsToProcess = deduplicated.slice(0, limitCount);
  log.push(`  ⏱ 上位 ${productsToProcess.length}件を保存します`);

  for (let i = 0; i < productsToProcess.length; i++) {
    if (deadline && Date.now() > deadline) { log.push(`  ⏱ 時間切れ: ${savedCount}件で打ち切り`); break; }
    const product = productsToProcess[i];
    product.popularity_rank = i + 1;

    // ブロックリストチェック（コードと名前の両方で判定）
    if (blockedCodes.has(product.rakuten_item_code)) continue;
    if (blockedNames.has(productNameKey(product.name))) continue;

    const shopInfo = product._rakuten_shop;
    const allRakutenSellers = product._all_sellers && product._all_sellers.length > 0
      ? product._all_sellers
      : (shopInfo ? [shopInfo] : []);
    delete product._rakuten_shop;
    delete product._all_sellers;

    try {
      // 既存商品をrakuten_item_codeで検索
      let productId;
      const { data: existing } = await supabase
        .from('products')
        .select('id, sub_category')
        .eq('rakuten_item_code', product.rakuten_item_code)
        .single();

      if (existing) {
        // 更新
        productId = existing.id;
        // 格下げ防止: 既に具体的なサブカテゴリが付いている商品を「本体」で上書きしない
        // （path2のサブクエリで確定済みのタブ振り分けを、広い検索の再分類で空に戻さない）
        const keepSub = (existing.sub_category && existing.sub_category !== '本体')
          ? existing.sub_category
          : product.sub_category;
        await supabase
          .from('products')
          .update({
            name: product.name,
            image_url: product.image_url,
            rating: product.rating,
            reviews_count: product.reviews_count,
            popularity_rank: product.popularity_rank,
            sub_category: keepSub,
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

      // --- 楽天ショップ情報をshops_pricesに保存（同一商品の複数seller を集約） ---
      const rankedRakuten = assignRoles(allRakutenSellers);
      const rakutenPrices = rankedRakuten.filter(s => (s.price || 0) > 0).map(s => s.price);
      const rakutenLowest = rakutenPrices.length > 0 ? Math.min(...rakutenPrices) : (shopInfo?.price || 0);
      const rakutenHasOfficial = rankedRakuten.some(s => s.isOfficial);

      await supabase
        .from('shops_prices')
        .upsert([{
          product_id: productId,
          shop_name: '楽天市場',
          shop_type: rakutenHasOfficial ? 'official' : 'mall',
          lowest_price: rakutenLowest,
          source: 'rakuten',
          sellers: JSON.stringify(rankedRakuten.slice(0, 5).map(serializeSeller))
        }], { onConflict: 'product_id,shop_name', ignoreDuplicates: false });

      // --- Yahoo価格を取得（上位5件のみ詳細調査、複数 seller を集約） ---
      if (includeYahooPrice && i < 5) {
        const searchKeyword = product.name.split(/[\s　]+/).slice(0, 3).join(' ');
        const yahooResults = await fetchYahooPrice(searchKeyword);

        if (yahooResults.length > 0) {
          const yahooSellers = yahooResults.map(r => ({
            shop_name: r.name || 'Yahoo!ショッピング',
            price: r.price,
            url: r.url,
            shipping: 0,
            points: 0,
            rating: r.rating || 0,
            reviews_count: r.reviews_count || 0,
          }));
          const rankedYahoo = assignRoles(yahooSellers);
          const yahooPrices = rankedYahoo.filter(s => (s.price || 0) > 0).map(s => s.price);
          const yahooLowest = yahooPrices.length > 0 ? Math.min(...yahooPrices) : 0;
          const yahooHasOfficial = rankedYahoo.some(s => s.isOfficial);

          await supabase
            .from('shops_prices')
            .upsert([{
              product_id: productId,
              shop_name: 'Yahoo!ショッピング',
              shop_type: yahooHasOfficial ? 'official' : 'mall',
              lowest_price: yahooLowest,
              source: 'yahoo',
              sellers: JSON.stringify(rankedYahoo.slice(0, 5).map(serializeSeller))
            }], { onConflict: 'product_id,shop_name', ignoreDuplicates: false });
        }
      }

      savedCount++;

    } catch (e) {
      log.push(`  ⚠️ ${product.name.slice(0, 20)}... エラー: ${e.message}`);
    }
  }

  log.push(`  ✅ ${savedCount}件保存完了`);
  return savedCount;
}

// --- ギフトサブカテゴリを専用クエリで補完取得 ---
// 各サブカテゴリ1ページ分（30件）を並列fetch → 合計最大180件の追加ギフト商品
// --- サブカテゴリ補完: 1商品をproducts/shops_pricesに保存（sub_categoryは呼び出し側で確定済み） ---
async function saveSubCatProduct(product, seller, source, shopName) {
  try {
    const { data: existing } = await supabase
      .from('products').select('id')
      .eq('rakuten_item_code', product.rakuten_item_code).single();

    let productId;
    if (existing) {
      productId = existing.id;
      await supabase.from('products').update({
        name: product.name,
        image_url: product.image_url,
        rating: product.rating,
        reviews_count: product.reviews_count,
        sub_category: product.sub_category,
        brand: product.brand || undefined,
        last_synced_at: product.last_synced_at,
      }).eq('id', productId);
    } else {
      const { data: inserted, error: ie } = await supabase.from('products').insert([product]).select('id');
      if (ie) return false;
      productId = inserted[0].id;
    }

    await supabase.from('shops_prices').upsert([{
      product_id: productId,
      shop_name: shopName,
      shop_type: 'mall',
      lowest_price: seller.price,
      source,
      sellers: JSON.stringify([serializeSeller(seller)]),
    }], { onConflict: 'product_id,shop_name', ignoreDuplicates: false });

    return true;
  } catch {
    return false;
  }
}

// --- 同時実行プール: items を最大 concurrency 並列で処理。
// 各起動の前に gapMs だけ待ってAPIレート制限を緩和し、deadline を過ぎたら新規投入を止める。 ---
async function runWithConcurrency(items, worker, { concurrency = 2, gapMs = 0, deadline } = {}) {
  const results = new Array(items.length);
  let idx = 0;
  async function lane() {
    while (true) {
      const myIdx = idx++;
      if (myIdx >= items.length) break;
      if (deadline && Date.now() > deadline) {
        results[myIdx] = { skipped: true, item: items[myIdx] };
        continue;
      }
      if (gapMs) await new Promise(r => setTimeout(r, gapMs));
      try {
        results[myIdx] = await worker(items[myIdx], myIdx);
      } catch (e) {
        results[myIdx] = { error: e, item: items[myIdx] };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return results;
}

// --- サブカテゴリ補完の共通処理: 楽天検索を優先し、失敗/空ならYahoo検索にフォールバック ---
// sub_category は subQueries の sub を強制設定するため、カテゴリのサブタブに確実に商品が並ぶ。
// 同時実行2・固定間隔・ソフト締切で60秒制限内に収める。新規商品には 1000番台の
// popularity_rank を付与（広い検索の人気商品=1〜を上位に保ちつつ、サブ専用品も順序付きで表示）。
async function syncSubCategoryQueries(log, { category, genreId, ngKeywords, subQueries, emoji, deadline }) {
  const worker = async (q, qIdx) => {
    // 1) 楽天を試す（サブ補完はジャンル非constraintで広く探す。q.genreId 指定時のみ絞る）
    //    ジャンル非制約で広く探す代わりに、カテゴリの必須キーワード(REQUIRED)で関連性を担保し
    //    無関係商品（ペット・大人用・他カテゴリ品）の混入を防ぐ。
    const required = REQUIRED_KEYWORDS[category] || [];
    const isRelevant = (n) => required.length === 0 || required.some(kw => n.includes(kw));
    let rakutenItems = [];
    try {
      const res = await fetchRakutenSearch(q.keyword, q.genreId ?? null, 1);
      rakutenItems = (res.Items || [])
        .filter(item => !ngKeywords.some(kw => item.Item.itemName.includes(kw)))
        .filter(item => isRelevant(item.Item.itemName));
    } catch {
      rakutenItems = [];
    }

    let saved = 0;
    let source = '楽天';
    const rankBase = 1000 + qIdx * 50; // サブクエリ毎に別バンド（順序の重複を避ける）

    if (rakutenItems.length > 0) {
      let j = 0;
      for (const item of rakutenItems.slice(0, 20)) {
        if (deadline && Date.now() > deadline) break; // 時間切れは打ち切り（504回避）
        const rawName = item.Item.itemName;
        const rawImg = item.Item.largeImageUrls?.[0]?.imageUrl || item.Item.mediumImageUrls?.[0]?.imageUrl || '';
        const product = {
          name: cleanName(rawName),
          category,
          sub_category: q.sub,
          brand: extractBrand(rawName),
          image_url: rawImg.replace(/_ex=\d+x\d+/, '_ex=640x640'),
          rating: parseFloat(item.Item.reviewAverage) || 0,
          reviews_count: parseInt(item.Item.reviewCount) || 0,
          rakuten_item_code: item.Item.itemCode,
          is_market_wide: true,
          popularity_rank: rankBase + j,
          last_synced_at: new Date().toISOString(),
        };
        const seller = {
          shop_name: item.Item.shopName || '楽天市場',
          price: item.Item.itemPrice,
          url: item.Item.affiliateUrl || item.Item.itemUrl,
          shipping: item.Item.postageFlag === 1 ? 0 : null,
          points: item.Item.pointRate || 0,
          rating: parseFloat(item.Item.reviewAverage) || 0,
          reviews_count: parseInt(item.Item.reviewCount) || 0,
        };
        if (await saveSubCatProduct(product, seller, 'rakuten', '楽天市場')) saved++;
        j++;
      }
    } else {
      // 2) 楽天が全滅/空 → Yahooフォールバック（広めキーワードで必要数を確保）
      source = 'Yahoo';
      const yahooKeyword = q.yahooKeyword || q.keyword;
      const yahooItems = (await fetchYahooSearchFallback(yahooKeyword, category))
        .filter(it => !ngKeywords.some(kw => it.name.includes(kw)))
        .filter(it => isRelevant(it.name));
      let j = 0;
      for (const it of yahooItems.slice(0, 20)) {
        if (deadline && Date.now() > deadline) break; // 時間切れは打ち切り（504回避）
        const product = {
          name: it.name,
          category,
          sub_category: q.sub,
          brand: it.brand,
          image_url: it.image_url,
          rating: it.rating,
          reviews_count: it.reviews_count,
          rakuten_item_code: it.rakuten_item_code,
          is_market_wide: true,
          popularity_rank: rankBase + j,
          last_synced_at: it.last_synced_at,
        };
        if (await saveSubCatProduct(product, it._rakuten_shop, 'yahoo', 'Yahoo!ショッピング')) saved++;
        j++;
      }
    }

    return { sub: q.sub, saved, source };
  };

  const results = await runWithConcurrency(subQueries, worker, { concurrency: 3, gapMs: 500, deadline });
  results.forEach(r => {
    if (!r) return;
    if (r.skipped) {
      log.push(`  ⏭ ${category}補完「${r.item?.sub || ''}」: 時間切れスキップ`);
    } else if (r.error) {
      log.push(`  ⚠️ ${category}補完「${r.item?.sub || ''}」: ${r.error.message}`);
    } else {
      log.push(`  ${emoji} ${category}補完「${r.sub}」: ${r.saved}件 (${r.source})`);
    }
  });
}

// --- カテゴリの subs（CATEGORY定義）からサブクエリを組み立てて補完取得（全カテゴリ共通） ---
async function syncCategorySubQueries(cat, log, deadline) {
  if (!cat.subs || cat.subs.length === 0) return;

  // 現在のサブ別件数を取得し、少ない順（空を優先）に並べ替える。
  // 時間切れで打ち切られても、まだ空のサブが先に埋まるようにする。
  const counts = {};
  try {
    const { data } = await supabase
      .from('products')
      .select('sub_category')
      .eq('category', cat.name)
      .or('is_blocked.is.null,is_blocked.eq.false');
    for (const r of (data || [])) counts[r.sub_category] = (counts[r.sub_category] || 0) + 1;
  } catch { /* 取得失敗時は宣言順のまま */ }
  const sortedSubs = [...cat.subs].sort((a, b) => (counts[a.sub] || 0) - (counts[b.sub] || 0));

  const subQueries = sortedSubs.flatMap(s =>
    (s.keywords || []).map(k => ({ keyword: k, yahooKeyword: s.yahooKeyword || k, sub: s.sub }))
  );
  if (subQueries.length === 0) return;
  const ngKeywords = [...NG_KEYWORDS, ...(CATEGORY_NG_KEYWORDS[cat.name] || [])];
  await syncSubCategoryQueries(log, {
    category: cat.name,
    genreId: cat.genreId,
    ngKeywords,
    subQueries,
    emoji: '🗂',
    deadline,
  });
}

// --- Vercel Cron エンドポイント ---
async function backfillSubCategories(log) {
  let offset = 0;
  const batchSize = 200;
  let totalUpdated = 0;
  let totalErrors = 0;

  while (true) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, category, name')
      .range(offset, offset + batchSize - 1);

    if (error || !products || products.length === 0) break;

    // upsert は NOT NULL 制約に引っかかるため、個別 update を並列実行
    const results = await Promise.all(
      products.map(p =>
        supabase
          .from('products')
          .update({ sub_category: extractSubCategory(p.category, p.name) })
          .eq('id', p.id)
      )
    );

    const errors = results.filter(r => r.error);
    totalErrors += errors.length;
    if (errors.length > 0) {
      log.push(`⚠️ offset ${offset}: ${errors.length}件エラー: ${errors[0].error.message}`);
    }

    totalUpdated += products.length;
    log.push(`📝 backfill: ${totalUpdated}件処理済み`);
    if (products.length < batchSize) break;
    offset += batchSize;
  }

  log.push(`✅ backfill完了: 合計${totalUpdated}件 (エラー${totalErrors}件)`);
  return totalUpdated;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Cron認証（Vercel Cronは CRON_SECRET ヘッダーを送信する）
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // 手動実行（?manual=1）またはCron認証
  const isManual = searchParams.get('manual') === '1';
  const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isManual && !isCronAuth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 楽天API疎通テスト（?debug=rakuten）: Supabase書き込みなしで
  // 検索APIを1回だけ叩き、生のステータス＋レスポンスを返す（高速・原因切り分け用）
  if (searchParams.get('debug') === 'rakuten') {
    const dbgUrl = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}&keyword=${encodeURIComponent('紙おむつ')}&hits=3&affiliateId=${RAKUTEN_AFFILIATE_ID}`;
    try {
      const { statusCode, text } = await nodeHttpsGet(dbgUrl, rakutenHeaders());
      return Response.json({
        statusCode,
        referer: RAKUTEN_REFERER,
        appIdSet: !!RAKUTEN_APP_ID,
        accessKeySet: !!RAKUTEN_ACCESS_KEY,
        body: text.slice(0, 500),
      });
    } catch (e) {
      return Response.json({ error: e.message, referer: RAKUTEN_REFERER });
    }
  }

  // カテゴリ×サブカテゴリの件数監査（?audit=1）: 読み取り専用。
  // CATEGORIES の宣言サブと突合し、0件のサブカテゴリ(emptySubs)を返す（施策前後の通信簿）。
  if (searchParams.get('audit') === '1') {
    const byCategory = {};
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('products')
        .select('category, sub_category')
        .or('is_blocked.is.null,is_blocked.eq.false')
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      for (const r of data) {
        const c = r.category || '(none)';
        const s = r.sub_category || '(none)';
        byCategory[c] = byCategory[c] || { total: 0, subs: {} };
        byCategory[c].total++;
        byCategory[c].subs[s] = (byCategory[c].subs[s] || 0) + 1;
      }
      if (data.length < pageSize) break;
      from += pageSize;
    }
    const emptySubs = [];
    const thinSubs = []; // 30件未満（目標未達）
    for (const cat of CATEGORIES) {
      const got = byCategory[cat.name]?.subs || {};
      for (const s of (cat.subs || [])) {
        const n = got[s.sub] || 0;
        if (n === 0) emptySubs.push(`${cat.name}>${s.sub}`);
        else if (n < 30) thinSubs.push(`${cat.name}>${s.sub} (${n})`);
      }
    }
    return Response.json({ ok: true, byCategory, emptySubs, thinSubs });
  }

  const log = [];
  // ソフト締切（リクエスト開始から50秒）。サブカテゴリ補完はこれを過ぎたら新規投入を止める。
  const deadline = Date.now() + 52000;

  // 一括バックフィル（?backfill=1）: 全商品のsub_categoryを再計算・更新
  if (searchParams.get('backfill') === '1') {
    log.push(`🔄 sub_category バックフィル開始: ${new Date().toISOString()}`);
    const count = await backfillSubCategories(log);
    return Response.json({ ok: true, backfilled: count, log });
  }

  log.push(`🚀 同期開始: ${new Date().toISOString()}`);

  let totalSaved = 0;

  let targetCategories = CATEGORIES;
  const filterCat = searchParams.get('category');
  const batch = searchParams.get('batch'); // '1' or '2'

  if (filterCat) {
    targetCategories = CATEGORIES.filter(c => c.name === filterCat);
    if (targetCategories.length === 0) {
      return Response.json({ error: `Category "${filterCat}" not found` }, { status: 400 });
    }
    log.push(`🎯 フィルタ適用: カテゴリ「${filterCat}」のみ同期します`);
  } else if (batch) {
    // 1バッチ=1カテゴリ（ジャンル非制約で取得量が増え、2カテゴリだと60秒制限を超えたため）。
    // 全15カテゴリ → batch 1〜15。vercel.json で時間帯を分散。
    const BATCH_SIZE = 1;
    const batchNum = parseInt(batch, 10);
    if (!Number.isInteger(batchNum) || batchNum < 1) {
      return Response.json({ error: `Invalid batch "${batch}"` }, { status: 400 });
    }
    targetCategories = CATEGORIES.slice((batchNum - 1) * BATCH_SIZE, batchNum * BATCH_SIZE);
    log.push(`📦 バッチ${batchNum}: ${targetCategories.map(c => c.name).join('、') || '(対象なし)'}`);
  }

  // カテゴリ指定あり = 単発テスト用（軽量処理）、それ以外 = 通常同期（フル処理）
  const isSingleCategory = !!filterCat;
  const opts = isSingleCategory
    ? { limitCount: 20, includeYahooSupplement: false, includeYahooPrice: false, deadline }
    : { limitCount: 30, includeYahooSupplement: true, includeYahooPrice: false, deadline };

  // カテゴリを並列処理（楽天レート制限回避のため1.5秒ずつずらして開始）
  const results = await Promise.allSettled(
    targetCategories.map((cat, idx) => syncCategory(cat, log, opts, idx * 1500))
  );
  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') {
      totalSaved += r.value || 0;
    } else {
      log.push(`❌ カテゴリ「${targetCategories[idx].name}」で致命的エラー: ${r.reason?.message || r.reason}`);
    }
  });

  log.push(`\n🎉 同期完了: 合計 ${totalSaved}件保存`);

  // サブカテゴリ補完: バッチ内の各カテゴリの subs を専用キーワードで取得し、
  // 各サブタブに確実に商品を並べる（全カテゴリ共通）。ソフト締切超過分は次回に回す。
  if (!filterCat) {
    for (const cat of targetCategories) {
      if (Date.now() > deadline) {
        log.push(`⏭ 時間切れ: 「${cat.name}」以降のサブカテゴリ補完を次回に回します`);
        break;
      }
      try {
        log.push(`\n🗂 「${cat.name}」サブカテゴリ補完同期開始...`);
        await syncCategorySubQueries(cat, log, deadline);
      } catch (e) {
        log.push(`⚠️ 「${cat.name}」サブ補完失敗: ${e.message}`);
      }
    }
  }

  // 価格アラートのトリガー判定 + Push通知送信
  try {
    const notifyResult = await checkAndNotifyPriceAlerts();
    log.push(`🔔 アラート確認: ${notifyResult.checked}件中 ${notifyResult.triggered}件トリガー、${notifyResult.pushed}件にプッシュ送信`);
  } catch (e) {
    log.push(`⚠️ アラート確認失敗: ${e.message}`);
  }

  return Response.json({
    success: true,
    totalSaved,
    log,
    timestamp: new Date().toISOString()
  }, { status: 200 });
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
