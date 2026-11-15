// 定番消耗品カタログ（おむつ）。
//
// 従来は「モールの1出品 = 1商品」で持っていたが、おむつはサイズ違いが
// 1出品にまとまっていたり、同じ銘柄が何十店舗から違う入数で出ていたりして、
// 「どこが一番安いか」に答えられなかった。
// ここでは「銘柄 × タイプ × サイズ」を1つの定番（staple）として定義し、
// 楽天・Yahooの出品を商品名から厳密に突合して、1枚あたりの単価で並べる。
//
// 突合は精度優先。サイズや枚数が商品名から一意に読めない出品は捨てる
// （誤った最安値を出すより、出さない方がよい）。

const SIZES = [
  { key: 'nb', label: '新生児', kw: '新生児', weight: '〜5kg' },
  { key: 's', label: 'S', kw: 'S', rkw: 'Sサイズ', weight: '4〜8kg' },
  { key: 'm', label: 'M', kw: 'M', rkw: 'Mサイズ', weight: '6〜12kg' },
  { key: 'l', label: 'L', kw: 'L', rkw: 'Lサイズ', weight: '9〜14kg' },
  { key: 'big', label: 'ビッグ', kw: 'ビッグ', weight: '12〜22kg' },
  { key: 'xbig', label: 'ビッグより大きい', kw: 'ビッグより大きい', weight: '13〜28kg' },
];
export const SIZE_ORDER = SIZES.map((s) => s.key);
export const sizeInfo = (key) => SIZES.find((s) => s.key === key);

// line.must: 商品名に必ず含まれる語（いずれか1つでよい配列の配列 = AND of ORs）
// line.not : 含まれていたら別ラインなので除外する語
const LINES = [
  {
    brand: 'パンパース', brandSlug: 'pampers', maker: 'P&G',
    line: 'さらさらケア', lineSlug: 'sarasara',
    must: [['パンパース'], ['さらさら']],
    not: ['肌へのいちばん', '肌いち', '通気性プラス', 'おやすみ', '夜用'],
    tape: ['nb', 's', 'm', 'l'], pants: ['s', 'm', 'l', 'big', 'xbig'],
  },
  {
    brand: 'パンパース', brandSlug: 'pampers', maker: 'P&G',
    line: '肌へのいちばん', lineSlug: 'hadaichi',
    must: [['パンパース'], ['肌へのいちばん', '肌いち']],
    not: ['さらさら', '通気性プラス', 'おやすみ', '夜用'],
    tape: ['nb', 's', 'm'], pants: ['s', 'm', 'l', 'big'],
  },
  {
    brand: 'メリーズ', brandSlug: 'merries', maker: '花王',
    line: 'エアスルー', lineSlug: 'airthrough',
    must: [['メリーズ'], ['エアスルー']],
    not: ['ファーストプレミアム', 'おやすみ', '夜用'],
    tape: ['nb', 's', 'm', 'l'], pants: ['s', 'm', 'l', 'big', 'xbig'],
  },
  {
    brand: 'メリーズ', brandSlug: 'merries', maker: '花王',
    line: 'ファーストプレミアム', lineSlug: 'first-premium',
    must: [['メリーズ'], ['ファーストプレミアム']],
    not: ['おやすみ', '夜用'],
    tape: ['nb', 's', 'm'], pants: ['m', 'l', 'big'],
  },
  {
    brand: 'ムーニー', brandSlug: 'moony', maker: 'ユニ・チャーム',
    line: 'ムーニー', lineSlug: 'moony',
    must: [['ムーニー']],
    not: ['ナチュラル', 'オーガニック', 'おやすみ', '夜用', '水あそび', 'トレパン'],
    tape: ['nb', 's', 'm', 'l'], pants: [],
  },
  {
    brand: 'ムーニー', brandSlug: 'moony', maker: 'ユニ・チャーム',
    line: 'ムーニーマン', lineSlug: 'moonyman',
    must: [['ムーニーマン']],
    not: ['ナチュラル', 'オーガニック', 'おやすみ', '夜用', '水あそび', 'トレパン'],
    tape: [], pants: ['s', 'm', 'l', 'big', 'xbig'],
  },
  {
    brand: 'グーン', brandSlug: 'goon', maker: '大王製紙',
    line: 'まっさらさら通気', lineSlug: 'massarasara',
    must: [['グーン', 'GOO.N', 'Goo.N'], ['まっさらさら']],
    not: ['ぐんぐん', 'おやすみ', '夜用', 'スイミング'],
    tape: ['nb', 's', 'm', 'l'], pants: ['m', 'l', 'big', 'xbig'],
  },
  {
    brand: 'グーン', brandSlug: 'goon', maker: '大王製紙',
    line: 'ぐんぐん吸収パンツ', lineSlug: 'gungun',
    must: [['グーン', 'GOO.N', 'Goo.N'], ['ぐんぐん']],
    not: ['まっさらさら', 'おやすみ', '夜用', 'スイミング'],
    tape: [], pants: ['m', 'l', 'big', 'xbig'],
  },
  {
    brand: 'マミーポコ', brandSlug: 'mamypoko', maker: 'ユニ・チャーム',
    line: 'マミーポコ', lineSlug: 'mamypoko',
    must: [['マミーポコ']],
    not: ['おやすみ', '夜用', '水あそび'],
    tape: ['nb', 's', 'm', 'l'], pants: ['m', 'l', 'big', 'xbig'],
  },
  {
    brand: 'ゲンキ', brandSlug: 'genki', maker: 'ネピア',
    line: 'Genki!', lineSlug: 'genki',
    must: [['ゲンキ', 'Genki', 'GENKI', 'genki']],
    not: ['おやすみ', '夜用'],
    tape: [], pants: ['m', 'l', 'big', 'xbig'],
  },
];

