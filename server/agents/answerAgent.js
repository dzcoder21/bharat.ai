const { callProvider } = require('../config/aiClients');
const { getConfig, getAvailableProviders } = require('../services/agentConfig');

const SYSTEM = `You are AnswerAgent for Bharat.AI — India's smartest AI search engine.
Give a helpful, accurate, well-structured answer to the search query.

FORMAT RULES (follow exactly):
- Line 1: **Direct answer in bold** (if query has a clear answer)
- Use ## for section headings
- Use • bullet points for lists
- Use **bold** for key terms and important facts
- Include real numbers, dates, statistics where relevant
- If query is in Hindi or Hinglish → respond in THAT language
- Keep response under 380 words
- End with exactly this line: 🔍 *Related:* [suggestion1], [suggestion2], [suggestion3]

Be factual, concise, and helpful.`;

async function runAnswerAgent(queryObj) {
  const empty = { answer: null, sources: [], _agent: 'failed' };

  // Get configured provider, with smart fallback
  const configuredProvider = getConfig().answerAgent || 'groq';
  const available = getAvailableProviders ? null : null; // lazy

  const prompt = `Search Query: "${queryObj.cleanQuery}"
Language detected: ${queryObj.language || 'english'}
Intent: ${queryObj.intent || 'informational'}

Please answer this search query clearly and helpfully:`;

  // Try primary provider first
  try {
    console.log(`🤖 AnswerAgent trying: ${configuredProvider}`);
    const answer = await callProvider(configuredProvider, 'answer', SYSTEM, prompt, 1200);
    if (answer && answer.length > 30) {
      console.log(`✅ AnswerAgent success: ${configuredProvider} (${answer.length} chars)`);
      return { answer, sources: [], _agent: configuredProvider };
    }
  } catch (err) {
    console.warn(`❌ AnswerAgent (${configuredProvider}):`, err.message);
  }

  // Fallback chain — try all available providers
  const fallbackOrder = ['groq', 'gemini', 'claude', 'openai'];
  for (const fb of fallbackOrder) {
    if (fb === configuredProvider) continue;
    try {
      console.log(`🔄 AnswerAgent fallback trying: ${fb}`);
      const answer = await callProvider(fb, 'answer', SYSTEM, prompt, 1000);
      if (answer && answer.length > 30) {
        console.log(`✅ AnswerAgent fallback success: ${fb}`);
        return { answer, sources: [], _agent: `${fb}(fallback)` };
      }
    } catch (err) {
      console.warn(`❌ AnswerAgent fallback (${fb}):`, err.message);
    }
  }

  console.error('❌ AnswerAgent: ALL providers failed');
  return empty;
}

module.exports = { runAnswerAgent };
