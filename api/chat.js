export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, userContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  const limitedMessages = messages.slice(-20);

  const systemPrompt = `You are Celeste, the AstroAI cosmic guide — a warm, wise, and mystical astrology chatbot.
${userContext ? `The user's chart context: ${JSON.stringify(userContext)}` : ''}

Your personality:
- Warm, poetic, and encouraging
- Knowledgeable about astrology, zodiac signs, planets, houses, and cosmic cycles
- Keep responses concise (2-4 sentences usually)
- Use occasional astrology symbols: ☽ ✦ ♡ ♒ ♈
- Never break character. Never discuss unrelated topics.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: systemPrompt,
        messages: limitedMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'AI service error' });
    }

    const reply = data.content.map(c => c.text || '').join('');
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
