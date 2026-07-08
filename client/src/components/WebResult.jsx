import React, { useState } from 'react';
import styles from './WebResult.module.css';

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch (_) { return url; }
}

function truncate(str, max = 200) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function WebResult({ result }) {
  const [imgError, setImgError] = useState(false);
  const domain = getDomain(result.url);

  return (
    <div className={styles.card}>
      {/* Source row */}
      <div className={styles.source}>
        {result.favicon && !imgError ? (
          <img
            src={result.favicon}
            alt=""
            className={styles.favicon}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.faviconPlaceholder}>
            {domain.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={styles.domain}>{domain}</span>
      </div>

      {/* Title */}
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.title}
      >
        {result.title || domain}
      </a>

      {/* URL pill */}
      <div className={styles.urlPill}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span>{truncate(result.url, 80)}</span>
      </div>

      {/* Description */}
      {result.description && (
        <p className={styles.description}>
          {truncate(result.description, 220)}
        </p>
      )}

      {/* Extra snippet */}
      {result.source && (
        <p className={styles.snippet}>{truncate(result.source, 120)}</p>
      )}

      {/* Visit button */}
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.visitBtn}
      >
        Visit Site
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
