import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { quickSearch, enrichSearch, autocomplete, clearHistory } from '../utils/api';
import { useDebounce } from '../hooks/useDebounce';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useAuth } from '../context/AuthContext';
import AgentSettings from '../components/settings/AgentSettings';
import AIAnswerCard from '../components/results/AIAnswerCard';
import WebResultCard from '../components/results/WebResultCard';
import NewsCard from '../components/results/NewsCard';
import VideoCard from '../components/results/VideoCard';
import ImageGrid from '../components/results/ImageGrid';
import GeneratedImageCard from '../components/results/GeneratedImageCard';
import ImageStrip from '../components/results/ImageStrip';
import {
  FeaturedSnippet, PeopleAlsoAsk, RelatedSearches,
  KnowledgePanel, ResultsSkeleton, AnswerSkeleton,
} from '../components/results/index.js';
import s from './Results.module.css';

const TABS = [
  { id: 'all',    label: 'All',    icon: '⊞' },
  { id: 'images', label: 'Images', icon: '🖼️' },
  { id: 'videos', label: 'Videos', icon: '🎬' },
  { id: 'news',   label: 'News',   icon: '📰' },
];

const AGENT_COLORS = { claude: '#f97316', openai: '#10a37f', groq: '#fb923c', gemini: '#60a5fa' };

