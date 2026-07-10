import React from 'react';

const dom = (url) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url; } };
const trunc = (s, n) => s && s.length > n ? s.slice(0, n) + '…' : s || '';

function formatDuration(d) {
  if (!d) return null;
  // Brave returns duration like "12:34" already in most cases; pass through if so
  if (typeof d === 'string' && d.includes(':')) return d;
  const sec = parseInt(d, 10);
  if (isNaN(sec)) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoCard({ result: v }) {
  const duration = formatDuration(v.duration);

  return (
    <a
      href={v.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', gap: 14, background: 'var(--bg-card)',
        border: '1px solid transparent', borderRadius: 'var(--radius)',
        padding: '12px 14px', marginBottom: 8, transition: 'var(--transition)',
        textDecoration: 'none', color: 'inherit',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      <div style={{ position: 'relative', width: 140, height: 84, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-surface)' }}>
        {v.thumbnail ? (
          <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🎬</div>
        )}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.25)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="6 4 20 12 6 20"/></svg>
          </div>
        </div>
        {duration && (
          <span style={{
            position: 'absolute', bottom: 4, right: 4, fontSize: '.62rem', fontWeight: 600,
            background: 'rgba(0,0,0,.75)', color: '#fff', padding: '1px 5px', borderRadius: 4,
          }}>{duration}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 5 }}>
          {trunc(v.title, 90)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <span style={{ fontSize: '.74rem', color: 'var(--text-green)' }}>{v.source || dom(v.url)}</span>
          {v.age && <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>· {v.age}</span>}
        </div>
        {v.description && (
          <p style={{ fontSize: '.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{trunc(v.description, 110)}</p>
        )}
      </div>
    </a>
  );
}
