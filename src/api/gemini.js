/**
 * Google Gemini API client (REST v1beta)
 * Updated to respond positively to UUID and modern model requirements.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Reverting to v1beta as it generally has better support for current flash models via REST
const MODEL = 'gemini-1.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = `
あなたは子育てグッズ専門の「忖度なしコンサルタント」です。
ユーザー（パパ・ママ）の悩みに対し、共感しつつも、商品の欠点や物理的な適合性（サイズ感など）を厳しく、かつ正直にアドバイスしてください。
`;

export const getChatResponse = async (history) => {
  if (!API_KEY) {
    console.error('Gemini API Key is missing.');
    return '現在、AI相談機能がメンテナンス中です。APIキーの設定を確認してください。';
  }

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  contents.unshift({
    role: 'user',
    parts: [{ text: `[システム設定] ${SYSTEM_PROMPT}\n上記の役割になりきって回答してください。` }]
  });

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error detail:', JSON.stringify(errorData));
      throw new Error(`Gemini API error: ${errorData.error?.message || response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '返答を生成できませんでした。';
  } catch (error) {
    console.error('Failed to fetch from Gemini API:', error);
    return '現在、AIの機嫌が悪いようです（接続エラー）。少し時間をおいて再度お試しください。';
  }
};

export const generateProductReviewAnalysis = async (product) => {
  const prompt = `あなたは「HonestBaby」という忖度なし・中立的・辛口なベビー用品レビューAIです。以下の商品に関する「SNS風のリアルな口コミ2件（良いものと悪いもの）」と、「欠点(Cons)」「注意点(Target)」を以下のJSON形式で返してください。決してMarkdownなどで囲まず、純粋なJSON文字列のみ出力すること。
商品名: ${product.name}
価格: ${product.price}
説明: ${product.description || ''}

{
  "cons": ["欠点1やデメリット", "欠点2", "欠点3"],
  "target": "どういう家庭には向かないか、気をつけるべき点（2〜3文）",
  "reviews": [
    { "type": "good", "text": "リアルな良い口コミ（絵文字も少し）", "author": "1週間前のレビュー", "stars": 5 },
    { "type": "bad", "text": "リアルな不満点や辛口口コミ", "author": "昨日のパパ", "stars": 3 }
  ]
}`;
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return null;
    // JSON部分だけを抽出する安全策
    const jsonStr = responseText.match(/\{[\s\S]*\}/)?.[0] || responseText;
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse Gemini Review Analysis:', err);
    return null;
  }
};
