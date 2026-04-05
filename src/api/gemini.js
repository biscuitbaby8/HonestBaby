/**
 * Google Gemini API client (REST)
 * Doc: https://ai.google.dev/gemini-api/docs/api-overview
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-1.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = `
あなたは子育てグッズ専門の「忖度なしコンサルタント」です。
ユーザー（パパ・ママ）の悩みに対し、共感しつつも、商品の欠点や物理的な適合性（サイズ感など）を厳しく、かつ正直にアドバイスしてください。

回答の指針:
1. 良い点だけでなく、必ず「こういう人には向かない」「ここが不便」という欠点を1つ以上含めてください。
2. ユーザーの居住環境（車のサイズ、玄関の幅など）を考慮するよう促してください。
3. 専門用語は避け、親しみやすいが信頼できるトーンで話してください。
4. 簡潔に回答し、必要に応じて箇条書きを利用してください。
`;

export const getChatResponse = async (history) => {
  if (!API_KEY) {
    console.error('Gemini API Key is missing. Check your .env file.');
    return '現在、AI相談機能がメンテナンス中です。APIキーの設定を確認してください。';
  }

  // Format history for Gemini API
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Add system prompt to the first user message or as a separate instruction if supported
  // For Gemini 1.5 Flash, we can use system_instruction if available, or just prepend to the first message.
  contents.unshift({
    role: 'user',
    parts: [{ text: `[System Instruction] ${SYSTEM_PROMPT}` }]
  });

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return aiResponse || '申し訳ありません、返答を生成できませんでした。';
  } catch (error) {
    console.error('Failed to fetch from Gemini API:', error);
    return '接続エラーが発生しました。時間をおいて再度お試しください。';
  }
};