const TYPES = { tape: 'テープ', pants: 'パンツ' };

const DIAPER_STAPLES = LINES.flatMap((ln) =>
  Object.keys(TYPES).flatMap((type) =>
    (ln[type] || []).map((size) => {
      const sz = sizeInfo(size);
      const sameAsBrand = ln.line === ln.brand;
      return {
        group: 'omutsu',
        id: `${ln.brandSlug}-${ln.lineSlug}-${type}-${size}`.replace(`${ln.brandSlug}-${ln.brandSlug}-`, `${ln.brandSlug}-`),
        brand: ln.brand,
        maker: ln.maker,
        line: ln.line,
        lineKey: `${ln.brandSlug}-${ln.lineSlug}-${type}`,
        type,
        typeLabel: TYPES[type],
        size,
        sizeLabel: sz.label,
        weight: sz.weight,
        name: `${sameAsBrand ? ln.brand : `${ln.brand} ${ln.line}`} ${TYPES[type]} ${sz.label}サイズ`.replace('新生児サイズ', '新生児用'),
        keyword: `${sameAsBrand ? ln.brand : `${ln.brand} ${ln.line}`} ${TYPES[type]} ${sz.kw}`,
        // 楽天APIは1文字の検索語を拒否する（wrong_parameter）ため「Mサイズ」の形にする
        rakutenKeyword: `${sameAsBrand ? ln.brand : `${ln.brand} ${ln.line}`} ${TYPES[type]} ${sz.rkw || sz.kw}`,
        must: ln.must,
        not: ln.not,
      };
    })
  )
);

// ---- おしりふき・粉ミルク（サイズが無いので 銘柄=1定番） ----
// keyword は Yahoo/楽天共通（半角1文字の語を含めないこと。楽天APIが拒否する）。
const simple = (group, defs) => defs.map((d) => ({
  group, type: null, size: null, not: [], rakutenKeyword: d.keyword, lineKey: d.id, line: d.name, ...d,
}));

