import React, { useState } from 'react';
import styles from './AIAnswerCard.module.css';

// Simple markdown-like renderer (bold, bullets, links)
function renderAnswer(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  lines.forEach((line) => {
    if (!line.trim()) {
      elements.push(<br key={key++} />);
      return;
    }

    // Bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
      const content = line.replace(/^[\s•\-*]+/, '');
      elements.push(
        <li key={key++} className={styles.bullet}>
          {renderInline(content)}
        </li>
      );
      return;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const content = line.replace(/^\d+\.\s/, '');
      elements.push(
        <li key={key++} className={styles.numItem}>
          {renderInline(content)}
        </li>
      );
      return;
    }

    // "🔍 Also search:" line
    if (line.includes('🔍 Also search:') || line.startsWith('🔍')) {
      elements.push(
        <p key={key++} className={styles.alsoSearch}>
          {renderInline(line)}
        </p>
      );
      return;
    }

    // Heading-like lines (ends with :)
    if (line.trim().endsWith(':') && line.trim().length < 60) {
      elements.push(
        <p key={key++} className={styles.subheading}>
          {renderInline(line)}
        </p>
      );
      return;
    }

    elements.push(
      <p key={key++} className={styles.para}>
        {renderInline(line)}
      </p>
    );
  });

  return elements;
}

function renderInline(text) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const subParts = part.split(urlRegex);
    return subParts.map((sub, j) => {
      if (urlRegex.test(sub)) {
        return <a key={`${i}-${j}`} href={sub} target="_blank" rel="noopener noreferrer"
          className={styles.inlineLink}>{sub}</a>;
      }
      return sub;
    });
  });
}

export default function AIAnswerCard({ answer, query }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.aiIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor"
                strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className={styles.label}>AI Answer</span>
          <span className={styles.badge}>Bharat.AI</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} onClick={handleCopy} title="Copy answer">
            {copied ? '✓' : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          <button className={styles.iconBtn} onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed
                ? <path d="M6 9l6 6 6-6" />
                : <path d="M18 15l-6-6-6 6" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Content */}
      {!collapsed && (
        <div className={styles.content}>
          {renderAnswer(answer)}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          AI-generated · verify important info
        </span>
        {copied && <span className={styles.copiedMsg}>✓ Copied!</span>}
      </div>
    </div>
  );
}
