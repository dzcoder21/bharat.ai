import React, { useState } from 'react';
import s from './AIAnswerCard.module.css';

function renderMD(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    // Heading
    if (line.startsWith('## ')) return <h3 key={i} className={s.h3}>{inline(line.slice(3))}</h3>;
    if (line.startsWith('# '))  return <h2 key={i} className={s.h2}>{inline(line.slice(2))}</h2>;
    // Bullet
    if (/^[\s]*[•\-\*] /.test(line)) return <li key={i} className={s.li}>{inline(line.replace(/^[\s]*[•\-\*] /,''))}</li>;
    // Numbered
    if (/^\d+\. /.test(line)) return <li key={i} className={s.liNum}>{inline(line.replace(/^\d+\. /,''))}</li>;
    // Related line
    if (line.startsWith('🔍')) return <p key={i} className={s.related}>{inline(line)}</p>;
    return <p key={i} className={s.p}>{inline(line)}</p>;
  });
}

function inline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2,-2)}</strong>;
    if (p.startsWith('*')  && p.endsWith('*'))  return <em key={i}>{p.slice(1,-1)}</em>;
    if (p.startsWith('`')  && p.endsWith('`'))  return <code key={i} className={s.code}>{p.slice(1,-1)}</code>;
    return p;
  });
}

export default function AIAnswerCard({ answer, query }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={s.card}>
      <div className={s.header}>
        <div className={s.hLeft}>
          <div className={s.icon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <span className={s.label}>AI Answer</span>
          <span className={s.modelBadge}>Claude Sonnet</span>
        </div>
        <div className={s.hRight}>
          <button className={s.iconBtn} onClick={() => { navigator.clipboard.writeText(answer); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
            {copied ? <span style={{color:'var(--text-green)',fontSize:'.75rem'}}>✓ Copied</span> : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
          </button>
          <button className={s.iconBtn} onClick={() => setCollapsed(c => !c)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {collapsed ? <path d="M6 9l6 6 6-6"/> : <path d="M18 15l-6-6-6 6"/>}
            </svg>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className={s.body}>{renderMD(answer)}</div>
      )}

      <div className={s.footer}>
        <span className={s.footNote}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          AI-generated · always verify critical information
        </span>
      </div>
    </div>
  );
}
