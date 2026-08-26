// 検索エンジンに見せる商品ページの基準（SEO改善 02）
//
// sitemap 3,986件のうち 3,863件(97%)が商品ページで、実際に検索結果へ
// 表示されたのは55ページ（登録の1.4%）だけだった。開設4.5ヶ月・被リンク
// ほぼゼロのドメインに価格比較だけの類似ページが3,863枚ある状態は、
// Googleから見れば「薄いアフィリエイトページの大量生産」に見える。
// クロール予算が薄く広く配られ、勝てるページまで埋もれる。
//
// 掲載自体はやめない。ユーザーはこれまで通り閲覧でき、アプリ内の一覧にも残る。
// noindex にしても follow は付けるので、リンクの評価は流れ続ける。
//
// 閾値はここだけで変える。判定は毎晩 rebuild-home-score が行い、
// products.is_indexable に書き込む（ページ表示のたびに集計しないため）。

// レビュー数の下限。市場からの評価がこの程度ないと、
// 検索結果で戦えるだけの独自性も需要も無い。
export const INDEXABLE_MIN_REVIEWS = 200;

// 価格履歴の日数の下限。ここが「他所に無い中身」の実体で、
// 7日あれば価格推移グラフとして意味のある線が引ける。
export const INDEXABLE_MIN_HISTORY_DAYS = 7;

/**
 * この商品ページを検索エンジンに見せてよいか。
 * @param {{reviewsCount?:number, reviews_count?:number, image?:string, image_url?:string}} product
 * @param {{historyDays?:number, hasPrice?:boolean}} signals
 */
export function isProductIndexable(product, { historyDays = 0, hasPrice = false } = {}) {
  if (!product) return false;
  const reviews = Number(product.reviewsCount ?? product.reviews_count ?? 0);
  if (!(reviews >= INDEXABLE_MIN_REVIEWS)) return false;
  if (!(historyDays >= INDEXABLE_MIN_HISTORY_DAYS)) return false;
  if (!hasPrice) return false;
  if (!product.image && !product.image_url) return false;
  return true;
}

// noindex のときに返す robots 設定。
// follow を残すのが重要で、これらのページから記事・カテゴリへ張った
// 内部リンクの評価は流れ続ける。noindex,nofollow にすると経路が切れる。
export const NOINDEX_ROBOTS = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};
