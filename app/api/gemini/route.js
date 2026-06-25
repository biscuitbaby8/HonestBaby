import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  const limited = checkRateLimit(request, { limit: 10, windowMs: 60 * 1000, prefix: 'gemini' });
  if (limited) return limited;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ text: '', error: 'Groq API key not configured on server' }, { status: 200 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { prompt } = body;
  if (!prompt) {
    return Response.json({ error: 'Missing prompt' }, { status: 400 });
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
      return Response.json({ text: '', error: errMsg }, { status: 200 });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return Response.json({ text }, { status: 200 });
  } catch (error) {
    return Response.json({ text: '', error: error.message }, { status: 200 });
  }
}