export default function Results() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const inputRef        = useRef(null);
  const { user, logout } = useAuth();

  const [inputVal, setInputVal]     = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab]   = useState('all');
  const [data, setData]             = useState(null);     // quick results (web/news/images/meta)
  const [enrich, setEnrich]         = useState(null);      // AI answer + rank + related
  const [loadingQuick, setLoadingQuick] = useState(false);
  const [loadingEnrich, setLoadingEnrich] = useState(false);
  const [error, setError]           = useState(null);
  const [showDrop, setShowDrop]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const debouncedQ = useDebounce(inputVal, 280);
  const reqIdRef = useRef(0);

  const onVoice = useCallback((t) => {
    setInputVal(t);
    navigate(`/results?q=${encodeURIComponent(t)}`);
  }, [navigate]);
  const { listening, transcript, supported: voiceOk, startListening, stopListening } = useVoiceSearch(onVoice);

  // ── Two-stage search: quick shows instantly, enrich fills the AI answer in ──
  const runSearch = useCallback(async (q) => {
    const query = q?.trim();
    if (!query) return;
    const myId = ++reqIdRef.current;

    setActiveTab('all');
    setError(null);
    setEnrich(null);
    setData(null);
    setLoadingQuick(true);
    setLoadingEnrich(true);

    try {
      const quick = await quickSearch(query);
      if (myId !== reqIdRef.current) return; // a newer search superseded this one
      setData(quick);
      setLoadingQuick(false);

      if (quick._cached) {
        // Full cached payload already contains enrichment
        setEnrich(quick);
        setLoadingEnrich(false);
        return;
      }
    } catch (e) {
      if (myId !== reqIdRef.current) return;
      setError(e.response?.data?.error || 'Search failed. Please try again.');
      setLoadingQuick(false);
      setLoadingEnrich(false);
      return;
    }

    try {
      const enriched = await enrichSearch(query);
      if (myId !== reqIdRef.current) return;
      setEnrich(enriched);
    } catch (_) {
      if (myId !== reqIdRef.current) return;
      setEnrich({ aiAnswer: null });
    } finally {
      if (myId === reqIdRef.current) setLoadingEnrich(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setInputVal(q); runSearch(q); }
  }, [searchParams, runSearch]);

  useEffect(() => {
    if (debouncedQ.length >= 2) {
      autocomplete(debouncedQ).then(r => setSuggestions(r.suggestions || [])).catch(() => {});
    } else setSuggestions([]);
  }, [debouncedQ]);

  function go(q) {
    const t = (q || inputVal).trim();
    if (!t) return;
    setShowDrop(false);
    navigate(`/results?q=${encodeURIComponent(t)}`);
  }
  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') go(activeIdx >= 0 ? suggestions[activeIdx] : undefined);
    else if (e.key === 'Escape') setShowDrop(false);
  }

  // Always show all tabs — Google style. If a tab has no results, show empty state inside.
  const visibleTabs = TABS;

  // Prefer enriched (re-ranked) results once available, fall back to quick results
  const webResults = enrich?.webResults?.length ? enrich.webResults : (data?.webResults || []);
  const resultCount = webResults.length + (data?.newsResults?.length || 0);

  return (
    <div className={s.page} onClick={() => setShowUserMenu(false)}>

      {/* ── Sticky Top Bar ── */}
      <header className={s.topBar}>
        <button className={s.logo} onClick={() => navigate('/')}>
          <span className={s.lg1}>B</span><span className={s.lg2}>H</span>
          <span className={s.lg1}>A</span><span className={s.lg2}>R</span>
          <span className={s.lg1}>A</span><span className={s.lg2}>T</span>
          <span className={s.lgAI}>.AI</span>
        </button>

        {/* Search box */}
        <div className={s.searchWrap}>
          <div className={`${s.searchBox} ${listening ? s.searchListen : ''} ${showDrop && suggestions.length ? s.searchOpen : ''}`}>
            <span className={s.searchIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              ref={inputRef} className={s.input}
              value={listening ? (transcript || '') : inputVal}
              onChange={e => { setInputVal(e.target.value); setShowDrop(true); setActiveIdx(-1); }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 160)}
              onKeyDown={handleKey} placeholder="Search..." autoComplete="off" readOnly={listening}
            />
            {inputVal && !listening && (
              <button className={s.clearBtn} onClick={() => setInputVal('')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
            <span className={s.vDivider}/>
            {voiceOk && (
              <button className={`${s.voiceBtn} ${listening ? s.voiceBtnActive : ''}`} onClick={listening ? stopListening : startListening}>
                {listening
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--saffron)"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                }
              </button>
            )}

            {showDrop && suggestions.length > 0 && !listening && (
              <ul className={s.dropdown}>
                {suggestions.map((sg, i) => (
                  <li key={sg} className={`${s.dropItem} ${activeIdx === i ? s.dropItemActive : ''}`}
                    onMouseDown={() => go(sg)} onMouseEnter={() => setActiveIdx(i)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    {sg}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className={s.searchBtn} onClick={() => go()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
        </div>

        {/* Right controls */}
        <div className={s.topRight} onClick={e => e.stopPropagation()}>
          <button className={s.settingsBtn} onClick={() => setShowSettings(true)} title="Agent Settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span className={s.settingsLabel}>Agents</span>
          </button>
          {user ? (
            <div className={s.userWrap}>
              <button className={s.avatarBtn} onClick={() => setShowUserMenu(v => !v)}>
                <div className={s.avatar}>{user.initials}</div>
              </button>
              {showUserMenu && (
                <div className={s.userMenu}>
                  <div className={s.umTop}>
                    <div className={s.umAvatar}>{user.initials}</div>
                    <div><p className={s.umName}>{user.name}</p><p className={s.umEmail}>{user.email}</p></div>
                  </div>
                  <hr className={s.umDivider}/>
                  <button className={s.umItem} onClick={() => { setShowSettings(true); setShowUserMenu(false); }}>⚙️ Agent Settings</button>
                  <button className={s.umItem} onClick={async () => { await clearHistory().catch(() => {}); setShowUserMenu(false); }}>🗑️ Clear History</button>
                  <hr className={s.umDivider}/>
                  <button className={s.umDanger} onClick={() => { logout(); navigate('/'); }}>↩ Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={s.signInLink}>Sign In</Link>
          )}
        </div>
      </header>

      {/* Voice banner */}
      {listening && (
        <div className={s.voiceBanner}>
          <span className={s.voiceDot}/>
          🎙️ {transcript || 'Bol do — sun raha hoon...'}
        </div>
      )}

      {/* ── Tabs ── */}
      {(data || loadingQuick) && (
        <div className={s.tabBar}>
          <div className={s.tabLeft}>
            {visibleTabs.map(tab => (
              <button key={tab.id} className={`${s.tab} ${activeTab === tab.id ? s.tabActive : ''}`} onClick={() => setActiveTab(tab.id)}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          {data && (
            <div className={s.tabRight}>
              {loadingEnrich && (
                <span className={s.enrichingTag}>
                  <span className={s.enrichDot}/> AI thinking
                </span>
              )}
              {!loadingEnrich && enrich?.agents && Object.entries(enrich.agents).map(([k, v]) => {
                if (!v || v === 'fallback' || v === 'failed') return null;
                const provider = v.split(':')[0];
                const color = AGENT_COLORS[provider] || '#888';
                return (
                  <span key={k} className={s.agentTag} style={{ borderColor: color + '44', color }}>
                    {v.replace('(fallback)', '')}
                  </span>
                );
              })}
              <span className={s.timer}>{data.elapsedMs ? (data.elapsedMs / 1000).toFixed(2) + 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Main ── */}
      <main className={s.main}>
        <div className={s.content}>

          {loadingQuick && <ResultsSkeleton/>}

          {error && !loadingQuick && (
            <div className={s.errorBox}>
              <span className={s.errIco}>⚠️</span>
              <div>
                <p className={s.errTitle}>Search failed</p>
                <p className={s.errMsg}>{error}</p>
                <button className={s.retryBtn} onClick={() => runSearch(inputVal)}>Try again</button>
              </div>
            </div>
          )}

          {data && !loadingQuick && (
            <>
              <p className={s.meta}>
                {resultCount > 0
                  ? <>About <strong>{resultCount}</strong> results for <strong>"{data.cleanQuery}"</strong></>
                  : (loadingEnrich || enrich?.aiAnswer)
                    ? <>AI answer for <strong>"{data.cleanQuery}"</strong></>
                    : <>No results found for <strong>"{data.cleanQuery}"</strong></>
                }
                {data.language && data.language !== 'english' && <span className={s.langBadge}>{data.language}</span>}
                {data.intent && data.intent !== 'informational' && <span className={s.intentBadge}>{data.intent}</span>}
              </p>

              {/* Real images from the web — quick preview, links to Images tab */}
              {data.imageResults?.length > 0 && (
                <ImageStrip images={data.imageResults} onSeeAll={() => setActiveTab('images')}/>
              )}

              {/* Manual AI image generation — available for every query, auto-shows if server already has one */}
              <GeneratedImageCard key={data.cleanQuery} query={data.cleanQuery} existingImage={data.generatedImage}/>

              {/* ALL TAB */}
              {activeTab === 'all' && (
                <div className={s.twoCol}>
                  <div className={s.mainCol}>
                    {/* AI answer: skeleton while enriching, then real card */}
                    {loadingEnrich && <AnswerSkeleton/>}
                    {!loadingEnrich && enrich?.aiAnswer && (
                      <div className="fade-up"><AIAnswerCard answer={enrich.aiAnswer} query={data.cleanQuery}/></div>
                    )}
                    {!loadingEnrich && !enrich?.aiAnswer && enrich?.featuredSnippet && (
                      <FeaturedSnippet snippet={enrich.featuredSnippet}/>
                    )}

                    {webResults.map((r, i) => (
                      <div key={r.url + i} className="fade-up" style={{ animationDelay: `${Math.min(i,8) * 0.04}s` }}>
                        <WebResultCard result={r}/>
                        {i === 2 && enrich?.peopleAlsoAsk?.length > 0 && (
                          <PeopleAlsoAsk items={enrich.peopleAlsoAsk}/>
                        )}
                      </div>
                    ))}

                    {webResults.length === 0 && !loadingEnrich && !enrich?.aiAnswer && (
                      <div className={s.empty}>
                        <span className={s.emptyIcon}>🔍</span>
                        No results found. Try a different search.
                      </div>
                    )}

                    {enrich?.relatedSearches?.length > 0 && (
                      <RelatedSearches items={enrich.relatedSearches} onSearch={go}/>
                    )}
                  </div>

                  {enrich?.knowledgePanel && (
                    <aside className={s.sideCol}>
                      <KnowledgePanel panel={enrich.knowledgePanel}/>
                    </aside>
                  )}
                </div>
              )}

              {/* NEWS TAB */}
              {activeTab === 'news' && (
                <div className={s.newsGrid}>
                  {data?.newsResults?.length > 0
                    ? data.newsResults.map((n, i) => (
                        <div key={n.url + i} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                          <NewsCard result={n}/>
                        </div>
                      ))
                    : (
                      <div className={s.emptyTab}>
                        <span className={s.emptyIcon}>📰</span>
                        <p className={s.emptyTitle}>No news results found</p>
                        <p className={s.emptySub}>Add <strong>BRAVE_API_KEY</strong> in <code>server/.env</code> to get live news.</p>
                      </div>
                    )
                  }
                </div>
              )}

              {/* IMAGES TAB */}
              {activeTab === 'images' && (
                data?.imageResults?.length > 0
                  ? <ImageGrid images={data.imageResults}/>
                  : (
                    <div className={s.emptyTab}>
                      <span className={s.emptyIcon}>🖼️</span>
                      <p className={s.emptyTitle}>No image results found</p>
                      <p className={s.emptySub}>Add <strong>BRAVE_API_KEY</strong> in <code>server/.env</code> to get real images from the web.</p>
                      <p className={s.emptySub}>Or use the <strong>🎨 Generate AI Image</strong> button on the All tab.</p>
                    </div>
                  )
              )}

              {/* VIDEOS TAB */}
              {activeTab === 'videos' && (
                <div className={s.newsGrid}>
                  {data?.videoResults?.length > 0
                    ? data.videoResults.map((v, i) => (
                        <div key={v.url + i} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                          <VideoCard result={v}/>
                        </div>
                      ))
                    : (
                      <div className={s.emptyTab}>
                        <span className={s.emptyIcon}>🎬</span>
                        <p className={s.emptyTitle}>No video results found</p>
                        <p className={s.emptySub}>Add <strong>BRAVE_API_KEY</strong> in <code>server/.env</code> to get real videos from the web.</p>
                      </div>
                    )
                  }
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className={s.footer}>🇮🇳 Bharat.AI — Multi-Agent AI Search</footer>

      {showSettings && <AgentSettings onClose={() => setShowSettings(false)}/>}
    </div>
  );
}
