import { ImageResponse } from 'next/og';

// SNSシェア用 OGP画像（1200×630）を動的生成。
// 既定フォントで確実に描画できるよう英字中心のデザインにしている。
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'HonestBaby - Baby gear comparison & honest reviews';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFFDFB 0%, #FBEFEF 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 900, color: '#F2ABAC', letterSpacing: -2 }}>
          HonestBaby
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: '#7B8E76', marginTop: 8 }}>
          Baby gear comparison &amp; honest reviews
        </div>
        <div style={{ fontSize: 28, color: '#8E8282', marginTop: 28 }}>
          honestbaby-care.com
        </div>
      </div>
    ),
    { ...size }
  );
}
