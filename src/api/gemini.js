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
