// セール表示の共通ヘルパー（サーバー/クライアント両用・純粋関数のみ）。
// 不定期セール（プライムデー・楽天スーパーセール等）の実データは
// Supabase の sales テーブルで管理する（?admin=1 → セール管理から登録）。
// サーバー側の取得は src/lib/salesServer.js を使う。

// DBの行（snake_case）を表示用の形へ正規化
export const normalizeSaleRow = (r) => ({
  id: r.id,
  shop: r.shop,
  name: r.name,
  shortName: r.short_name ?? r.shortName ?? null,
  start: r.start_at ?? r.start,
  mainStart: r.main_start_at ?? r.mainStart ?? null,
  end: r.end_at ?? r.end,
  periodLabel: r.period_label ?? r.periodLabel ?? null,
});

// 開催中のセール（なければ null）
export const pickActiveSale = (sales, now = Date.now()) =>
  (sales || []).find((s) => s && now >= Date.parse(s.start) && now < Date.parse(s.end)) || null;

// 「先行セール開催中」/「開催中」の表示用ラベル
export const saleStatusLabel = (sale, now = Date.now()) =>
  sale.mainStart && now < Date.parse(sale.mainStart) ? '先行セール開催中' : '開催中';

// ショップボタンに添える短いバッジ文言（例: プライムデー先行セール中！）
export const saleBadgeLabel = (sale, now = Date.now()) => {
  const name = sale.shortName || sale.name;
  return sale.mainStart && now < Date.parse(sale.mainStart)
    ? `${name}先行セール中！`
    : `${name}開催中！`;
};

// セールがそのショップ行に該当するか（表示名ベースの判定。
// rakuten/yahoo/amazon のセールを同じ仕組みでバッジ表示できる）
export const saleMatchesShop = (sale, shopName = '', source = '') => {
  if (!sale) return false;
  if (source && source === sale.shop) return true;
  if (sale.shop === 'rakuten') return shopName.includes('楽天');
  if (sale.shop === 'yahoo') return /yahoo|ヤフー/i.test(shopName);
  if (sale.shop === 'amazon') return /amazon/i.test(shopName);
  return false;
};

// 毎月1日の「ファーストデイ」が、大型キャンペーンと重なって
// 実施されない月の例外（YYYY-MM-DD・JST）。判明した分だけ列挙する。
// 2026-08-01: 爆買WEEK(7/31〜8/2)開催のためファーストデイなし。
export const YAHOO_FIRST_DAY_SKIP = ['2026-08-01'];

// JSTの YYYY-MM-DD を返す（Date.now() ベースの共通ヘルパー）
const toJstYMD = (jstDate) =>
  `${jstDate.getUTCFullYear()}-${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`;

// 固定ルールの「今日のお得な日」（JST基準・毎月更新不要）。
// 該当ショップ行のバッジ表示に使う。ショップごとに還元率が高いものを1つ返す。
export const getTodayDeals = (now = Date.now()) => {
  const jst = new Date(now + 9 * 60 * 60 * 1000);
  const day = jst.getUTCDate();
  const dow = jst.getUTCDay();

  const deals = [];
  // 楽天（還元率が高い方を優先）
  if (day === 18) deals.push({ shop: 'rakuten', label: '本日ご愛顧感謝デー' });
  else if (day % 5 === 0) deals.push({ shop: 'rakuten', label: '本日5と0のつく日' });
  // Yahoo!ショッピング
  if (day === 1 && !YAHOO_FIRST_DAY_SKIP.includes(toJstYMD(jst)))
    deals.push({ shop: 'yahoo', label: '本日ファーストデイ' });
  else if (day === 5 || day === 15 || day === 25) deals.push({ shop: 'yahoo', label: '本日5のつく日' });
  else if (day === 11 || day === 22) deals.push({ shop: 'yahoo', label: '本日ヤフショ感謝デー' });
  else if (dow === 0) deals.push({ shop: 'yahoo', label: '本日プレミアムな日曜日' });
  return deals;
};

