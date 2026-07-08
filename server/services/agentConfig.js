/**
 * Agent Configuration Store
 * Stores which AI provider each agent uses
 * Persists to a simple JSON "config" in memory
 */

const DEFAULT_CONFIG = {
  queryAgent:   'groq',    // Fast query understanding
  answerAgent:  'gemini',  // AI answer generation
  rankAgent:    'groq',    // Result ranking
  relatedAgent: 'groq',    // Related searches / PAA
};

let config = { ...DEFAULT_CONFIG };

const getConfig  = ()          => ({ ...config });
const setConfig  = (updates)   => { config = { ...config, ...updates }; return config; };
const resetConfig = ()         => { config = { ...DEFAULT_CONFIG }; return config; };

const PROVIDER_INFO = {
  claude: { name: 'Claude',  label: 'Anthropic Claude',  color: '#FF6B35', free: false, speed: 'Medium', quality: '⭐⭐⭐⭐⭐' },
  openai: { name: 'GPT-4o',  label: 'OpenAI GPT-4o',    color: '#10a37f', free: false, speed: 'Medium', quality: '⭐⭐⭐⭐⭐' },
  groq:   { name: 'Groq',    label: 'Groq LLaMA 3.1',   color: '#f97316', free: true,  speed: 'Fast',   quality: '⭐⭐⭐⭐' },
  gemini: { name: 'Gemini',  label: 'Google Gemini 2.0', color: '#4285F4', free: true,  speed: 'Fast',   quality: '⭐⭐⭐⭐' },
};

const AGENT_INFO = {
  queryAgent:   { label: 'Query Agent',   desc: 'Understands intent, expands queries, detects language' },
  answerAgent:  { label: 'Answer Agent',  desc: 'Generates AI-powered answers with web search' },
  rankAgent:    { label: 'Rank Agent',    desc: 'Re-ranks results, generates featured snippets' },
  relatedAgent: { label: 'Related Agent', desc: 'Generates related searches & People Also Ask' },
};

module.exports = { getConfig, setConfig, resetConfig, PROVIDER_INFO, AGENT_INFO, DEFAULT_CONFIG };

// Re-export for convenience
const { getAvailableProviders } = require('../config/aiClients');
module.exports.getAvailableProviders = getAvailableProviders;
