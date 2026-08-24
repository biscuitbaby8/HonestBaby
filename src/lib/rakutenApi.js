// =============================================
// 楽天APIのバージョン管理
//
// 楽天は定期的に旧バージョン/旧ドメインを廃止する。実際にこのサイトは
// 2回とも「価格が更新されない」という症状だけを残して止まっている:
//
//   2026-05-14  旧ドメイン app.rakuten.co.jp 廃止
//   2026-08-17  version 20220601 廃止  ← 楽天の価格記録が止まった日と一致
//
// 廃止のたびにコードを直すまでサイト全体の価格更新が止まるため、
// バージョンをここ1か所に集め、かつ「候補を順に試して通ったものを使う」
// 方式にする。次の廃止時はコードを触らなくても自動で新バージョンに移る。
//
// 並び順＝試す順（新しいものから）。環境変数 RAKUTEN_API_VERSION を
// 設定した場合はそれを最優先で試す（緊急時にデプロイ無しで固定できる）。
// =============================================

const ENV_VERSION = process.env.RAKUTEN_API_VERSION || '';

// 楽天市場商品検索API / 楽天市場ランキングAPI 共通のバージョン候補。
// 20220601 は廃止済みだが、万一新バージョンが全滅した場合の最後の砦として残す。
const DEFAULT_VERSIONS = ['20260701', '20260401', '20220601'];

export const RAKUTEN_VERSIONS = ENV_VERSION
  ? [ENV_VERSION, ...DEFAULT_VERSIONS.filter((v) => v !== ENV_VERSION)]
  : DEFAULT_VERSIONS;

// 一度通ったバージョンはプロセス内で覚えておき、次回から先頭で試す。
// （サーバーレスなのでインスタンスが変わればリセットされるが、
//   1回の同期の中で何十回も無駄打ちするのを防げれば十分）
let preferred = null;

export function versionsToTry() {
  if (!preferred) return RAKUTEN_VERSIONS;
  return [preferred, ...RAKUTEN_VERSIONS.filter((v) => v !== preferred)];
}

export function rememberVersion(v) {
  preferred = v;
}

export function currentVersion() {
  return preferred || RAKUTEN_VERSIONS[0];
}

// 「このバージョンはもう無い」を意味するレスポンスかどうか。
// 廃止済みバージョンを叩くと 400 + wrong_parameter / API Configuration not found が返る。
// 資格情報が本当に間違っている場合も同じ形なので、バージョンを一巡して
// 全滅したときだけ資格情報の問題として扱う（呼び出し側の責務）。
export function isVersionError(statusCode, text) {
  if (statusCode !== 400) return false;
  const body = String(text || '');
  return body.includes('API Configuration not found')
    || body.includes('wrong_parameter')
    || body.includes('not_found');
}

export function searchUrl(version, params) {
  return `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/${version}?${params}`;
}

export function rankingUrl(version, params) {
  return `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/${version}?${params}`;
}

/**
 * バージョン候補を順に試し、最初に成功したレスポンスを返す。
 * @param {(version: string) => Promise<{statusCode:number, text:string}>} call
 * @returns {Promise<{statusCode:number, text:string, version:string, triedVersions:string[]}>}
 *   すべて失敗した場合は最後の結果を返す（呼び出し側でエラー処理する）。
 */
export async function withVersionFallback(call) {
  const tried = [];
  let last = null;
  for (const version of versionsToTry()) {
    tried.push(version);
    const res = await call(version);
    last = { ...res, version, triedVersions: [...tried] };
    if (res.statusCode === 200) {
      rememberVersion(version);
      return last;
    }
    // バージョン以外の理由（403/429/500等）なら他バージョンを試しても同じなので即座に返す
    if (!isVersionError(res.statusCode, res.text)) return last;
  }
  return last;
}
