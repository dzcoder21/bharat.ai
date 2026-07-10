const Anthropic = require('@anthropic-ai/sdk');
const OpenAI    = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let _anthropic = null, _openai = null, _groq = null, _gemini = null;

const getAnthropic = () => {
  if (!_anthropic) {
    const k = (process.env.ANTHROPIC_API_KEY || '').trim();
    if (!k) throw new Error('ANTHROPIC_API_KEY missing in .env');
    _anthropic = new Anthropic({ apiKey: k });
  }
  return _anthropic;
};
const getOpenAI = () => {
  if (!_openai) {
    const k = (process.env.OPENAI_API_KEY || '').trim();
    if (!k) throw new Error('OPENAI_API_KEY missing in .env');
    _openai = new OpenAI({ apiKey: k });
  }
  return _openai;
};
const getGroq = () => {
  if (!_groq) {
    const k = (process.env.GROQ_API_KEY || '').trim();
    if (!k) throw new Error('GROQ_API_KEY missing in .env');
    _groq = new OpenAI({ apiKey: k, baseURL: 'https://api.groq.com/openai/v1' });
  }
  return _groq;
};
const getGemini = () => {
  if (!_gemini) {
    const k = (process.env.GEMINI_API_KEY || '').trim();
    if (!k) throw new Error('GEMINI_API_KEY missing in .env');
    _gemini = new GoogleGenerativeAI(k);
  }
  return _gemini;
};

// ── Timeout wrapper — stops one stuck provider from hanging the request ────
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);

const openaiChat = (client, model, system, user, maxTokens = 700) =>
  client.chat.completions.create({
    model, max_tokens: maxTokens, temperature: 0.3,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  }).then(res => res.choices[0]?.message?.content?.trim() || '');

const claudeChat = (model, system, user, maxTokens = 700) =>
  getAnthropic().messages.create({
    model, max_tokens: maxTokens, system,
    messages: [{ role: 'user', content: user }],
  }).then(res => res.content.filter(c => c.type === 'text').map(c => c.text).join('').trim());

const claudeWebSearch = (model, system, user, maxTokens = 1200) =>
  getAnthropic().messages.create({
    model, max_tokens: maxTokens, system,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: user }],
  }).then(res => res.content.filter(c => c.type === 'text').map(c => c.text).join('').trim());

const geminiGenerate = async (prompt, maxTokens = 1200) => {
  const model = getGemini().getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text()?.trim() || '';
};

const MODELS = {
  query:   { claude:'claude-haiku-4-5-20251001', openai:'gpt-4o-mini', groq:'llama-3.3-70b-versatile', gemini:'gemini-2.0-flash' },
  answer:  { claude:'claude-sonnet-4-6',         openai:'gpt-4o',      groq:'llama-3.3-70b-versatile', gemini:'gemini-2.0-flash' },
  rank:    { claude:'claude-haiku-4-5-20251001', openai:'gpt-4o-mini', groq:'llama-3.1-8b-instant',    gemini:'gemini-2.0-flash' },
  related: { claude:'claude-haiku-4-5-20251001', openai:'gpt-4o-mini', groq:'llama-3.1-8b-instant',    gemini:'gemini-2.0-flash' },
};

// Per-role timeout budgets (ms) — fail fast so fallback chain can kick in
const TIMEOUTS = { query: 6000, answer: 11000, rank: 6000, related: 6000 };

const callProvider = (provider, role, system, user, maxTokens = 700) => {
  const model = MODELS[role]?.[provider];
  if (!model) return Promise.reject(new Error(`No model for ${provider}/${role}`));
  const ms = TIMEOUTS[role] || 8000;

  let promise;
  if (provider === 'claude') {
    promise = role === 'answer'
      ? claudeWebSearch(model, system, user, maxTokens)
      : claudeChat(model, system, user, maxTokens);
  } else if (provider === 'openai') {
    promise = openaiChat(getOpenAI(), model, system, user, maxTokens);
  } else if (provider === 'groq') {
    promise = openaiChat(getGroq(), model, system, user, maxTokens);
  } else if (provider === 'gemini') {
    promise = geminiGenerate(`${system}\n\n${user}`, maxTokens);
  } else {
    return Promise.reject(new Error(`Unknown provider: ${provider}`));
  }
  return withTimeout(promise, ms, `${provider}:${role}`);
};

const getAvailableProviders = () => ({
  claude: !!(process.env.ANTHROPIC_API_KEY || '').trim(),
  openai: !!(process.env.OPENAI_API_KEY    || '').trim(),
  groq:   !!(process.env.GROQ_API_KEY      || '').trim(),
  gemini: !!(process.env.GEMINI_API_KEY    || '').trim(),
});

module.exports = { getAnthropic, getOpenAI, getGroq, getGemini, callProvider, geminiGenerate, getAvailableProviders };
