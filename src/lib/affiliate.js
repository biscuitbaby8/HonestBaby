// iHerb（Partnerize経由）のアフィリエイトトラッキングURLを付与する。
// Camref未設定（審査待ち）の間は元URLをそのまま返す安全側フォールバック。
export function addIherbAffiliate(rawUrl) {
  const camref = process.env.IHERB_CAMREF_ID;
  if (!camref || !rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (!/(^|\.)iherb\.com$/i.test(u.hostname)) return rawUrl;
    return `https://prf.hn/click/camref:${encodeURIComponent(camref)}/destination:${encodeURIComponent(rawUrl)}`;
  } catch {
    return rawUrl;
  }
}
