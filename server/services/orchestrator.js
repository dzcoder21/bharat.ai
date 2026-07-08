/**
 * SearchOrchestrator v5 — Two-stage fast architecture
 *
 *  quickSearch()  → QueryAgent + WebFetchAgent only. Target: <2s.
 *                    Returns web/news/image results immediately.
 *  enrichSearch() → AnswerAgent + RankAgent + RelatedAgent.
 *                    Called separately by the frontend right after quickSearch
 *                    so the AI answer "fills in" without blocking first paint.
 *
 * No wasteful re-fetching — a single web fetch per query, ever.
 */

const { runQueryAgent }    = require('../agents/queryAgent');
const { runWebFetchAgent } = require('../agents/webFetchAgent');
const { runAnswerAgent }   = require('../agents/answerAgent');
const { runRankAgent }     = require('../agents/rankAgent');
const { runRelatedAgent }  = require('../agents/relatedAgent');
const cache                = require('./cache');
const GeneratedImage       = require('../models/GeneratedImage');

const bridgeKey = (q) => `bridge:${q.toLowerCase().trim()}`;
const fullKey   = (q) => `full:${q.toLowerCase().trim()}`;

// ── Stage 1 — fast path ──────────────────────────────────────────────────
async function quickSearch(rawQuery) {
  const fKey = fullKey(rawQuery);
  const cachedFull = cache.get(fKey);
  if (cachedFull) return { ...cachedFull, _cached: true, _stage: 'full' };

  const start = Date.now();

  const [queryObj, webData, existingGenerated] = await Promise.all([
    runQueryAgent(rawQuery),
    runWebFetchAgent({ cleanQuery: rawQuery }, ['web', 'news', 'images', 'videos']),
    GeneratedImage.findOne({ query: rawQuery.toLowerCase().trim() }).catch(() => null),
  ]);

  const totalCount = (webData.web?.length || 0) + (webData.news?.length || 0);

  const response = {
    query:        rawQuery,
    cleanQuery:   queryObj.cleanQuery || rawQuery,
    intent:       queryObj.intent,
    language:     queryObj.language,
    entities:     queryObj.entities,
    tabs:         queryObj.tabs || ['web', 'news'],

    webResults:   webData.web    || [],
    newsResults:  webData.news   || [],
    imageResults: webData.images || [], videoResults: webData.videos || [],
    resultCount:  totalCount,
    hasResults:   totalCount > 0,

    // Existing AI-generated image for this query, if one was made before
    generatedImage: existingGenerated
      ? { url: existingGenerated.url, prompt: existingGenerated.prompt, seed: existingGenerated.seed }
      : null,

    // enrichment placeholders — filled in by enrichSearch
    aiAnswer: null, aiSources: [], featuredSnippet: null, knowledgePanel: null,
    peopleAlsoAsk: [], relatedSearches: [], autocomplete: [],

    elapsedMs: Date.now() - start,
    agents: { query: queryObj._agent },
    timestamp: new Date().toISOString(),
  };

  // Bridge cache: lets enrichSearch reuse queryObj + webData without refetching
  cache.set(bridgeKey(rawQuery), { queryObj, webData }, 90);

  return response;
}

// ── Stage 2 — enrichment (slow AI generation) ────────────────────────────
async function enrichSearch(rawQuery) {
  const start = Date.now();
  let bridge = cache.get(bridgeKey(rawQuery));

  // Bridge expired or missing → rebuild minimally (rare, e.g. direct API hit)
  if (!bridge) {
    const [queryObj, webData] = await Promise.all([
      runQueryAgent(rawQuery),
      runWebFetchAgent({ cleanQuery: rawQuery }, ['web', 'news', 'images', 'videos']),
    ]);
    bridge = { queryObj, webData };
  }
  const { queryObj, webData } = bridge;

  const [answerResult, rankResult, relatedResult] = await Promise.all([
    runAnswerAgent(queryObj),
    runRankAgent(queryObj, webData.web || []),
    runRelatedAgent(queryObj),
  ]);

  const ranked = (rankResult.rankedIndices || (webData.web || []).map((_, i) => i))
    .map((i) => {
      const r = (webData.web || [])[i];
      if (!r) return null;
      const improved = rankResult.improvedDescriptions?.[String(i)];
      return improved ? { ...r, description: improved } : r;
    })
    .filter(Boolean);

  const enrichment = {
    aiAnswer:        answerResult.answer,
    aiSources:       answerResult.sources,
    featuredSnippet: rankResult.featuredSnippet,
    knowledgePanel:  rankResult.knowledgePanel,
    peopleAlsoAsk:   relatedResult.peopleAlsoAsk,
    relatedSearches: relatedResult.relatedSearches,
    autocomplete:    relatedResult.autocomplete,
    webResults:      ranked.length ? ranked : (webData.web || []),
    agents: {
      answer:  answerResult._agent,
      rank:    rankResult._agent,
      related: relatedResult._agent,
    },
    enrichElapsedMs: Date.now() - start,
  };

  // Build & cache the merged full response for instant repeat-searches
  const existingGenerated = await GeneratedImage.findOne({ query: rawQuery.toLowerCase().trim() }).catch(() => null);
  const merged = {
    query: rawQuery, cleanQuery: queryObj.cleanQuery || rawQuery,
    intent: queryObj.intent, language: queryObj.language, entities: queryObj.entities,
    tabs: queryObj.tabs || ['web', 'news'],
    newsResults: webData.news || [], imageResults: webData.images || [], videoResults: webData.videos || [],
    resultCount: (enrichment.webResults.length) + (webData.news?.length || 0),
    hasResults: true,
    generatedImage: existingGenerated
      ? { url: existingGenerated.url, prompt: existingGenerated.prompt, seed: existingGenerated.seed }
      : null,
    timestamp: new Date().toISOString(),
    ...enrichment,
  };
  if (merged.hasResults || merged.aiAnswer) cache.set(fullKey(rawQuery), merged, 300);

  return enrichment;
}

// Backward-compatible single-call version (used by old clients if any)
async function orchestrateSearch(rawQuery) {
  const quick = await quickSearch(rawQuery);
  if (quick._cached) return quick;
  const enrich = await enrichSearch(rawQuery);
  return { ...quick, ...enrich, resultCount: enrich.webResults?.length ? enrich.webResults.length + (quick.newsResults?.length||0) : quick.resultCount };
}

module.exports = { quickSearch, enrichSearch, orchestrateSearch };
