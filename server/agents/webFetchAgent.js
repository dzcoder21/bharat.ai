/**
 * WebFetchAgent — Brave Search API + multi-fallback
 *
 * Priority:
 *  1. Brave Search API (best, if key provided) — web, news, images, videos
 *  2. Google Custom Search JSON API (if key provided)
 *  3. DuckDuckGo HTML scrape (free, no key needed)
 *  4. DuckDuckGo Instant Answer API (last resort)
 */

const axios = require('axios');

const BRAVE_BASE = 'https://api.search.brave.com/res/v1';

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch (_) { return ''; }
}

function domain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch (_) { return url; }
}

// ── 1. Brave Search API ─────────────────────────────────────────────────────
async function braveSearch(query, tabs = ['web', 'news']) {
  const result = { web: [], news: [], images: [], videos: [] };

  const { data } = await axios.get(`${BRAVE_BASE}/web/search`, {
    headers: {
      'X-Subscription-Token': process.env.BRAVE_API_KEY,
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
    },
    params: { q: query, count: 10, search_lang: 'en', country: 'IN', text_decorations: false },
    timeout: 8000,
  });

  result.web = (data.web?.results || []).map((r) => ({
    type: 'web',
    title: r.title || '',
    url: r.url || '',
    description: r.description || '',
    favicon: favicon(r.url),
    domain: domain(r.url),
    age: r.age || null,
    deepLinks: (r.extra_snippets || []).slice(0, 2),
  }));

  result.news = (data.news?.results || []).map((n) => ({
    type: 'news',
    title: n.title || '',
    url: n.url || '',
    description: n.description || '',
    favicon: favicon(n.url),
    domain: domain(n.url),
    age: n.age || null,
    thumbnail: n.thumbnail?.src || null,
    source: n.meta_url?.hostname?.replace('www.', '') || domain(n.url),
  }));

  // Fetch images separately if requested
  if (tabs.includes('images')) {
    try {
      const imgData = await axios.get(`${BRAVE_BASE}/images/search`, {
        headers: { 'X-Subscription-Token': process.env.BRAVE_API_KEY, Accept: 'application/json' },
        params: { q: query, count: 12, country: 'IN' },
        timeout: 6000,
      });
      result.images = (imgData.data.results || []).map((img) => ({
        type: 'image',
        title: img.title || '',
        url: img.url || '',
        imageUrl: img.thumbnail?.src || img.properties?.url || '',
        sourceUrl: img.source || '',
        domain: domain(img.url),
      }));
    } catch (_) {}
  }

  // Fetch videos separately if requested
  if (tabs.includes('videos')) {
    try {
      const vidData = await axios.get(`${BRAVE_BASE}/videos/search`, {
        headers: { 'X-Subscription-Token': process.env.BRAVE_API_KEY, Accept: 'application/json' },
        params: { q: query, count: 10, country: 'IN', search_lang: 'en' },
        timeout: 6000,
      });
      result.videos = (vidData.data.results || []).map((v) => ({
        type: 'video',
        title: v.title || '',
        url: v.url || '',
        description: v.description || '',
        thumbnail: v.thumbnail?.src || v.video?.thumbnail?.src || null,
        duration: v.video?.duration || null,
        source: v.meta_url?.hostname?.replace('www.', '') || domain(v.url),
        age: v.age || null,
      }));
    } catch (_) {}
  }

  return result;
}

// ── 2. Google Custom Search (optional, if keys set) ─────────────────────────
async function googleCSE(query) {
  if (!process.env.GOOGLE_CSE_KEY || !process.env.GOOGLE_CSE_ID) return null;

  const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key: process.env.GOOGLE_CSE_KEY,
      cx:  process.env.GOOGLE_CSE_ID,
      q:   query,
      num: 10,
      gl: 'in',
    },
    timeout: 8000,
  });

  const web = (data.items || []).map((r) => ({
    type: 'web',
    title: r.title || '',
    url: r.link || '',
    description: r.snippet || '',
    favicon: favicon(r.link),
    domain: domain(r.link),
    age: null,
    deepLinks: [],
  }));

  return { web, news: [], images: [], videos: [] };
}

