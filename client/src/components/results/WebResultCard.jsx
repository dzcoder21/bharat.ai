import React, { useState } from 'react';
import s from './WebResultCard.module.css';

const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : str || '';
const dom = (url) => { try { return new URL(url).hostname.replace('www.',''); } catch { return url; } };

export default function WebResultCard({ result: r }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={s.card}>
      <div className={s.source}>
        {r.favicon && !imgErr
          ? <img src={r.favicon} alt="" className={s.favicon} onError={() => setImgErr(true)} />
          : <div className={s.faviconPh}>{dom(r.url).charAt(0).toUpperCase()}</div>
        }
        <div className={s.sourceInfo}>
          <span className={s.domain}>{dom(r.url)}</span>
          <span className={s.urlPath}>{trunc(r.url, 70)}</span>
        </div>
        {r.age && <span className={s.age}>{r.age}</span>}
      </div>

      <a href={r.url} target="_blank" rel="noopener noreferrer" className={s.title}>
        {r.title}
      </a>

      {r.description && (
        <p className={s.desc}>{trunc(r.description, 220)}</p>
      )}

      {r.deepLinks?.length > 0 && (
        <div className={s.deepLinks}>
          {r.deepLinks.map((dl, i) => (
            <span key={i} className={s.deepLink}>{trunc(dl, 60)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
