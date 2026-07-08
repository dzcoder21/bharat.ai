import React, { useState } from 'react';

const card = {
  background:'var(--bg-card)', border:'1px solid var(--border)',
  borderRadius:'var(--radius)', padding:'16px 18px', marginBottom:'16px',
};

/* ── Answer Skeleton (shown while AI answer is enriching) ───── */
export function AnswerSkeleton() {
  const shimmer = {
    background:'linear-gradient(90deg,var(--bg-card) 0%,rgba(249,115,22,.07) 50%,var(--bg-card) 100%)',
    backgroundSize:'700px 100%', animation:'shimmer 1.5s infinite linear', borderRadius:6,
  };
  return (
    <div style={{
      background:'linear-gradient(135deg,rgba(249,115,22,.05),var(--bg-card))',
      border:'1px solid rgba(249,115,22,.18)', borderRadius:'var(--radius-lg)',
      padding:'16px 18px', marginBottom:18,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <div style={{...shimmer,width:26,height:26,borderRadius:8}}/>
        <div style={{...shimmer,width:86,height:12}}/>
        <div style={{...shimmer,width:64,height:16,borderRadius:99}}/>
      </div>
      {[92,80,86,62].map((w,i)=>(
        <div key={i} style={{...shimmer,width:`${w}%`,height:11,marginBottom:9}}/>
      ))}
      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,paddingLeft:11,borderLeft:'2px solid var(--saffron)'}}>
        <div style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(249,115,22,.3)',borderTopColor:'var(--saffron)',animation:'spin .8s linear infinite'}}/>
        <span style={{fontSize:'.74rem',color:'var(--text-muted)'}}>Thinking through your answer…</span>
      </div>
    </div>
  );
}

/* ── Featured Snippet ─────────────────────────────────────── */
export function FeaturedSnippet({ snippet }) {
  if (!snippet) return null;
  return (
    <div style={{...card, borderLeft:'3px solid var(--saffron)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:'.7rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--saffron)'}}>
          Featured Snippet
        </span>
      </div>
      <p style={{fontSize:'.9rem',color:'var(--text-primary)',lineHeight:1.7}}>{snippet}</p>
    </div>
  );
}

/* ── People Also Ask ──────────────────────────────────────── */
export function PeopleAlsoAsk({ items }) {
  const [open, setOpen] = useState(null);
  if (!items?.length) return null;
  return (
    <div style={{...card, padding:0, overflow:'hidden', marginBottom:16}}>
      <div style={{padding:'12px 16px 8px', borderBottom:'1px solid var(--border)'}}>
        <span style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--text-muted)'}}>
          People Also Ask
        </span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{borderBottom: i < items.length-1 ? '1px solid var(--border)' : 'none'}}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{width:'100%',background:'none',border:'none',padding:'13px 16px',
              display:'flex',alignItems:'center',justifyContent:'space-between',
              color:'var(--text-primary)',fontSize:'.88rem',fontWeight:500,cursor:'pointer',
              textAlign:'left', gap:12}}>
            <span>{item.question}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{flexShrink:0,color:'var(--text-muted)',transform: open===i?'rotate(180deg)':'none',transition:'transform .2s'}}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {open === i && (
            <div style={{padding:'4px 16px 14px',fontSize:'.84rem',color:'var(--text-secondary)',lineHeight:1.65}}>
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Related Searches ─────────────────────────────────────── */
export function RelatedSearches({ items, onSearch }) {
  if (!items?.length) return null;
  return (
    <div style={{...card, marginTop:8}}>
      <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:12}}>
        Related Searches
      </p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
        {items.map((s, i) => (
          <button key={i} onClick={() => onSearch(s)}
            style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
              background:'var(--bg-surface)',border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--text-secondary)',
              fontSize:'.83rem',textAlign:'left',transition:'var(--transition)',lineHeight:1.4}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{flexShrink:0,color:'var(--text-muted)'}}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Knowledge Panel ──────────────────────────────────────── */
export function KnowledgePanel({ panel }) {
  if (!panel) return null;
  return (
    <div style={{...card, background:'linear-gradient(160deg,rgba(249,115,22,.05),var(--bg-card))', borderColor:'rgba(249,115,22,.2)'}}>
      <h3 style={{fontSize:'1.15rem',fontWeight:700,color:'var(--text-primary)',marginBottom:3}}>{panel.title}</h3>
      {panel.subtitle && <p style={{fontSize:'.8rem',color:'var(--saffron)',marginBottom:12,fontWeight:500}}>{panel.subtitle}</p>}
      {panel.description && <p style={{fontSize:'.85rem',color:'var(--text-secondary)',lineHeight:1.65,marginBottom:14}}>{panel.description}</p>}
      {panel.facts?.length > 0 && (
        <div style={{borderTop:'1px solid var(--border)',paddingTop:12}}>
          {panel.facts.map((f, i) => (
            <div key={i} style={{display:'flex',gap:8,marginBottom:8,fontSize:'.83rem'}}>
              <span style={{color:'var(--text-muted)',minWidth:110,flexShrink:0}}>{f.label}</span>
              <span style={{color:'var(--text-primary)',fontWeight:500}}>{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Results Skeleton ─────────────────────────────────────── */
const shimmer = {
  background:'linear-gradient(90deg,var(--bg-card) 0%,rgba(249,115,22,.05) 50%,var(--bg-card) 100%)',
  backgroundSize:'700px 100%', animation:'shimmer 1.6s infinite linear',
  borderRadius:6,
};

export function ResultsSkeleton() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {/* AI card skeleton */}
      <div style={{...card,padding:'18px 20px',border:'1px solid rgba(249,115,22,.2)'}}>
        <div style={{display:'flex',gap:10,marginBottom:14}}>
          <div style={{...shimmer,width:28,height:28,borderRadius:8}}/>
          <div style={{...shimmer,width:90,height:14,alignSelf:'center'}}/>
          <div style={{...shimmer,width:80,height:18,borderRadius:99}}/>
        </div>
        {[90,75,85,60,70].map((w,i) => (
          <div key={i} style={{...shimmer,width:`${w}%`,height:12,marginBottom:10}}/>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,paddingLeft:12,borderLeft:'2px solid var(--saffron)'}}>
          <div style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(249,115,22,.3)',borderTopColor:'var(--saffron)',animation:'spin .8s linear infinite'}}/>
          <div style={{...shimmer,width:200,height:11}}/>
        </div>
      </div>

      {/* Web result skeletons */}
      {[0,1,2,3,4,5].map(i => (
        <div key={i} style={{...card,animation:`fadeUp .35s ${i*.06}s ease both`}}>
          <div style={{display:'flex',gap:9,marginBottom:8}}>
            <div style={{...shimmer,width:18,height:18,borderRadius:4}}/>
            <div style={{...shimmer,width:120,height:12,alignSelf:'center'}}/>
          </div>
          <div style={{...shimmer,width:'70%',height:15,marginBottom:8}}/>
          <div style={{...shimmer,width:'90%',height:11,marginBottom:6}}/>
          <div style={{...shimmer,width:'65%',height:11}}/>
        </div>
      ))}
    </div>
  );
}
