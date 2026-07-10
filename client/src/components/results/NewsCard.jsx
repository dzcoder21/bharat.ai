import React from 'react';

const dom = (url) => { try { return new URL(url).hostname.replace('www.',''); } catch { return url; } };
const trunc = (s, n) => s && s.length > n ? s.slice(0, n) + '…' : s || '';

export default function NewsCard({ result: r }) {
  return (
    <div style={{
      display:'flex', gap:'14px', background:'var(--bg-card)', border:'1px solid transparent',
      borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:'8px',
      transition:'var(--transition)', cursor:'pointer'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor='var(--border)'}
    onMouseLeave={e => e.currentTarget.style.borderColor='transparent'}
    >
      {r.thumbnail && (
        <img src={r.thumbnail} alt={r.title}
          style={{width:'100px',height:'68px',objectFit:'cover',borderRadius:'8px',flexShrink:0}}
          onError={e => e.target.style.display='none'}
        />
      )}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'5px'}}>
          <span style={{fontSize:'.72rem',color:'var(--text-green)',fontWeight:500}}>{r.source || dom(r.url)}</span>
          {r.age && <span style={{fontSize:'.67rem',color:'var(--text-muted)'}}>{r.age}</span>}
        </div>
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          style={{display:'block',fontSize:'.95rem',fontWeight:600,color:'#8ab4f8',lineHeight:1.4,marginBottom:'5px',textDecoration:'none'}}>
          {r.title}
        </a>
        {r.description && <p style={{fontSize:'.82rem',color:'var(--text-secondary)',lineHeight:1.55}}>{trunc(r.description, 180)}</p>}
      </div>
    </div>
  );
}
