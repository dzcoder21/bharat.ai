const { callProvider } = require('../config/aiClients');
const { getConfig }    = require('../services/agentConfig');

const SYSTEM = `You are RelatedAgent for Bharat.AI. Respond ONLY with valid JSON:
{"relatedSearches":["...x8"],"peopleAlsoAsk":[{"question":"...","answer":"..."}x4],"autocomplete":["...x6"]}
Rules: 8 diverse related searches; 4 PAA with short answers; 6 autocomplete suggestions. Indian context preferred.`;

async function runRelatedAgent(queryObj) {
  const fallback = { relatedSearches:[], peopleAlsoAsk:[], autocomplete:[], _agent:'fallback' };
  const provider = getConfig().relatedAgent || 'groq';

  try {
    const text = await callProvider(provider, 'related', SYSTEM, queryObj.cleanQuery, 600);
    const parsed = JSON.parse(text.replace(/```json|```/gi,'').trim());
    return { ...fallback, ...parsed, _agent:provider };
  } catch (err) {
    console.warn(`RelatedAgent (${provider}) error:`, err.message);
    return fallback;
  }
}
module.exports = { runRelatedAgent };
