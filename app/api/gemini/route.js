import { checkRateLimit } from '@/lib/rateLimit';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function POST(request) {
  const limited = checkRateLimit(request, { limit: 10, windowMs: 60 * 1000, prefix: 'gemini', headers: CORS });
  if (limited) return limited;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ text: '', error: 'Groq API key not configured on server' }, { status: 200, headers: CORS });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { prompt } = body;
  if (!prompt) {
    return Response.json({ error: 'Missing prompt' }, { status: 400, headers: CORS });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data);
      return Response.json({ text: '', error: errMsg }, { status: 200, headers: CORS });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return Response.json({ text }, { status: 200, headers: CORS });
  } catch (error) {
    return Response.json({ text: '', error: error.message }, { status: 200, headers: CORS });
  }
}
