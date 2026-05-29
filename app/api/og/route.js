import { ImageResponse } from 'next/og';

async function loadJapaneseFont(text) {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
  try {
    const css = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }).then((r) => r.text());
    const match = css.match(/src: url\(([^)]+)\) format\('woff2'\)/);
    if (!match) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

const CORAL = '#FF6B6B';
const GREEN = '#7B8E76';
const DARK = '#5A4C4C';
const GRAY = '#8E8282';
const BG = '#FFFDFB';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'default';
  const name = searchParams.get('name') || '';
  const price = searchParams.get('price') || '';
  const rating = searchParams.get('rating') || '';
  const reviews = searchParams.get('reviews') || '';
  const count = searchParams.get('count') || '';

  const staticText =
    'HonestBaby子育てグッズの忖度なし比較レビュー最安値楽天Yahoo件の商品を比較中口コミ評価パパママリアルな本当に良いベビー用品が見つかります';
  const fontData = await loadJapaneseFont(staticText + name);
  const ff = fontData ? 'NotoSansJP' : 'sans-serif';
  const fonts = fontData
    ? [{ name: 'NotoSansJP', data: fontData, weight: 700, style: 'normal' }]
    : [];

  const priceNum = parseInt(price) || 0;
  const ratingNum = parseFloat(rating) || 0;
  const reviewsNum = parseInt(reviews) || 0;
  const countNum = parseInt(count) || 0;
  const displayName = name.length > 55 ? name.slice(0, 55) + '…' : name;
  const nameFontSize = displayName.length > 35 ? 26 : displayName.length > 20 ? 32 : 38;

  let bodyContent;

  if (type === 'product') {
    bodyContent = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '40px 48px',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: nameFontSize,
            fontWeight: 700,
            color: DARK,
            lineHeight: 1.45,
            fontFamily: ff,
          }}
        >
          {displayName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {priceNum > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 20, color: GREEN, fontFamily: ff }}>¥</span>
              <span style={{ fontSize: 52, fontWeight: 700, color: GREEN, lineHeight: 1, fontFamily: ff }}>
                {priceNum.toLocaleString()}
              </span>
              <span style={{ fontSize: 20, color: GREEN, fontFamily: ff }}>〜</span>
            </div>
          )}
          {ratingNum > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 30, color: '#D4AF37' }}>★</span>
              <span style={{ fontSize: 30, fontWeight: 700, color: DARK, fontFamily: ff }}>
                {ratingNum}
              </span>
              {reviewsNum > 0 && (
                <span style={{ fontSize: 16, color: GRAY, fontFamily: ff }}>
                  ({reviewsNum.toLocaleString()}件)
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#FFF0F0',
              borderRadius: 100,
              padding: '6px 16px',
            }}
          >
            <span style={{ fontSize: 13, color: CORAL, fontWeight: 700, fontFamily: ff }}>楽天</span>
          </div>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F0F4FF',
              borderRadius: 100,
              padding: '6px 16px',
            }}
          >
            <span style={{ fontSize: 13, color: '#4168B1', fontWeight: 700, fontFamily: ff }}>Yahoo</span>
          </div>
          <span style={{ fontSize: 13, color: GRAY, fontFamily: ff }}>最安値を一括比較</span>
        </div>
      </div>
    );
  } else if (type === 'category') {
    bodyContent = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '50px 48px',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 58, fontWeight: 700, color: CORAL, lineHeight: 1.2, fontFamily: ff }}>
            {name}
          </span>
          <span style={{ fontSize: 34, fontWeight: 700, color: DARK, lineHeight: 1.2, fontFamily: ff }}>
            の比較・レビュー
          </span>
        </div>
        {countNum > 0 && (
          <div style={{ display: 'flex', marginTop: 20 }}>
            <div
              style={{
                display: 'flex',
                backgroundColor: GREEN,
                borderRadius: 100,
                padding: '10px 28px',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: 'white', fontFamily: ff }}>
                {countNum}件の商品を比較中
              </span>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', marginTop: 16 }}>
          <span style={{ fontSize: 15, color: GRAY, fontFamily: ff }}>
            楽天・Yahoo最安値 + 口コミ・評価をまとめてチェック
          </span>
        </div>
      </div>
    );
  } else {
    bodyContent = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '50px 48px',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div
          style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: DARK, lineHeight: 1.3, fontFamily: ff }}
        >
          子育てグッズの
        </div>
        <div
          style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: CORAL, lineHeight: 1.3, fontFamily: ff }}
        >
          忖度なし比較・レビュー
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 20 }}>
          <span style={{ fontSize: 19, color: GRAY, lineHeight: 1.5, fontFamily: ff }}>
            パパ・ママのリアルな口コミと価格比較で、
          </span>
          <span style={{ fontSize: 19, color: GRAY, lineHeight: 1.5, fontFamily: ff }}>
            本当に良いベビー用品が見つかります
          </span>
        </div>
      </div>
    );
  }

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: BG,
      }}
    >
      <div
        style={{
          display: 'flex',
          backgroundColor: CORAL,
          padding: '20px 48px',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ color: 'white', fontSize: 28, fontWeight: 700, fontFamily: ff }}>
          HonestBaby
        </span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: ff }}>
          子育てグッズの忖度なし比較・レビュー
        </span>
      </div>
      {bodyContent}
    </div>,
    { width: 1200, height: 630, fonts }
  );
}