// ── 3. DuckDuckGo HTML scrape ───────────────────────────────────────────────
async function ddgHtmlScrape(query) {
  const { data } = await axios.get('https://html.duckduckgo.com/html/', {
    params: { q: query, kl: 'in-en' },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      Accept: 'text/html',
    },
    timeout: 8000,
  });

  const results = [];
  const titleRegex   = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  const urlRegex     = /class="result__url"[^>]*>([\s\S]*?)<\/span>/g;

  let titleMatch, snippetMatch, urlMatch;
  const titles = [], snippets = [], urls = [];

  while ((titleMatch = titleRegex.exec(data)) !== null) {
    let url = decodeURIComponent(titleMatch[1]);
    if (url.includes('uddg=')) {
      try { url = new URL(url).searchParams.get('uddg') || url; } catch (_) {}
    }
    titles.push({ url, title: titleMatch[2].trim() });
  }
  while ((snippetMatch = snippetRegex.exec(data)) !== null) {
    snippets.push(snippetMatch[1].replace(/<[^>]+>/g, '').trim());
  }
  while ((urlMatch = urlRegex.exec(data)) !== null) {
    urls.push(urlMatch[1].replace(/<[^>]+>/g, '').trim());
  }

  for (let i = 0; i < Math.min(titles.length, 10); i++) {
    if (!titles[i].url || titles[i].url.startsWith('/')) continue;
    try { new URL(titles[i].url); } catch (_) { continue; }

    results.push({
      type: 'web',
      title: titles[i].title,
      url: titles[i].url,
      description: snippets[i] || '',
      favicon: favicon(titles[i].url),
      domain: domain(titles[i].url),
      age: null,
      deepLinks: [],
    });
  }

  return { web: results, news: [], images: [], videos: [] };
}

// ── 4. DuckDuckGo Instant Answer (last resort) ──────────────────────────────
async function ddgInstant(query) {
  const { data } = await axios.get('https://api.duckduckgo.com/', {
    params: { q: query, format: 'json', no_redirect: 1, no_html: 1, skip_disambig: 1 },
    timeout: 6000,
  });

  const results = [];

  if (data.AbstractURL && data.AbstractText) {
    results.push({
      type: 'web',
      title: data.Heading || query,
      url: data.AbstractURL,
      description: data.AbstractText,
      favicon: favicon(data.AbstractURL),
      domain: domain(data.AbstractURL),
      age: null,
      deepLinks: [],
      featured: true,
    });
  }

  (data.RelatedTopics || []).slice(0, 8).forEach((t) => {
    if (t.FirstURL && t.Text && !t.FirstURL.startsWith('/')) {
      results.push({
        type: 'web',
        title: t.Text.split(' - ')[0] || t.Text.slice(0, 70),
        url: t.FirstURL,
        description: t.Text,
        favicon: favicon(t.FirstURL),
        domain: domain(t.FirstURL),
        age: null,
        deepLinks: [],
      });
    }
  });

  return { web: results, news: [], images: [], videos: [] };
}

// ── Main Fetch Orchestrator ──────────────────────────────────────────────────
async function runWebFetchAgent(queryObj, tabs = ['web', 'news', 'images', 'videos']) {
  const q = queryObj.cleanQuery || queryObj;
  const empty = { web: [], news: [], images: [], videos: [] };

  if (process.env.BRAVE_API_KEY) {
    try {
      console.log('🌐 Using Brave Search');
      return await braveSearch(q, tabs);
    } catch (err) {
      console.warn('Brave failed:', err.message);
    }
  }

  try {
    const gResult = await googleCSE(q);
    if (gResult && gResult.web.length > 0) {
      console.log('🌐 Using Google CSE');
      return gResult;
    }
  } catch (_) {}

  try {
    console.log('🌐 Using DDG HTML scrape');
    const scrapeResult = await ddgHtmlScrape(q);
    if (scrapeResult.web.length > 0) return scrapeResult;
  } catch (err) {
    console.warn('DDG scrape failed:', err.message);
  }

  try {
    console.log('🌐 Using DDG Instant Answer');
    return await ddgInstant(q);
  } catch (err) {
    console.warn('DDG instant failed:', err.message);
  }

  return empty;
}

module.exports = { runWebFetchAgent };
