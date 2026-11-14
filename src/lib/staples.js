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
    tape: ['nb', 's', 'm', 'l'], pants: ['m', 'l', 'big', 'xbig'],
  },
];

const TYPES = { tape: 'テープ', pants: 'パンツ' };

export const STAPLES = LINES.flatMap((ln) =>
  Object.keys(TYPES).flatMap((type) =>
    (ln[type] || []).map((size) => {
      const sz = sizeInfo(size);
      const sameAsBrand = ln.line === ln.brand;
      return {
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

// 総枚数を返す。読み取れない・矛盾する場合は null。
// 例: 「M248枚(62枚x4袋)」→248 / 「62枚入x4個」→248 / 「M52枚 2袋 104枚」→104 / 「L 54枚」→54
export function parseTotalSheets(name) {
  const sheets = [...name.matchAll(/(\d{1,4})\s*枚/g)].map((m) => parseInt(m[1], 10)).filter((v) => v > 0);
  if (sheets.length === 0) return null;
  const mults = [
    ...[...name.matchAll(/x\s*(\d{1,2})(?!\d|\s*枚)/g)].map((m) => parseInt(m[1], 10)),
    ...[...name.matchAll(/(?<!\d)(\d{1,2})\s*(?:個|袋|パック|セット|箱|コ)(?!\s*あたり)/g)].map((m) => parseInt(m[1], 10)),
  ].filter((v) => v >= 2 && v <= 12);
  const uniqSheets = [...new Set(sheets)];
  const uniqMults = [...new Set(mults)];
  const per = Math.min(...uniqSheets);
  const max = Math.max(...uniqSheets);

  if (uniqSheets.length === 1) {
    if (uniqMults.length === 0) return per;
    if (uniqMults.length === 1) return per * uniqMults[0];
    return null; // 「3個 4個」など入数が複数 = バリエーション出品
  }
  if (uniqSheets.length === 2) {
    // 「1袋あたり枚数」と「合計枚数」が両方書いてある形だけ認める
    const ratio = max / per;
    if (Number.isInteger(ratio) && ratio >= 2 && ratio <= 12 && (uniqMults.length === 0 || uniqMults.includes(ratio))) {
      return max;
    }
    return null;
  }
  return null; // 3種類以上の枚数 = サイズ違いをまとめた出品
}

// 1枚あたりの単価がおむつとして妥当な範囲か（解析ミスや別商品の混入を弾く）
const UNIT_MIN = 9;
const UNIT_MAX = 90;

// 出品が定番 staple に該当すれば { qty, unitPrice } を返す。該当しなければ null。
export function matchOffer(staple, rawName, price) {
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

// 同じ定番の中で、中央値から大きく外れて安い出品は解析ミスの可能性が高いので落とす
export function dropOutliers(offers) {
  if (offers.length < 3) return offers;
  const sorted = [...offers].sort((a, b) => a.unit_price - b.unit_price);
  const median = sorted[Math.floor(sorted.length / 2)].unit_price;
  return offers.filter((o) => o.unit_price >= median * 0.55);
}
