import React, { useState, useCallback } from 'react';
import { generateImage } from '../../utils/api';
import s from './GeneratedImageCard.module.css';

export default function GeneratedImageCard({ query, existingImage }) {
  // ALWAYS starts collapsed — generation only ever happens when the user clicks.
  // `existingImage` (if present) is only used to show a "saved" hint on the
  // button and to make the click instant — it never auto-opens the card.
  const [status, setStatus]     = useState('idle'); // idle | loading | loaded | error
  const [imageUrl, setImageUrl] = useState(null);
  const [fromServer, setFromServer] = useState(false);
  const [imgReady, setImgReady] = useState(false);

  const generate = useCallback(async (seed, force = false) => {
    setStatus('loading');
    setImgReady(false);
    try {
      const data = await generateImage(query, seed, force);
      setImageUrl(data.url);
      setFromServer(!!data.existing);
      setStatus('loaded');
    } catch (_) {
      setStatus('error');
    }
  }, [query]);

  // ── Collapsed trigger ──────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <button className={s.trigger} onClick={() => generate()}>
        <span className={s.triggerIcon}>{existingImage ? '💾' : '🎨'}</span>
        <span className={s.triggerText}>
          {existingImage ? 'View saved AI image for this search' : 'Generate AI Image for this search'}
        </span>
        <span className={s.triggerBadge}>{existingImage ? 'Saved' : 'Flux · Free'}</span>
      </button>
    );
  }

  // ── Expanded card ───────────────────────────────────────────────────────
  return (
    <div className={s.card}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.icon}>🎨</span>
          <span className={s.label}>AI Generated Image</span>
          <span className={s.modelBadge}>Flux</span>
          {fromServer && status === 'loaded' && (
            <span className={s.cachedBadge} title="Reused from server — no new generation needed">
              💾 From server
            </span>
          )}
        </div>
        <button className={s.closeBtn} onClick={() => { setStatus('idle'); setImageUrl(null); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className={s.imageWrap}>
        {(status === 'loading' || !imgReady) && status !== 'error' && (
          <div className={s.loadingState}>
            <div className={s.spinner}/>
            <p className={s.loadingText}>{fromServer ? 'Loading saved image…' : 'Painting your image…'}</p>
            <p className={s.loadingSub}>"{query}"</p>
          </div>
        )}
        {status === 'error' && (
          <div className={s.errorState}>
            <span>⚠️</span>
            <p>Couldn't generate image. Try again.</p>
          </div>
        )}
        {imageUrl && status !== 'error' && (
          <img
            src={imageUrl}
            alt={query}
            className={s.image}
            style={{ display: imgReady ? 'block' : 'none' }}
            onLoad={() => setImgReady(true)}
            onError={() => setStatus('error')}
          />
        )}
      </div>

      <div className={s.actions}>
        <button className={s.actionBtn} onClick={() => generate(Math.floor(Math.random() * 999999), true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Regenerate
        </button>
        {imageUrl && imgReady && (
          <a className={s.actionBtn} href={imageUrl} target="_blank" rel="noopener noreferrer" download>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </a>
        )}
      </div>

      <p className={s.footNote}>
        🤖 AI-generated illustration — not a real photo. Powered by free Pollinations.ai
      </p>
    </div>
  );
}