const WIPE_STAPLES = simple('oshirifuki', [
  { id: 'wipes-pampers-hadaichi', brand: 'パンパース', maker: 'P&G', name: 'パンパース 肌へのいちばん おしりふき', keyword: 'パンパース 肌へのいちばん おしりふき', must: [['パンパース'], ['おしりふき', 'おしり拭き']], not: ['おむつセット'] },
  { id: 'wipes-moony-soft', brand: 'ムーニー', maker: 'ユニ・チャーム', name: 'ムーニー おしりふき やわらか素材', keyword: 'ムーニー おしりふき やわらか素材', must: [['ムーニー'], ['おしりふき'], ['やわらか素材']], not: ['厚手', '流せる'] },
  { id: 'wipes-moony-thick', brand: 'ムーニー', maker: 'ユニ・チャーム', name: 'ムーニー おしりふき やわらか厚手', keyword: 'ムーニー おしりふき 厚手', must: [['ムーニー'], ['おしりふき'], ['厚手']], not: ['流せる'] },
  { id: 'wipes-goon', brand: 'グーン', maker: '大王製紙', name: 'グーン おしりふき', keyword: 'グーン おしりふき', must: [['グーン', 'GOO.N', 'Goo.N'], ['おしりふき']], not: ['流せる'] },
  { id: 'wipes-pigeon-thick', brand: 'ピジョン', maker: 'ピジョン', name: 'ピジョン おしりナップ やわらか厚手仕上げ', keyword: 'ピジョン おしりナップ やわらか厚手仕上げ', must: [['おしりナップ'], ['厚手仕上げ', 'やわらか厚手']], not: ['流せる', 'ふんわり'] },
  { id: 'wipes-pigeon-nagaseru', brand: 'ピジョン', maker: 'ピジョン', name: 'ピジョン トイレに流せるおしりナップ ふんわり厚手', keyword: 'ピジョン 流せる おしりナップ ふんわり厚手', must: [['おしりナップ'], ['流せる'], ['ふんわり']], not: [] },
  { id: 'wipes-lec-999', brand: 'レック', maker: 'レック', name: 'レック 水99.9% おしりふき', keyword: 'レック 水99.9 おしりふき', must: [['レック', 'LEC', 'lec'], ['99.9'], ['おしりふき']], not: ['流せる', '手口'] },
]);

const MILK_STAPLES = simple('milk', [
  { id: 'milk-hohoemi', brand: 'ほほえみ', maker: '明治', name: '明治 ほほえみ 800g缶', keyword: '明治 ほほえみ 800g', must: [['ほほえみ']], not: ['キューブ', 'らくらくミルク', 'ステップ'] },
  { id: 'milk-haihai', brand: 'はいはい', maker: '和光堂', name: '和光堂 レーベンスミルク はいはい 810g缶', keyword: '和光堂 はいはい 810g', must: [['はいはい'], ['和光堂', 'レーベンス', 'アサヒ']], not: ['ぐんぐん'] },
  { id: 'milk-icreo', brand: 'アイクレオ', maker: 'グリコ', name: 'アイクレオ バランスミルク 800g缶', keyword: 'アイクレオ バランスミルク 800g', must: [['アイクレオ'], ['バランスミルク']], not: ['グローアップ'] },
  { id: 'milk-hagukumi', brand: 'はぐくみ', maker: '森永乳業', name: '森永 はぐくみ 800g缶', keyword: '森永 はぐくみ 800g', must: [['はぐくみ']], not: ['チルミル', 'エコらく', 'E赤ちゃん'] },
  { id: 'milk-e-akachan', brand: 'E赤ちゃん', maker: '森永乳業', name: '森永 E赤ちゃん 800g缶', keyword: '森永 E赤ちゃん 800g', must: [['E赤ちゃん']], not: ['エコらく'] },
  { id: 'milk-sukoyaka', brand: 'すこやかM1', maker: '雪印ビーンスターク', name: 'ビーンスターク すこやかM1 800g缶', keyword: 'ビーンスターク すこやか 800g', must: [['すこやか']], not: ['つよいこ'] },
  { id: 'milk-pure', brand: 'ぴゅあ', maker: '雪印メグミルク', name: '雪印メグミルク ぴゅあ 820g缶', keyword: '雪印メグミルク ぴゅあ 820g', must: [['ぴゅあ'], ['雪印', 'メグミルク']], not: ['たっち'] },
]);

