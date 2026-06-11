import { checkRateLimit, getClientIp, isAllowedOrigin } from '../../../lib/apiSecurity';

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, 500).replace(/[<>]/g, '');
}

function validateQuestion(q) {
  if (!q || typeof q !== 'object') return null;
  
  const question = sanitizeString(q.question);
  const options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
  const correctIndex = typeof q.correctIndex === 'number' ? q.correctIndex : -1;
  
  if (!question || question.length < 5) return null;
  if (options.length < 4) return null;
  if (correctIndex < 0 || correctIndex > 3) return null;
  
  for (const opt of options) {
    if (typeof opt !== 'string' || opt.length < 1) return null;
  }
  
  return {
    question,
    options: options.map(sanitizeString),
    correctIndex
  };
}

function extractJSON(content) {
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
  
  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
  
  return null;
}

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

  const { count = 5 } = req.body;

  if (typeof count !== 'number' || count < 1 || count > 20) {
    return res.status(400).json({ error: 'Antall spørsmål må være mellom 1 og 20' });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(`quizgen_${ip}`, 10, 60000)) {
    return res.status(429).json({ error: 'For mange forespørsler. Prøv igjen om et øyeblikk.' });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API-nøkkel ikke konfigurert' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'user',
            content: `Generer ${count} quiz-spørsmål om matsvinn, biogass og miljø for ungdomsskoleelever. Returner kun et JSON-array uten forklaring eller markdown. Hvert objekt skal ha: { question: string, options: string[4], correctIndex: number }. Spørsmålene skal være på norsk og passe for 12-15 åringer. Svar kun med JSON-array.`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Groq API request failed');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '[]';

    content = content.replace(/```json\n?|```\n?/g, '').trim();

    let parsed = extractJSON(content);
    
    if (!parsed || !Array.isArray(parsed)) {
      return res.status(500).json({ error: 'Kunne ikke parse spørsmål fra AI. Prøv igjen.' });
    }

    const questions = [];
    for (const q of parsed) {
      const validated = validateQuestion(q);
      if (validated) {
        questions.push({
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...validated,
          category: 'ai_generated'
        });
      }
    }

    if (questions.length === 0) {
      return res.status(500).json({ error: 'Ingen gyldige spørsmål generert. Prøv igjen.' });
    }

    res.status(200).json({ questions: questions.slice(0, count) });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Kunne ikke generere spørsmål. Prøv igjen senere.' });
  }
}
