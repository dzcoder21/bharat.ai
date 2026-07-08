/**
 * Agent Configuration — Runtime Switchable
 * Stores which model/provider each agent uses
 */

const MODELS = {
  // Anthropic Claude
  'claude-sonnet':  { provider: 'anthropic', model: 'claude-sonnet-4-20250514',    label: 'Claude Sonnet 4', color: '#FF6B35' },
  'claude-haiku':   { provider: 'anthropic', model: 'claude-haiku-4-5-20251001',   label: 'Claude Haiku',    color: '#FF8C5A' },
  // OpenAI
  'gpt-4o':         { provider: 'openai',    model: 'gpt-4o',                      label: 'GPT-4o',          color: '#10a37f' },
  'gpt-4o-mini':    { provider: 'openai',    model: 'gpt-4o-mini',                 label: 'GPT-4o Mini',     color: '#1abc9c' },
  // Groq
  'llama-70b':      { provider: 'groq',      model: 'llama-3.1-70b-versatile',     label: 'LLaMA 3.1 70B',  color: '#f55036' },
  'llama-8b':       { provider: 'groq',      model: 'llama-3.1-8b-instant',        label: 'LLaMA 3.1 8B',   color: '#ff6b4a' },
  // Gemini
  'gemini-flash':   { provider: 'gemini',    model: 'gemini-2.0-flash',            label: 'Gemini 2.0 Flash',color: '#4285F4' },
};

// Default config — best free options
let _config = {
  queryAgent:   'llama-70b',     // Groq — fast, free
  answerAgent:  'gemini-flash',  // Gemini — free, good
  rankAgent:    'llama-8b',      // Groq — fastest, free
  relatedAgent: 'llama-8b',      // Groq — fastest, free
};

// Available choices per agent role
const AGENT_OPTIONS = {
  queryAgent:   ['llama-70b', 'llama-8b', 'gpt-4o', 'gpt-4o-mini', 'claude-haiku', 'gemini-flash'],
  answerAgent:  ['gemini-flash', 'claude-sonnet', 'claude-haiku', 'gpt-4o', 'llama-70b'],
  rankAgent:    ['llama-8b', 'llama-70b', 'gpt-4o-mini', 'claude-haiku', 'gemini-flash'],
  relatedAgent: ['llama-8b', 'llama-70b', 'gpt-4o-mini', 'claude-haiku', 'gemini-flash'],
};

const getConfig    = ()      => ({ ..._config });
const setConfig    = (patch) => { _config = { ..._config, ...patch }; };
const getModels    = ()      => MODELS;
const getOptions   = ()      => AGENT_OPTIONS;
const resolveModel = (key)   => MODELS[key] || MODELS['llama-8b'];

module.exports = { getConfig, setConfig, getModels, getOptions, resolveModel };
