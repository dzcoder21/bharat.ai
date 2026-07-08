import React, { useState, useEffect } from 'react';
import styles from './Loader.module.css';

const LOADING_MSGS = [
  '🤖 AI soch raha hai...',
  '🌐 Web crawl kar raha hai...',
  '🔍 Best results dhoondh raha hai...',
  '📊 Data analyze ho raha hai...',
  '✨ Almost ready...',
];

export default function Loader({ query }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % LOADING_MSGS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.wrap}>
      {/* AI Answer Skeleton */}
      <div className={styles.aiSkeleton}>
        <div className={styles.skHeader}>
          <div className={`${styles.skBox} ${styles.skIconBox}`} />
          <div className={`${styles.skBox} ${styles.skLabel}`} />
          <div className={`${styles.skBox} ${styles.skBadge}`} />
        </div>
        <div className={styles.skLines}>
          <div className={`${styles.skBox} ${styles.skLine} ${styles.w90}`} />
          <div className={`${styles.skBox} ${styles.skLine} ${styles.w75}`} />
          <div className={`${styles.skBox} ${styles.skLine} ${styles.w85}`} />
          <div className={`${styles.skBox} ${styles.skLine} ${styles.w60}`} />
          <div className={`${styles.skBox} ${styles.skLine} ${styles.w70}`} />
        </div>
        <div className={styles.loadingMsg}>
          <span className={styles.spinner} />
          <span className={styles.msgText}>{LOADING_MSGS[msgIdx]}</span>
        </div>
      </div>

      {/* Web Results Skeleton */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.resultSkeleton} style={{ animationDelay: `${i * 0.08}s` }}>
          <div className={styles.skHeader}>
            <div className={`${styles.skBox} ${styles.skFavicon}`} />
            <div className={`${styles.skBox} ${styles.skDomain}`} />
          </div>
          <div className={`${styles.skBox} ${styles.skTitle}`} />
          <div className={`${styles.skBox} ${styles.skUrl}`} />
          <div className={`${styles.skBox} ${styles.skDesc} ${styles.w90}`} />
          <div className={`${styles.skBox} ${styles.skDesc} ${styles.w65}`} />
        </div>
      ))}
    </div>
  );
}