export const STAPLES = [...DIAPER_STAPLES, ...WIPE_STAPLES, ...MILK_STAPLES];

// グループごとの表示設定。unitPrice は「1枚」「1g」あたりで保存し、
// 粉ミルクは表示のときだけ100gあたりに直す。
export const GROUPS = {
  omutsu: { path: '/omutsu', hub: 'おむつ1枚あたりの最安値', perLabel: '枚', scale: 1, decimals: 1, qtyUnit: '枚' },
  oshirifuki: { path: '/oshirifuki', hub: 'おしりふき1枚あたりの最安値', perLabel: '枚', scale: 1, decimals: 2, qtyUnit: '枚' },
  milk: { path: '/milk', hub: '粉ミルク100gあたりの最安値', perLabel: '100g', scale: 100, decimals: 0, qtyUnit: 'g' },
};
export const staplesOf = (group) => STAPLES.filter((s) => s.group === group);

export const getStaple = (id) => STAPLES.find((s) => s.id === id) || null;

// ---- 商品名の解析 ----

// 全角英数・記号を半角に寄せ、表記ゆれを吸収する
export function normalizeName(raw) {
  return String(raw || '')
    .replace(/&amp;/g, '&')
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[　\s]+/g, ' ')
    .replace(/[〜~]/g, '-')
    .replace(/[×✕✖＊*]/g, 'x')
    .trim();
}

// 新品のおむつ本体ではない出品
const GLOBAL_NG = /おむつケーキ|オムツケーキ|おむつカバー|オムツカバー|布おむつ|大人用|中古|訳あり|わけあり|アウトレット|サンプル|お試し|試供|ペット|犬|猫|おしりふき|お尻ふき|ライナー|パッド|水遊び|水あそび|スイミング|トレーニング|トレパン|福袋|ギフトセット|選べる|よりどり|ふるさと納税/;

// 商品名に含まれるサイズを全て返す。「ビッグより大きい」を先に抜いてから「ビッグ」を見る。
export function detectSizes(name) {
  let n = name;
  const found = new Set();
  if (/(ビッグ|BIG|Big|big)\s*(サイズ)?\s*より\s*大|ビッグ大|BIG大|スーパービッグ|スーパーBIG|XXL/.test(n)) {
    found.add('xbig');
    n = n.replace(/(ビッグ|BIG|Big|big)\s*(サイズ)?\s*より\s*大|ビッグ大|BIG大|スーパービッグ|スーパーBIG|XXL/g, ' ');
  }
  if (/ビッグ|BIG|Big(?![a-z])|XL/.test(n)) found.add('big');
  if (/新生児/.test(n)) found.add('nb');
  // S/M/L は英単語の一部（Merries, SALE 等）を拾わないよう前後が英字でないものだけ
  for (const [re, key] of [[/(?<![A-Za-z])S(?![A-Za-z])/, 's'], [/(?<![A-Za-z])M(?![A-Za-z])/, 'm'], [/(?<![A-Za-z])L(?![A-Za-z])/, 'l']]) {
    if (re.test(n)) found.add(key);
  }
  return [...found];
}

// 総量（枚数またはグラム数）と、1個あたりの量を返す。読み取れない・矛盾する場合は null。
// 例(枚): 「M248枚(62枚x4袋)」→248 / 「62枚入x4個」→248 / 「M52枚 2袋 104枚」→104 / 「L 54枚」→54
// 例(g) : 「800gx2缶」→1600 / 「800g 2缶セット(1600g)」→1600
// 単位ごとの「量」の書き方。粒は「1日4粒」のような目安量を拾わないよう2桁以上だけを見る。
const UNIT_PATTERNS = {
  '枚': { re: /(\d{1,4})\s*枚/g, not: '(?!\\d|\\s*枚)' },
  'g': { re: /(\d{2,4})\s*(?:g|ｇ|グラム)/g, not: '(?!\\d|\\s*(?:g|ｇ))' },
  // 「10.3ml」のような小数も読む（輸入サプリは米国の容量表記を換算したものが多い）
  'ml': { re: /(?<![\d.])(\d{1,4}(?:\.\d{1,2})?)\s*(?:ml|mL|ML|Ml|ミリリットル)/g, not: '(?!\\d|\\s*(?:ml|mL|ML))' },
  '粒': { re: /(\d{2,3})\s*(?:粒|錠|カプセル|ソフトジェル|タブレット|tablets?|capsules?|caps|softgels?)/gi, not: '(?!\\d|\\s*(?:粒|錠|カプセル|ソフトジェル))' },
};

