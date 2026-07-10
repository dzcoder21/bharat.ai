import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTrending, getHistory, clearHistory, autocomplete } from '../utils/api';
import { useDebounce } from '../hooks/useDebounce';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useAuth } from '../context/AuthContext';
import AgentSettings from '../components/settings/AgentSettings';
import s from './Home.module.css';

const QUICK = ['IPL 2025 schedule','UPSC 2025 syllabus','Bollywood movies 2025','ISRO Gaganyaan','India GDP 2025','JEE Advanced cutoff','Delhi weather today','Virat Kohli centuries'];

export default function Home() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { user, logout } = useAuth();

  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop]     = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const [history, setHistory]       = useState([]);
  const [trending, setTrending]     = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const debouncedQ = useDebounce(query, 280);

  const onVoice = useCallback(t => { setQuery(t); navigate(`/results?q=${encodeURIComponent(t)}`); }, [navigate]);
  const { listening, transcript, supported: voiceOk, error: voiceErr, startListening, stopListening } = useVoiceSearch(onVoice);

  useEffect(() => { loadMeta(); inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (debouncedQ.length >= 2) autocomplete(debouncedQ).then(r => setSuggestions(r.suggestions||[])).catch(()=>{});
    else setSuggestions([]);
  }, [debouncedQ]);

  async function loadMeta() {
    try { const [h,t] = await Promise.all([getHistory(),getTrending()]); setHistory(h.slice(0,6)); setTrending(t.slice(0,10)); } catch(_){}
  }

  function go(q2) { const t=(q2||query).trim(); if(!t) return; navigate(`/results?q=${encodeURIComponent(t)}`); }

  function handleKey(e) {
    const items = suggestions.length ? suggestions : QUICK;
    if(e.key==='ArrowDown'){e.preventDefault();setActiveIdx(i=>Math.min(i+1,items.length-1));}
    else if(e.key==='ArrowUp'){e.preventDefault();setActiveIdx(i=>Math.max(i-1,-1));}
    else if(e.key==='Enter'){go(activeIdx>=0?items[activeIdx]:undefined);setShowDrop(false);}
    else if(e.key==='Escape') setShowDrop(false);
  }

  const dropItems = query.length>=2 ? suggestions : QUICK;
  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay<12 ? 'Good morning' : timeOfDay<17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className={s.page} onClick={()=>setShowUserMenu(false)}>
      {/* Ambient background */}
      <div className={s.ambient}/>

      {/* Navbar */}
      <nav className={s.nav}>
        <div className={s.navLinks}>
          <a className={s.navLink} href="#">About</a>
          <a className={s.navLink} href="#">Help</a>
        </div>
        <div className={s.navRight} onClick={e=>e.stopPropagation()}>
          <button className={s.settingsBtn} onClick={()=>setShowSettings(true)} title="AI Agent Settings">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Agents
          </button>
          {user ? (
            <div className={s.userWrap}>
              <button className={s.avatarBtn} onClick={()=>setShowUserMenu(v=>!v)}>
                <div className={s.avatar}>{user.initials}</div>
                <span className={s.userName}>{user.name.split(' ')[0]}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {showUserMenu && (
                <div className={s.userMenu}>
                  <div className={s.userMenuTop}>
                    <div className={s.userMenuAvatar}>{user.initials}</div>
                    <div><p className={s.umName}>{user.name}</p><p className={s.umEmail}>{user.email}</p></div>
                  </div>
                  <hr className={s.umDivider}/>
                  <button className={s.umItem} onClick={()=>setShowSettings(true)}>⚙️ Agent Settings</button>
                  <button className={s.umItem} onClick={async()=>{await clearHistory().catch(()=>{});setHistory([]);}}>🗑️ Clear History</button>
                  <hr className={s.umDivider}/>
                  <button className={s.umItemDanger} onClick={()=>{logout();setShowUserMenu(false);}}>↩ Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <div className={s.authBtns}>
              <Link to="/login"  className={s.btnLogin}>Sign In</Link>
              <Link to="/signup" className={s.btnSignup}>Sign Up</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className={s.hero}>
        {user && <p className={s.greeting}>{greeting}, <strong>{user.name.split(' ')[0]}</strong> 👋</p>}

        {/* Logo */}
        <div className={s.logoWrap}>
          <span className={s.lb}>B</span><span className={s.lh}>H</span>
          <span className={s.la}>A</span><span className={s.lr}>R</span>
          <span className={s.la2}>A</span><span className={s.lt}>T</span>
          <span className={s.lai}>.AI</span>
        </div>
        <p className={s.tagline}>India's Smartest AI Search Engine</p>

        {/* Search box */}
        <div className={s.searchWrap}>
          <div className={`${s.searchBox} ${listening?s.searchListen:''} ${showDrop&&dropItems.length?s.searchOpen:''}`}>
            <span className={s.searchIco}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              ref={inputRef}
              className={s.input}
              type="text"
              placeholder="Search anything..."
              value={listening?(transcript||''):(query)}
              onChange={e=>{setQuery(e.target.value);setShowDrop(true);setActiveIdx(-1);}}
              onFocus={()=>setShowDrop(true)}
              onBlur={()=>setTimeout(()=>setShowDrop(false),180)}
              onKeyDown={handleKey}
              autoComplete="off" readOnly={listening}
            />
            {query&&!listening&&(
              <button className={s.clearBtn} onClick={()=>{setQuery('');setSuggestions([]);inputRef.current?.focus();}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
            <span className={s.sep}/>
            {voiceOk&&(
              <button className={`${s.micBtn} ${listening?s.micActive:''}`} onClick={listening?stopListening:startListening} title="Voice Search">
                {listening?(
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="var(--saffron)"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ):(
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
            )}

            {/* Dropdown */}
            {showDrop&&dropItems.length>0&&!listening&&(
              <ul className={s.dropdown}>
                {query.length<2&&<li className={s.dropHead}>🔥 Trending Searches</li>}
                {dropItems.map((item,i)=>(
                  <li key={item} className={`${s.dropItem} ${activeIdx===i?s.dropActive:''}`}
                    onMouseDown={()=>go(item)} onMouseEnter={()=>setActiveIdx(i)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--text-muted)',flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <span>{item}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={s.dropArrow}><path d="M7 17L17 7M7 7h10v10"/></svg>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {listening&&<p className={s.listenHint}>🎙️ {transcript||'Bol do, main sun raha hoon...'}</p>}
          {voiceErr&&<p className={s.voiceErr}>{voiceErr}</p>}

          <div className={s.btnRow}>
            <button className={s.btnPrimary} onClick={()=>go()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Bharat Search
            </button>
            <button className={s.btnLucky} onClick={()=>go(QUICK[Math.floor(Math.random()*QUICK.length)])}>
              🎲 Lucky Search
            </button>
          </div>
        </div>

        {/* Trending */}
        {trending.length>0&&(
          <div className={s.section}>
            <p className={s.secTitle}>🔥 Trending</p>
            <div className={s.chips}>{trending.map(t=><button key={t.query} className={s.chip} onClick={()=>go(t.query)}>{t.query}</button>)}</div>
          </div>
        )}

        {/* History */}
        {history.length>0&&(
          <div className={s.section}>
            <div className={s.secRow}>
              <p className={s.secTitle}>🕐 Recent Searches</p>
              <button className={s.clearBtn2} onClick={async()=>{await clearHistory().catch(()=>{});setHistory([]);}}>Clear All</button>
            </div>
            <div className={s.chips}>
              {history.map(h=>(
                <button key={h._id||h.query} className={`${s.chip} ${s.chipHist}`} onClick={()=>go(h.query||h.cleanQuery)}>
                  🔍 {h.query}
                </button>
              ))}
            </div>
          </div>
        )}

        {trending.length===0&&history.length===0&&(
          <div className={s.section}>
            <p className={s.secTitle}>💡 Try Searching</p>
            <div className={s.chips}>{QUICK.map(q=><button key={q} className={s.chip} onClick={()=>go(q)}>{q}</button>)}</div>
          </div>
        )}

        {/* Powered by */}
        <div className={s.poweredBy}>
          <span className={s.pbLabel}>Powered by</span>
          {[{n:'Groq',c:'#f97316'},{n:'Gemini',c:'#4285F4'},{n:'Claude',c:'#FF6B35'},{n:'GPT-4o',c:'#10a37f'}].map(p=>(
            <span key={p.n} className={s.pbPill} style={{borderColor:p.c+'44',color:p.c}}>{p.n}</span>
          ))}
        </div>
      </main>

      <footer className={s.footer}>
        🇮🇳 Made in India &nbsp;•&nbsp; <a href="#">Privacy</a> &nbsp;•&nbsp; <a href="#">Terms</a> &nbsp;•&nbsp; Bharat.AI © 2025
      </footer>

      {showSettings&&<AgentSettings onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}
