/**
 * Web Search Service
 * Priority: Brave Search → SerpAPI → DuckDuckGo
 * News: NewsAPI → Brave News
 * Images: Brave Images
 */

const axios  = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 300 });

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return ''; }
}

function getFavicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch { return ''; }
}

// ── Brave Web Search ──────────────────────────────────────
async function braveWebSearch(query, count = 10, region = 'IN') {
  const key = `brave_web_${query}_${count}`;
  const cached = cache.get(key);
  if (cached) return cached;

  if (!process.env.BRAVE_API_KEY) return [];

  try {
    const { data } = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'X-Subscription-Token': process.env.BRAVE_API_KEY,
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
      },
      params: {
        q: query, count, search_lang: 'en',
        country: region, safesearch: 'moderate',
        freshness: 'pw', // past week for time-sensitive
      },
      timeout: 8000,
    });

    const results = (data.web?.results || []).map(r => ({
      title      : r.title || '',
      url        : r.url || '',
      description: r.description || '',
      favicon    : getFavicon(r.url),
      domain     : getDomain(r.url),
      published  : r.page_age || null,
      thumbnail  : r.thumbnail?.src || null,
      language   : r.language || 'en',
    }));

    cache.set(key, results);
    return results;
  } catch (err) {
    console.error('Brave Web Error:', err.message);
    return [];
  }
}

// ── Brave News Search ─────────────────────────────────────
async function braveNewsSearch(query, count = 8) {
  const key = `brave_news_${query}`;
  const cached = cache.get(key);
  if (cached) return cached;

  if (!process.env.BRAVE_API_KEY) return [];

  try {
    const { data } = await axios.get('https://api.search.brave.com/res/v1/news/search', {
      headers: {
        'X-Subscription-Token': process.env.BRAVE_API_KEY,
        Accept: 'application/json',
      },
      params: { q: query, count, country: 'IN', search_lang: 'en' },
      timeout: 6000,
    });

    const results = (data.results || []).map(r => ({
      title      : r.title || '',
      url        : r.url || '',
      description: r.description || '',
      source     : r.meta_url?.hostname?.replace('www.', '') || '',
      favicon    : getFavicon(r.url),
      thumbnail  : r.thumbnail?.src || null,
      publishedAt: r.page_age || null,
      age        : r.age || null,
    }));

    cache.set(key, results);
    return results;
  } catch (err) {
    console.error('Brave News Error:', err.message);
    return [];
  }
}

// ── Brave Image Search ────────────────────────────────────
async function braveImageSearch(query, count = 12) {
  const key = `brave_img_${query}`;
  const cached = cache.get(key);
  if (cached) return cached;

  if (!process.env.BRAVE_API_KEY) return [];

  try {
    const { data } = await axios.get('https://api.search.brave.com/res/v1/images/search', {
      headers: {
        'X-Subscription-Token': process.env.BRAVE_API_KEY,
        Accept: 'application/json',
      },
      params: { q: query, count, safesearch: 'moderate' },
      timeout: 6000,
    });

    const results = (data.results || []).map(r => ({
      title    : r.title || '',
      url      : r.url || '',
      imageUrl : r.properties?.url || r.thumbnail?.src || '',
      thumbnail: r.thumbnail?.src || '',
      width    : r.properties?.width || null,
      height   : r.properties?.height || null,
      domain   : getDomain(r.url),
      source   : r.source || getDomain(r.url),
    }));

    cache.set(key, results);
    return results;
  } catch (err) {
    console.error('Brave Images Error:', err.message);
    return [];
  }
}

// ── NewsAPI ───────────────────────────────────────────────
async function newsApiSearch(query, count = 8) {
  if (!process.env.NEWS_API_KEY) return [];

  try {
    const { data } = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q       : query,
        pageSize: count,
        sortBy  : 'relevancy',
        language: 'en',
        apiKey  : process.env.NEWS_API_KEY,
      },
      timeout: 6000,
    });

    return (data.articles || []).map(a => ({
      title      : a.title || '',
      url        : a.url || '',
      description: a.description || '',
      source     : a.source?.name || '',
      favicon    : getFavicon(a.url),
      thumbnail  : a.urlToImage || null,
      publishedAt: a.publishedAt || null,
      age        : null,
    }));
  } catch (err) {
    console.error('NewsAPI Error:', err.message);
    return [];
  }
}

// ── SerpAPI (Google Results fallback) ────────────────────
async function serpApiSearch(query, count = 10) {
  if (!process.env.SERP_API_KEY) return [];

  try {
    const { data } = await axios.get('https://serpapi.com/search', {
      params: {
        q      : query,
        num    : count,
        gl     : 'in',
        hl     : 'en',
        api_key: process.env.SERP_API_KEY,
      },
      timeout: 8000,
    });

    return (data.organic_results || []).map(r => ({
      title      : r.title || '',
      url        : r.link || '',
      description: r.snippet || '',
      favicon    : getFavicon(r.link || ''),
      domain     : getDomain(r.link || ''),
      published  : r.date || null,
      thumbnail  : r.thumbnail || null,
      position   : r.position || null,
    }));
  } catch (err) {
    console.error('SerpAPI Error:', err.message);
    return [];
  }
}

// ── DuckDuckGo Fallback ────────────────────────────────────
async function duckDuckGoSearch(query) {
  try {
    const { data } = await axios.get('https://api.duckduckgo.com/', {
      params: { q: query, format: 'json', no_redirect: 1, no_html: 1 },
      timeout: 5000,
    });

    const results = [];
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 8).forEach(t => {
        if (t.FirstURL && t.Text) {
          results.push({
            title      : t.Text.split(' - ')[0]?.slice(0, 80) || t.Text.slice(0, 80),
            url        : t.FirstURL,
            description: t.Text,
            favicon    : getFavicon(t.FirstURL),
            domain     : getDomain(t.FirstURL),
            published  : null,
            thumbnail  : t.Icon?.URL || null,
          });
        }
      });
    }
    return results;
  } catch (err) {
    return [];
  }
}

// ── Unified Web Search ─────────────────────────────────────
async function searchWeb(query, count = 10, region = 'IN') {
  // Priority: Brave → SerpAPI → DDG
  let results = await braveWebSearch(query, count, region);
  if (results.length === 0 && process.env.SERP_API_KEY) {
    results = await serpApiSearch(query, count);
  }
  if (results.length === 0) {
    results = await duckDuckGoSearch(query);
  }
  return results;
}

// ── Unified News Search ────────────────────────────────────
async function searchNews(query) {
  let results = await newsApiSearch(query);
  if (results.length === 0) results = await braveNewsSearch(query);
  return results;
}

module.exports = {
  searchWeb,
  searchNews,
  braveImageSearch,
};
