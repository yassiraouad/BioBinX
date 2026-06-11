import { checkRateLimit, getClientIp, isAllowedOrigin } from '../../lib/apiSecurity';

function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const SYSTEM_PROMPTS = {
  teacher: `Du er en hjelpsom AI-assistent for BioBin X, et miljø-app for skoler.
Du hjelper lærere med å analysere klassestatistikk, elevprestasjoner og søppeldata.
Svar alltid på norsk. Vær vennlig og profesjonell.
Ikke oppgi falsk informasjon. Hvis du er usikker, si ifra.`,
  
  admin: `Du er en AI-assistent for BioBin X admin-dashboard.
Du hjelper med å forstå systemstatistikk og rapporter.
Svar alltid på norsk. Vær vennlig og profesjonell.`
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Unsupported content type' });
  }

  const { message, role = 'teacher' } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing message' });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(`ai_${ip}`, 20, 60000)) {
    return res.status(429).json({ error: 'For mange forespørsler. Prøv igjen om et øyeblikk.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return res.status(200).json({ 
      response: 'AI-assistenten er ikke konfigurert. Kontakt administrator for å sette opp API-nøkkel.' 
    });
  }

  const sanitizedMessage = message.trim().substring(0, 1000);
  const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.teacher;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || 'Kunne ikke få svar fra AI';
    
    reply = sanitizeHTML(reply);

    res.status(200).json({ response: reply });
  } catch (error) {
    console.error('AI API error:', error);
    res.status(200).json({ 
      response: 'Noe gikk galt med AI-assistenten. Prøv igjen senere.' 
    });
  }
}