export function parseTotal(name, unit = '枚') {
  const u = UNIT_PATTERNS[unit] || UNIT_PATTERNS['枚'];
  const values = [...name.matchAll(u.re)].map((m) => parseFloat(m[1])).filter((v) => v > 0);
  if (values.length === 0) return null;
  const notUnit = u.not;
  const xMults = [...name.matchAll(new RegExp(`x\\s*(\\d{1,2})${notUnit}`, 'g'))].map((m) => parseInt(m[1], 10)).filter((v) => v >= 2 && v <= 60);
  const mults = [
    ...xMults,
    ...[...name.matchAll(/(?<!\d)(\d{1,2})\s*(?:個|袋|パック|セット|箱|コ|缶|ケース|本|瓶)(?!\s*あたり)/g)].map((m) => parseInt(m[1], 10)),
  ].filter((v) => v >= 2 && v <= 60);
  const uniq = [...new Set(values)];
  const uniqMults = [...new Set(mults)];
  const per = Math.min(...uniq);
  const max = Math.max(...uniq);

  if (uniq.length === 1) {
    if (uniqMults.length === 0) return { total: per, per };
    if (uniqMults.length === 1) return { total: per * uniqMults[0], per };
    // 「54枚x2個 x5個セット」のように掛け算が2段になっている形（どちらも x つき）
    if (xMults.length === 2 && uniqMults.length === 2 && uniqMults.every((v) => xMults.includes(v))) {
      return { total: per * xMults[0] * xMults[1], per };
    }
    return null; // 「3個 4個」など入数が複数 = バリエーション出品
  }
  if (uniq.length === 2) {
    // 「1個あたりの量」と「合計」が両方書いてある形だけ認める
    const ratio = max / per;
    if (Number.isInteger(ratio) && ratio >= 2 && ratio <= 60 && (uniqMults.length === 0 || uniqMults.includes(ratio))) {
      return { total: max, per };
    }
    return null;
  }
  return null; // 3種類以上 = サイズ違いをまとめた出品
}

export const parseTotalSheets = (name) => parseTotal(name, '枚')?.total ?? null;

// 1枚あたりの単価がおむつとして妥当な範囲か（解析ミスや別商品の混入を弾く）
const UNIT_MIN = 9;
const UNIT_MAX = 90;

// 出品が定番 staple に該当すれば { qty, unitPrice } を返す。該当しなければ null。
export function matchOffer(staple, rawName, price) {
  if (staple.group === 'oshirifuki') return matchSimple(staple, rawName, price, WIPE_RULE);
  if (staple.group === 'milk') return matchSimple(staple, rawName, price, MILK_RULE);
  if (staple.group === 'iherb') {
    return matchSimple(staple, rawName, price, {
      unit: staple.unit, ng: IMPORT_NG,
      perMin: staple.perMin, perMax: staple.perMax,
      totalMin: staple.perMin, totalMax: staple.perMax * 12,
      unitMin: staple.unitMin, unitMax: staple.unitMax,
    });
  }
  const full = normalizeName(rawName);
  const p = Number(price);
  if (!(p > 0)) return null;
  if (GLOBAL_NG.test(full)) return null;
  // 「さら さらケア」のような空白入りの表記も拾えるよう、語の照合は空白を除いて行う
  const compact = full.replace(/ /g, '');
  for (const group of staple.must) {
    if (!group.some((w) => compact.includes(w))) return null;
  }
  if (staple.not.some((w) => compact.includes(w))) return null;
  // ムーニー(テープ)の検索にムーニーマン(パンツ)が混ざるのを防ぐ
  if (staple.line === 'ムーニー' && compact.includes('ムーニーマン')) return null;

  // 「… 62枚x4個 | 紙おむつ テープタイプ 新生児 S M L …」のように、区切りの後ろへ
  // 検索用の語を並べる出品が多い。サイズと枚数は区切りより前の本題だけから読む。
  const name = full.split(/[|｜]/)[0];

  const hasTape = /テープ/.test(name);
  const hasPants = /パンツ|ムーニーマン/.test(name);
  if (staple.type === 'tape' && (!hasTape || hasPants)) return null;
  if (staple.type === 'pants' && (!hasPants || hasTape)) return null;

  const sizes = detectSizes(name);
  if (sizes.length !== 1 || sizes[0] !== staple.size) return null;

  const qty = parseTotalSheets(name);
  if (!qty || qty < 10 || qty > 800) return null;

  const unitPrice = p / qty;
  if (unitPrice < UNIT_MIN || unitPrice > UNIT_MAX) return null;
  return { qty, unitPrice: Math.round(unitPrice * 100) / 100 };
}