// ショップ行のバッジ判定: 不定期セール優先、なければ固定のお得な日
export const getShopBadge = (activeSale, todayDeals, shopName = '', source = '') => {
  if (activeSale && saleMatchesShop(activeSale, shopName, source)) {
    return { kind: 'sale', label: saleBadgeLabel(activeSale) };
  }
  const deal = (todayDeals || []).find((d) => saleMatchesShop({ shop: d.shop }, shopName, source));
  return deal ? { kind: 'deal', label: deal.label } : null;
};

// 年間の買い時パターン（常設コンテンツ。/sale ページで表示）
export const SALE_CALENDAR = [
  {
    shop: '楽天市場',
    events: [
      { name: 'お買い物マラソン', timing: 'ほぼ毎月開催', tip: '複数ショップ買い回りでポイント最大10倍。おむつ等の消耗品をまとめ買いする好機' },
      { name: '楽天スーパーセール', timing: '3月・6月・9月・12月', tip: '半額品も出る最大級セール。ベビーカー等の大物はここが狙い目' },
      { name: '5と0のつく日', timing: '毎月5・10・15・20・25・30日', tip: '楽天カード利用でポイントアップ。急ぎの買い物はこの日に合わせる' },
    ],
  },
  {
    shop: 'Yahoo!ショッピング',
    events: [
      { name: '5のつく日', timing: '毎月5・15・25日', tip: 'PayPayポイントアップの定番日' },
      { name: 'ファーストデイ', timing: '毎月1日', tip: '月初のポイントアップ日。ただし大型キャンペーンと重なる月は実施されないこともある' },
      { name: 'ヤフショ感謝デー', timing: '毎月11・22日', tip: 'ゾロ目の日のポイントアップ。5のつく日を逃したときの受け皿に' },
      { name: '爆買WEEK・超PayPay祭', timing: '年数回（不定期）', tip: 'まとめ買いするほど付与率が上がる期間。開催中はアプリのお得情報タブで告知' },
    ],
  },
  {
    shop: 'Amazon',
    events: [
      { name: 'プライムデー', timing: '毎年7月', tip: 'プライム会員限定の年最大セール。おむつ・おしりふき等の消耗品の定番買いだめ時期' },
      { name: 'ブラックフライデー', timing: '11月下旬', tip: '会員以外も対象。クリスマス前のおもちゃ購入に' },
      { name: 'スマイルSALE', timing: '年5回程度（1月・3月・5月・8月末など）', tip: '会員以外も対象の定期セール。プライムデーとブラックフライデーの谷間を埋める買い時' },
    ],
  },
];

// セール特集で検索リンクを並べる狙い目カテゴリ（消耗品・定番を優先）。
// 開催中セールのショップ（楽天/Yahoo/Amazon）に応じたリンク先で使う。
export const SALE_KEYWORDS = [
  { label: 'おむつ', keyword: 'おむつ', category: 'おむつ' },
  { label: 'おしりふき', keyword: 'おしりふき', category: 'おむつ' },
  { label: '粉ミルク・液体ミルク', keyword: '粉ミルク', category: 'ミルク・授乳' },
  { label: '離乳食・ベビーフード', keyword: 'ベビーフード', category: '離乳食・食器' },
  { label: 'ベビー服', keyword: 'ベビー服', category: 'ウェア' },
  { label: 'おもちゃ・知育玩具', keyword: 'ベビー おもちゃ', category: 'おもちゃ' },
  { label: '抱っこ紐', keyword: '抱っこ紐', category: '抱っこ紐' },
  { label: 'ベビーカー', keyword: 'ベビーカー', category: 'ベビーカー' },
  { label: 'チャイルドシート', keyword: 'チャイルドシート', category: '車用品' },
  { label: 'ベビーソープ・保湿', keyword: 'ベビーソープ', category: 'お風呂用品' },
];
