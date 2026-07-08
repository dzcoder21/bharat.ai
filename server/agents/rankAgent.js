const { callProvider } = require('../config/aiClients');
const { getConfig }    = require('../services/agentConfig');

const SYSTEM = `You are RankAgent for Bharat.AI. Given a query and web results JSON, respond ONLY with valid JSON:
{"rankedIndices":[0,1,2...],"improvedDescriptions":{"0":"..."},"featuredSnippet":"..."|null,"knowledgePanel":{"title":"","subtitle":"","description":"","facts":[{"label":"","value":""}]}|null}
Rules: include ALL indices; featuredSnippet = 1-3 sentence direct answer; knowledgePanel only for clear entities.`;

async function runRankAgent(queryObj, webResults) {
  const fallback = { rankedIndices:webResults.map((_,i)=>i), improvedDescriptions:{}, featuredSnippet:null, knowledgePanel:null, _agent:'fallback' };
  if (!webResults?.length) return fallback;

  const provider = getConfig().rankAgent || 'groq';
  const subset = webResults.slice(0,10).map((r,i)=>({i,title:r.title,url:r.url,desc:(r.description||'').slice(0,160)}));
  const prompt = `Query: "${queryObj.cleanQuery}"\nResults: ${JSON.stringify(subset)}`;

  try {
    const text = await callProvider(provider, 'rank', SYSTEM, prompt, 700);
    const parsed = JSON.parse(text.replace(/```json|```/gi,'').trim());
    const ranked = parsed.rankedIndices || [];
    const missing = webResults.map((_,i)=>i).filter(i=>!ranked.includes(i));
    return { ...fallback, ...parsed, rankedIndices:[...ranked,...missing], _agent:provider };
  } catch (err) {
    console.warn(`RankAgent (${provider}) error:`, err.message);
    return fallback;
  }
}
module.exports = { runRankAgent };
