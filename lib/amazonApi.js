import amazonPaapi from 'amazon-paapi';

// Amazon PA-API v5 (OffersV2) ラッパー
// 環境変数: AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY / AMAZON_PARTNER_TAG

const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const SECRET_KEY = process.env.AMAZON_SECRET_KEY;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;

export function isAmazonConfigured() {
  return !!(ACCESS_KEY && SECRET_KEY && PARTNER_TAG);
}

function commonParams() {
  return {
    AccessKey: ACCESS_KEY,
    SecretKey: SECRET_KEY,
    PartnerTag: PARTNER_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.co.jp',
  };
}

// count: 1〜10 (PA-APIのItemCount上限は10)。失敗時は例外を投げず空配列を返す(フェイルオープン)
export async function searchAmazonItems(keyword, count = 5) {
  if (!isAmazonConfigured()) return [];
  try {
    const requestParameters = {
      Keywords: keyword,
      SearchIndex: 'All',
      ItemCount: Math.min(Math.max(count, 1), 10),
      Resources: [
        'ItemInfo.Title',
        'OffersV2.Listings.Price',
        'OffersV2.Listings.Condition',
        'Images.Primary.Large',
        'Images.Primary.Medium',
      ],
    };
    const data = await amazonPaapi.SearchItemsV2(commonParams(), requestParameters);
    const items = data?.SearchResult?.Items || [];
    return items.map(item => {
      const listing = item.OffersV2?.Listings?.[0];
      return {
        asin: item.ASIN || null,
        title: item.ItemInfo?.Title?.DisplayValue || keyword,
        price: listing?.Price?.Money?.Amount ?? null,
        condition: listing?.Condition?.Value || null,
        url: item.DetailPageURL || `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${PARTNER_TAG}`,
        image: item.Images?.Primary?.Large?.URL || item.Images?.Primary?.Medium?.URL || null,
      };
    });
  } catch (e) {
    console.warn('Amazon PA-API error:', e?.message || e);
    return [];
  }
}
