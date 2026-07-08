import React, { useState } from 'react';

export default function ImageGrid({ images }) {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'10px',marginTop:'8px'}}>
        {images.map((img, i) => (
          <div key={i} onClick={() => setSelected(img)}
            style={{cursor:'pointer',borderRadius:'10px',overflow:'hidden',background:'var(--bg-card)',
              border:'1px solid var(--border)',transition:'var(--transition)',aspectRatio:'4/3'}}>
            <img src={img.imageUrl} alt={img.title}
              style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform .2s'}}
              onMouseEnter={e => e.target.style.transform='scale(1.04)'}
              onMouseLeave={e => e.target.style.transform='scale(1)'}
              onError={e => { e.target.parentElement.style.display='none'; }}
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:999,
            display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div onClick={e => e.stopPropagation()}
            style={{background:'var(--bg-card)',borderRadius:'14px',overflow:'hidden',maxWidth:'90vw',maxHeight:'90vh'}}>
            <img src={selected.imageUrl} alt={selected.title}
              style={{maxWidth:'100%',maxHeight:'80vh',objectFit:'contain',display:'block'}} />
            <div style={{padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:'.82rem',color:'var(--text-secondary)'}}>{selected.title}</span>
              <a href={selected.url} target="_blank" rel="noopener noreferrer"
                style={{fontSize:'.75rem',color:'var(--saffron)'}}>Visit source ↗</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
