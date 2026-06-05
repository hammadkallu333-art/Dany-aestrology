export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, dob, tob, city, focus, sunSign, moonSign, risingSign } = req.body;

  if (!name || !dob || !city || !sunSign) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const focusMap = {
    general: 'General Life Reading',
    love: 'Love & Relationships',
    career: 'Career & Success',
    wealth: 'Wealth & Abundance',
    spiritual: 'Spiritual Growth',
    health: 'Health & Wellbeing'
  };

  const focusLabel = focusMap[focus] || 'General Life Reading';
  const tobFmt = tob ? ` at ${tob}` : '';

  const prompt = `You are AstroAI, a mystical and deeply insightful astrologer. Generate a beautiful, personal astrological reading.

Person: ${name}, born ${dob}${tobFmt} in ${city}
Sun Sign: ${sunSign.name} (${sunSign.element}, ruled by ${sunSign.planet})
Moon Sign: ${moonSign.name} (${moonSign.element}, ruled by ${moonSign.planet})
Rising Sign: ${risingSign.name} (${risingSign.element}, ruled by ${risingSign.planet})
Focus: ${focusLabel}

Reply ONLY with valid JSON, no markdown, no extra text:
{
  "personality": "3-4 sentences about their core self based on sun sign.",
  "moonMind": "2-3 sentences about their emotional inner world based on moon sign.",
  "risingAura": "1-2 sentences about how they appear to the world based on rising sign.",
  "focusReading": "4-5 sentences specifically about ${focusLabel} for this person.",
  "strengths": [
    {"icon": "◎", "name": "Strength Name", "desc": "Brief description under 8 words"},
    {"icon": "✦", "name": "Strength Name", "desc": "Brief description under 8 words"},
    {"icon": "♡", "name": "Strength Name", "desc": "Brief description under 8 words"},
    {"icon": "⬆", "name": "Strength Name", "desc": "Brief description under 8 words"}
  ],
  "challenge": "1-2 sentences about their main life challenge.",
  "cosmicMessage": "2-3 poetic sentences directly from the cosmos to ${name}."
}`;

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
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'AI service error' });
    }

    const raw = data.content.map(c => c.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const reading = JSON.parse(clean);

    return res.status(200).json({ reading });

  } catch (err) {
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
