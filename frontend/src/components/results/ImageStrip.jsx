import React, { useState } from 'react';
import s from './ImageStrip.module.css';

export default function ImageStrip({ images, onSeeAll }) {
  const [lightbox, setLightbox] = useState(null);
  if (!images?.length) return null;

  const preview = images.slice(0, 5);

  return (
    <div className={s.wrap}>
      <div className={s.headRow}>
        <span className={s.title}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>
          Real Images
        </span>
        {images.length > preview.length && (
          <button className={s.seeAll} onClick={onSeeAll}>See all {images.length} →</button>
        )}
      </div>

      <div className={s.strip}>
        {preview.map((img, i) => (
          <div key={i} className={s.thumb} onClick={() => setLightbox(img)}>
            <img
              src={img.imageUrl}
              alt={img.title}
              loading="lazy"
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
          </div>
        ))}
      </div>

      {lightbox && (
        <div className={s.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div className={s.lightboxBox} onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.imageUrl} alt={lightbox.title} className={s.lightboxImg}/>
            <div className={s.lightboxFoot}>
              <span>{lightbox.title}</span>
              <a href={lightbox.url} target="_blank" rel="noopener noreferrer">Visit source ↗</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
