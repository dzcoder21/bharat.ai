const { quickSearch, enrichSearch, orchestrateSearch } = require('../services/orchestrator');
const { callProvider } = require('../config/aiClients');
const { buildImageUrl } = require('../services/imageGen');
const GeneratedImage = require('../models/GeneratedImage');
const Search = require('../models/Search');

// ── GET /api/search/generate-image — on-demand generation with server cache ─
// Default: if an image already exists on the server for this query, return it
//          instantly (no new generation). Pass force=1 to always generate new.
exports.generateImage = async (req, res) => {
  const { prompt, seed, force } = req.query;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt required' });

  const key = prompt.trim().toLowerCase();

  try {
    if (!force) {
      const existing = await GeneratedImage.findOne({ query: key }).catch(() => null);
      if (existing) {
        return res.json({ url: existing.url, prompt: existing.prompt, seed: existing.seed, existing: true });
      }
    }

    const result = buildImageUrl(prompt.trim(), seed ? { seed: parseInt(seed, 10) } : {});

    // Persist (upsert) — fire and forget, don't block the response
    GeneratedImage.findOneAndUpdate(
      { query: key },
      { query: key, url: result.url, prompt: result.prompt, seed: result.seed },
      { upsert: true, new: true }
    ).catch(() => {});

    return res.json({ ...result, existing: false });
  } catch (err) {
    return res.status(500).json({ error: 'Could not build image request' });
  }
};


exports.quickSearch = async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ error: 'Query required' });
  try {
    const result = await quickSearch(q.trim().slice(0, 500));
    return res.json(result);
  } catch (err) {
    console.error('Quick search error:', err.message);
    
    return res.json({
      query: q, cleanQuery: q, webResults: [], newsResults: [],
      imageResults: [], videoResults: [], resultCount: 0,
      hasResults: false, aiAnswer: null, tabs: ['web', 'news'],
      error: err.message,
    });
  }
};

// ── GET /api/search/enrich — AI answer + ranking + related, called after quick ─
exports.enrichSearch = async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ error: 'Query required' });
  const rawQuery = q.trim().slice(0, 500);
  try {
    const enrichment = await enrichSearch(rawQuery);

    Search.create({
      query: rawQuery, cleanQuery: rawQuery,
      resultCount: enrichment.webResults?.length || 0,
    }).catch(() => {});

    return res.json(enrichment);
  } catch (err) {
    console.error('Enrich error:', err.message);
    return res.status(200).json({ aiAnswer: null, peopleAlsoAsk: [], relatedSearches: [], webResults: [] });
  }
};

// ── GET /api/search — legacy single-call (kept for compatibility) ──────────
exports.search = async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ error: 'Query required' });
  try {
    const result = await orchestrateSearch(q.trim().slice(0, 500));
    return res.json(result);
  } catch (err) {
    console.error('Search error:', err.message);
    return res.status(500).json({ error: 'Search failed. Please try again.' });
  }
};

exports.autocomplete = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ suggestions: [] });
  try {
    const text = await callProvider(
      'groq', 'related',
      'You are an autocomplete engine for an Indian search engine. Respond ONLY with a JSON array of 6 short query strings, max 60 chars each, Indian context preferred. No markdown.',
      `Complete this search prefix: "${q}"`,
      150
    );
    const suggestions = JSON.parse(text.replace(/```json|```/gi, '').trim());
    return res.json({ suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 6) : [] });
  } catch (_) {
    return res.json({ suggestions: [] });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await Search.find().sort({ searchedAt: -1 }).limit(20)
      .select('query cleanQuery searchedAt intent language');
    return res.json({ history });
  } catch (_) { return res.json({ history: [] }); }
};

exports.clearHistory = async (req, res) => {
  try { await Search.deleteMany({}); return res.json({ message: 'Cleared' }); }
  catch (_) { return res.status(500).json({ error: 'Failed' }); }
};

exports.deleteHistoryItem = async (req, res) => {
  try { await Search.findByIdAndDelete(req.params.id); return res.json({ message: 'Deleted' }); }
  catch (_) { return res.status(500).json({ error: 'Failed' }); }
};

exports.getTrending = async (req, res) => {
  try {
    const trending = await Search.aggregate([
      { $group: { _id: '$cleanQuery', count: { $sum: 1 }, last: { $max: '$searchedAt' } } },
      { $sort: { count: -1, last: -1 } }, { $limit: 12 },
      { $project: { query: '$_id', count: 1, _id: 0 } },
    ]);
    return res.json({ trending });
  } catch (_) { return res.json({ trending: [] }); }
};
