const OpenAI = require('openai');
const NodeCache = require('node-cache');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cache  = new NodeCache({ stdTTL: 600 });

exports.getSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ suggestions: [] });

  const query = q.trim().slice(0, 100);
  const cacheKey = `suggest_${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ suggestions: cached });

  try {
    const resp = await openai.chat.completions.create({
      model      : 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens : 150,
      response_format: { type: 'json_object' },
      messages   : [{
        role: 'user',
        content: `Generate 6 search autocomplete suggestions for: "${query}"
Context: Indian users, mix of English/Hindi topics.
Return ONLY JSON: { "suggestions": ["...", "...", "..."] }`,
      }],
    });

    const parsed = JSON.parse(resp.choices[0].message.content || '{}');
    const suggestions = parsed.suggestions || [];
    cache.set(cacheKey, suggestions);
    return res.json({ suggestions });
  } catch (_) {
    return res.json({ suggestions: [] });
  }
};
