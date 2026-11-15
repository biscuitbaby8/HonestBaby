// /iherb 特集で紹介する厳選アイテム。
//
// iHerbは価格を取れる公開APIが無く、商品ページも自動取得できない（ボット対策あり）。
// そのため iHerb 側は「iHerbで見る」リンク（Partnerize経由のアフィリエイト）だけにし、
// 同じ商品が楽天・Yahoo!でも買えるものは、そちらの価格を毎日自動で比較して並べる。
//
// 表現の決まり（薬機法・景表法）:
// - サプリは「成分」と「使い方」の説明にとどめ、効果・効能をうたわない。
// - 「〇〇に効く」「〇〇を防ぐ」「医師推奨」など、裏付けの無い言い回しは使わない。
//
// 比較の項目（compare: true のとき）:
//   keyword  楽天・Yahoo!の検索語（半角1文字の語を入れない。楽天APIが拒否する）
//   must     商品名に必ず含まれる語（AND of ORs）／ not 含まれていたら別商品
//   unit     内容量の単位（ml / g / 粒）。perMin〜perMax は1個あたりの量の範囲で、
//            これに収まらない出品（別サイズ・お試し品など）は比べない。
//   unitMin〜unitMax は1単位あたりの価格の妥当な範囲（解析ミス・別商品の混入よけ）。

export const IHERB_SECTIONS = [
  { key: 'baby-supplement', title: '赤ちゃんのサプリ・ドロップ' },
  { key: 'baby-skin', title: '赤ちゃんのスキンケア・ソープ' },
  { key: 'mama-supplement', title: '妊娠中・授乳中のサプリ' },
  { key: 'mama-care', title: 'ママのボディケア・授乳ケア' },
];

