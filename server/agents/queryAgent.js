const { callProvider } = require('../config/aiClients');
const { getConfig }    = require('../services/agentConfig');

const SYSTEM = `You are QueryAgent for Bharat.AI — India's AI search engine.
Given a raw search query, respond ONLY with valid JSON (no markdown):
{
  "language": "hindi"|"english"|"hinglish",
  "intent": "informational"|"navigational"|"transactional"|"local"|"news",
  "cleanQuery": "<normalized query>",
  "expandedQueries": ["exact","broader","specific"],
  "entities": {"people":[],"places":[],"orgs":[],"topics":[]},
  "tabs": ["web","news","images"],
  "timeContext": "any"|"past_day"|"past_week"|"past_month"
}
Rules: always include "web"; add "news" for sports/weather/events; add "images" for products/people/places.`;

async function runQueryAgent(rawQuery) {
  const fallback = {
    language:'english', intent:'informational', cleanQuery:rawQuery,
    expandedQueries:[rawQuery, rawQuery+' 2025', rawQuery+' India'],
    entities:{people:[],places:[],orgs:[],topics:[]},
    tabs:['web','news'], timeContext:'any', _agent:'fallback',
  };

  const provider = getConfig().queryAgent || 'groq';
  try {
    const text = await callProvider(provider, 'query', SYSTEM, rawQuery, 400);
    const parsed = JSON.parse(text.replace(/```json|```/gi,'').trim());
    return { ...fallback, ...parsed, _agent: `${provider}`, _provider: provider };
  } catch (err) {
    console.warn(`QueryAgent (${provider}) error:`, err.message);
    // Fallback chain
    for (const fb of ['groq','gemini','openai','claude']) {
      if (fb === provider) continue;
      try {
        const text = await callProvider(fb, 'query', SYSTEM, rawQuery, 400);
        const parsed = JSON.parse(text.replace(/```json|```/gi,'').trim());
        return { ...fallback, ...parsed, _agent: `${fb}(fallback)`, _provider: fb };
      } catch (_) {}
    }
    return fallback;
  }
}
module.exports = { runQueryAgent };
