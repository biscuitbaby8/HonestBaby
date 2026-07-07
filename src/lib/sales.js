// セール開催情報の単一の設定源。
// 次回のセールは、この配列に日付と文言を追加/書き換えるだけで
// /sale ページ・トップバナー・商品ページのラベルが切り替わる。
// ISR（最大1時間）の遅延があるため、開始・終了の境界は多少ズレてよい前提。
export const SALES = [
  {
    id: 'amazon-prime-day-2026-07',
    shop: 'amazon',
    name: 'Amazonプライムデー',
    // 先行セール開始〜本セール終了（JST）
    start: '2026-07-07T00:00:00+09:00',
    mainStart: '2026-07-10T00:00:00+09:00',
    end: '2026-07-14T00:00:00+09:00', // 7/13 23:59 まで（終端は排他的）
    periodLabel: '先行セール 7/7(火)〜7/9(木)・本セール 7/10(金)〜7/13(月)',
  },
];

// 開催中のセール（なければ null）
export const getActiveSale = (now = Date.now()) =>
  SALES.find((s) => now >= Date.parse(s.start) && now < Date.parse(s.end)) || null;

// 「先行セール開催中」/「開催中」の表示用ラベル
export const saleStatusLabel = (sale, now = Date.now()) =>
  sale.mainStart && now < Date.parse(sale.mainStart) ? '先行セール開催中' : '開催中';

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
      { name: '超PayPay祭', timing: '年数回（不定期）', tip: '付与率が大きく上がる期間。開催中はアプリのお得情報タブで告知' },
    ],
  },
  {
    shop: 'Amazon',
    events: [
      { name: 'プライムデー', timing: '毎年7月', tip: 'プライム会員限定の年最大セール。おむつ・おしりふき等の消耗品の定番買いだめ時期' },
      { name: 'ブラックフライデー', timing: '11月下旬', tip: '会員以外も対象。クリスマス前のおもちゃ購入に' },
      { name: 'スマイルセール・初売り', timing: '1月ほか不定期', tip: '福袋・日用品まとめ買いに' },
    ],
  },
];

// セール特集でAmazon検索リンクを並べる狙い目カテゴリ（消耗品・定番を優先）
export const AMAZON_SALE_KEYWORDS = [
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