const PICKS = [
  // --- 赤ちゃんのサプリ・ドロップ ---
  {
    id: 'biogaia-protectis-d', section: 'baby-supplement',
    brand: 'BioGaia（バイオガイア）', name: 'プロテクティス ベビードロップス ビタミンD',
    spec: 'iHerbでは10ml、国内では5mlの流通が多い',
    point: 'ロイテリ菌（乳酸菌の一種）とビタミンDを配合したドロップ。1日5滴を目安に、ミルクや離乳食に混ぜて使います。',
    who: '乳酸菌とビタミンDを1本でまとめて取り入れたい人',
    iherbKw: 'BioGaia Protectis Baby Drops Vitamin D',
    compare: true, keyword: 'バイオガイア ドロップ ビタミンD',
    must: [['バイオガイア', 'BioGaia', 'biogaia', 'BIOGAIA'], ['ドロップ', 'drops', 'Drops'], ['ビタミンD', 'ビタミン D', 'Vitamin D', 'vitamin D', 'VitaminD']],
    not: ['タブレット', 'チュアブル', 'カプセル', 'グミ', '大人'],
    unit: 'ml', perMin: 4, perMax: 11, unitMin: 150, unitMax: 1500,
  },
  {
    id: 'carlson-baby-d3', section: 'baby-supplement',
    brand: 'Carlson（カールソン）', name: 'ベビーズ スーパーデイリー D3（400IU）',
    spec: '11ml（1滴でビタミンD 400IU）',
    point: '1滴あたりビタミンD3を400IU含む無味・無香料の液体。量が少ないので、授乳前に指や乳首に1滴つける使い方もされています。',
    who: 'ビタミンDだけを、できるだけ少ない量で与えたい人',
    iherbKw: "Carlson Baby's Super Daily D3",
    compare: true, keyword: 'カールソン ベビー D3',
    must: [['カールソン', 'Carlson', 'carlson'], ['ベビー', 'Baby', 'baby']],
    not: ['キッズ', 'Kid', 'kid', '大人', 'チュアブル'],
    unit: 'ml', perMin: 9, perMax: 12, unitMin: 80, unitMax: 900,
  },
  {
    id: 'nordic-baby-dha', section: 'baby-supplement',
    brand: 'Nordic Naturals（ノルディックナチュラルズ）', name: "ベビーズ DHA（液体）",
    spec: '60ml',
    point: '魚油由来のDHA・EPAに、ビタミンD3を加えた液体タイプ。スポイトで量を測り、ミルクや離乳食に混ぜて使います。',
    who: '魚を食べる量が少ない時期に、DHAを取り入れたい人',
    iherbKw: "Nordic Naturals Baby's DHA",
    compare: false,
  },
  {
    id: 'cgn-baby-d3', section: 'baby-supplement',
    brand: 'California Gold Nutrition', name: 'ベビー ビタミンD3 リキッド',
    spec: '10ml',
    point: 'iHerbのオリジナルブランド。ビタミンD3だけのシンプルな液体で、iHerbの中では手に取りやすい価格帯です。',
    who: 'iHerbで他の商品とまとめて買う人',
    iherbKw: 'California Gold Nutrition Baby Vitamin D3 Liquid',
    compare: false,
  },

  // --- 赤ちゃんのスキンケア・ソープ ---
  {
    id: 'weleda-calendula-lotion', section: 'baby-skin',
    brand: 'Weleda（ヴェレダ）', name: 'カレンドラ ベビーミルクローション',
    spec: '200ml',
    point: 'カレンドラ（キンセンカ）のエキスを配合した全身用ローション。のびがよく、お風呂上がりの全身の保湿に使いやすいタイプです。',
    who: '香りが強すぎない、植物由来のローションを探している人',
    iherbKw: 'Weleda Baby Calendula Body Lotion',
    compare: true, keyword: 'ヴェレダ カレンドラ ベビーミルクローション',
    must: [['ヴェレダ', 'WELEDA', 'Weleda', 'weleda'], ['カレンドラ'], ['ミルクローション', 'ボディローション', 'ローション']],
    not: ['クリーム', 'オイル', 'ウォッシュ', 'バーム'],
    unit: 'ml', perMin: 190, perMax: 210, unitMin: 5, unitMax: 40,
  },
  {
    id: 'dr-bronner-baby', section: 'baby-skin',
    brand: "Dr. Bronner's（ドクターブロナー）", name: 'マジックソープ ベビーマイルド（無香料）',
    spec: '236ml / 473ml / 944ml',
    point: '香料を加えていない液体せっけん。顔・からだ・髪にこれ1本で使え、大容量ほど割安になります。',
    who: '家族みんなで無香料のせっけんを使いたい人',
    iherbKw: "Dr. Bronner's Unscented Baby Pure-Castile Liquid Soap",
    compare: true, keyword: 'ドクターブロナー マジックソープ ベビーマイルド',
    must: [['ブロナー', 'Bronner', 'bronner'], ['ベビーマイルド', 'ベビー マイルド', 'BABY', 'Baby', '無香料']],
    not: ['バー', '固形', '石鹸 バー', 'ハンドソープ', 'フォーミング', '泡'],
    unit: 'ml', perMin: 230, perMax: 950, unitMin: 2, unitMax: 15,
  },
  {
    id: 'aveeno-baby-lotion', section: 'baby-skin',
    brand: 'Aveeno Baby（アヴィーノ ベビー）', name: 'デイリーモイスチャー ローション',
    spec: '227g ほか',
    point: 'オーツ麦（コロイダルオートミール）を配合した無香料の保湿ローション。海外のドラッグストアで定番のベビーケアです。',
    who: '無香料で、たっぷり使える保湿ローションを探している人',
    iherbKw: 'Aveeno Baby Daily Moisture Lotion',
    compare: false,
  },
  {
    id: 'cetaphil-baby', section: 'baby-skin',
    brand: 'Cetaphil Baby（セタフィル ベビー）', name: 'デイリーローション',
    spec: '399ml ほか',
    point: '肌にやさしい処方で知られるセタフィルのベビーライン。シアバターやカレンドラを配合したローションです。',
    who: '大人もセタフィルを使っていて、同じブランドでそろえたい人',
    iherbKw: 'Cetaphil Baby Daily Lotion',
    compare: false,
  },

  // --- 妊娠中・授乳中のサプリ ---
  {
    id: 'solgar-folate', section: 'mama-supplement',
    brand: 'Solgar（ソルガー）', name: '葉酸（メタフォリン）400mcg',
    spec: '100粒',
    point: '葉酸を活性型（メタフォリン）で配合したタブレット。葉酸だけを1日1粒で取り入れられる、シンプルなタイプです。',
    who: '総合サプリではなく、葉酸だけを選びたい人',
    iherbKw: 'Solgar Folate Metafolin 400 mcg',
    compare: true, keyword: 'ソルガー 葉酸 メタフォリン 400',
    must: [['ソルガー', 'Solgar', 'solgar', 'SOLGAR'], ['葉酸', 'Folate', 'folate'], ['メタフォリン', 'Metafolin', 'metafolin'], ['400']],
    not: ['800', 'B-コンプレックス', 'マルチ'],
    unit: '粒', perMin: 90, perMax: 110, unitMin: 8, unitMax: 60,
  },
  {
    id: 'gol-mykind-prenatal', section: 'mama-supplement',
    brand: 'Garden of Life（ガーデンオブライフ）', name: 'マイカインド オーガニクス プレナタル マルチ',
    spec: '90粒',
    point: '葉酸を食品由来の形で配合したマルチビタミン。原料にオーガニックの野菜や果物を使っているのが特長です。',
    who: '原料の由来にこだわりたい人',
    iherbKw: 'Garden of Life mykind Organics Prenatal Multi',
    compare: false,
  },
  {
    id: 'thorne-prenatal', section: 'mama-supplement',
    brand: 'Thorne（ソーン）', name: 'ベーシック プレナタル',
    spec: '90カプセル',
    point: '葉酸を活性型（メチル葉酸）で配合したマルチビタミン。1日3カプセルが目安です。',
    who: '活性型の葉酸を選びたい人',
    iherbKw: 'Thorne Basic Prenatal',
    compare: false,
  },
  {
    id: 'nordic-prenatal-dha', section: 'mama-supplement',
    brand: 'Nordic Naturals（ノルディックナチュラルズ）', name: 'プレナタル DHA',
    spec: '90粒 / 180粒',
    point: '魚油由来のDHA・EPAにビタミンD3を加えたソフトジェル。総合サプリと組み合わせて使う人が多いタイプです。',
    who: '魚をあまり食べない時期に、DHAを取り入れたい人',
    iherbKw: 'Nordic Naturals Prenatal DHA',
    compare: false,
  },

  // --- ママのボディケア・授乳ケア ---
  {
    id: 'weleda-stretch-oil', section: 'mama-care',
    brand: 'Weleda（ヴェレダ）', name: 'マザーズ ボディオイル',
    spec: '100ml',
    point: 'アーモンドオイルなどの植物オイルを使ったマッサージ用オイル。妊娠中のお腹まわりの保湿ケアに使われる定番です。',
    who: 'さらっとしたオイルで、毎日のボディケアをしたい人',
    iherbKw: 'Weleda Stretch Mark Massage Oil',
    compare: true, keyword: 'ヴェレダ マザーズ ボディオイル',
    must: [['ヴェレダ', 'WELEDA', 'Weleda', 'weleda'], ['マザーズ', 'マザーズボディオイル', 'Stretch', 'stretch']],
    not: ['クリーム', 'ミルク', 'バーム'],
    unit: 'ml', perMin: 95, perMax: 105, unitMin: 15, unitMax: 80,
  },
  {
    id: 'bio-oil', section: 'mama-care',
    brand: 'Bio-Oil（バイオイル）', name: 'バイオイル',
    spec: '60ml / 125ml / 200ml',
    point: '植物オイルとビタミンを配合したスキンケアオイル。ドラッグストアでも手に入る、定番のボディオイルです。',
    who: '近くのお店でも買い足しやすいオイルを選びたい人',
    iherbKw: 'Bio-Oil Skincare Oil',
    compare: true, keyword: 'バイオイル',
    must: [['バイオイル', 'Bio-Oil', 'Bio Oil', 'bio-oil', 'BIO-OIL']],
    not: ['ドライ', 'ジェル', 'バーム', 'ボディローション'],
    unit: 'ml', perMin: 55, perMax: 205, unitMin: 5, unitMax: 60,
  },
  {
    id: 'lansinoh-lanolin', section: 'mama-care',
    brand: 'Lansinoh（ランシノー）', name: 'HPA ラノリン',
    spec: '40g',
    point: '羊毛由来の天然油脂「ラノリン」だけでできた乳頭ケア用のクリーム。国内の産院やドラッグストアでも広く使われています。',
    who: '授乳中の乳頭のケア用品を探している人',
    iherbKw: 'Lansinoh HPA Lanolin',
    compare: true, keyword: 'ランシノー HPAラノリン 40g',
    must: [['ランシノー', 'Lansinoh', 'lansinoh'], ['ラノリン', 'Lanolin', 'lanolin']],
    not: ['母乳パッド', 'パッド', '保存', '搾乳'],
    unit: 'g', perMin: 35, perMax: 45, unitMin: 20, unitMax: 120,
  },
  {
    id: 'earth-mama-nipple', section: 'mama-care',
    brand: 'Earth Mama（アースママ）', name: 'オーガニック ニップルバター',
    spec: '60ml',
    point: 'ラノリンを使わず、シアバターなどの植物性オイルで作った乳頭ケアバーム。羊毛由来の成分を避けたい人の選択肢です。',
    who: 'ラノリン以外の乳頭ケアを試したい人',
    iherbKw: 'Earth Mama Organic Nipple Butter',
    compare: false,
  },
];

export const IHERB_PICKS = PICKS;

// 価格比較を行うものは、おむつ等と同じ同期処理（sync-staples）で楽天・Yahoo!を取得する
export const IHERB_STAPLES = PICKS.filter((p) => p.compare).map((p) => ({
  ...p,
  id: `iherb-${p.id}`,
  group: 'iherb',
  rakutenKeyword: p.keyword,
  lineKey: `iherb-${p.id}`,
  line: p.name,
  type: null,
  size: null,
}));

export const iherbStapleId = (pickId) => `iherb-${pickId}`;