// おしりふき・粉ミルクの照合ルール。
// perMin/perMax は1個（1パック・1缶）あたりの量の範囲で、別規格の混入を防ぐ
// （粉ミルクなら 300g小缶・スティック・キューブを大缶の定番に混ぜない）。
const WIPE_RULE = {
  unit: '枚',
  ng: /ウォーマー|ケースのみ|フタ|ふた|ホルダー|中古|訳あり|わけあり|アウトレット|サンプル|お試し|試供|福袋|ギフトセット|おむつケーキ|選べる|よりどり|ふるさと納税|ペット|犬|猫|大人用|介護/,
  perMin: 30, perMax: 120, totalMin: 30, totalMax: 6000,
  unitMin: 0.6, unitMax: 8,
};
const MILK_RULE = {
  unit: 'g',
  ng: /キューブ|スティック|液体|フォローアップ|小缶|中古|訳あり|わけあり|アウトレット|サンプル|お試し|試供|福袋|ギフトセット|選べる|よりどり|ふるさと納税|賞味期限間近|期限間近/,
  perMin: 750, perMax: 850, totalMin: 750, totalMax: 13600,
  unitMin: 1.8, unitMax: 5.5,
};

// 輸入サプリ・スキンケア（/iherb 特集の価格比較）。サンプル・中古・詰め合わせ等を除く。
const IMPORT_NG = /中古|訳あり|わけあり|アウトレット|サンプル|お試し|試供|トライアル|ミニサイズ|福袋|ギフトセット|選べる|よりどり|ふるさと納税|期限間近|賞味期限|空容器|空ボトル/;

function matchSimple(staple, rawName, price, rule) {
  const full = normalizeName(rawName);
  const p = Number(price);
  if (!(p > 0)) return null;
  if (rule.ng.test(full)) return null;
  const compact = full.replace(/ /g, '');
  for (const group of staple.must) {
    if (!group.some((w) => compact.includes(w))) return null;
  }
  if (staple.not.some((w) => compact.includes(w))) return null;

  const name = full.split(/[|｜]/)[0];
  const parsed = parseTotal(name, rule.unit);
  if (!parsed) return null;
  if (parsed.per < rule.perMin || parsed.per > rule.perMax) return null;
  if (parsed.total < rule.totalMin || parsed.total > rule.totalMax) return null;

  const unitPrice = p / parsed.total;
  if (unitPrice < rule.unitMin || unitPrice > rule.unitMax) return null;
  // 粉ミルクは1gあたり数円なので小数4桁まで持つ（DBは numeric(10,4)）
  return { qty: parsed.total, unitPrice: Math.round(unitPrice * 10000) / 10000 };
}

// 同じ定番の中で、中央値から大きく外れて安い出品は解析ミスの可能性が高いので落とす
export function dropOutliers(offers) {
  if (offers.length < 3) return offers;
  const sorted = [...offers].sort((a, b) => a.unit_price - b.unit_price);
  const median = sorted[Math.floor(sorted.length / 2)].unit_price;
  return offers.filter((o) => o.unit_price >= median * 0.55);
}
