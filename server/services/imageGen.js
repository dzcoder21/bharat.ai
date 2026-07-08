/**
 * Image Generation Service — Pollinations.ai
 *
 * IMPORTANT: gen.pollinations.ai (the newer unified endpoint) now REQUIRES
 * an API key for all generation requests. We use the legacy
 * image.pollinations.ai/prompt/ endpoint instead, which is still free
 * and keyless for the Flux model.
 *
 * Docs: https://github.com/pollinations/pollinations
 */

const BASE_URL = 'https://image.pollinations.ai/prompt';
const MAX_PROMPT_LENGTH = 300;

function buildImageUrl(rawPrompt, opts = {}) {
  const {
    seed = Math.floor(Math.random() * 1_000_000),
    width = 768,
    height = 768,
    model = 'flux',
  } = opts;

  const prompt = String(rawPrompt || '').trim().slice(0, MAX_PROMPT_LENGTH);
  if (!prompt) throw new Error('Prompt is required');

  const params = new URLSearchParams({
    model,
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: 'true',
    safe: 'true',
    private: 'true',
  });

  return {
    url: `${BASE_URL}/${encodeURIComponent(prompt)}?${params.toString()}`,
    prompt,
    seed,
  };
}

module.exports = { buildImageUrl };
