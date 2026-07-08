import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, resetSettings } from '../../utils/api';
import s from './AgentSettings.module.css';

const PROVIDER_META = {
  claude: { label:'Claude', company:'Anthropic', color:'#FF6B35', icon:'🟠', free:false },
  openai: { label:'GPT-4o', company:'OpenAI',    color:'#10a37f', icon:'🟢', free:false },
  groq:   { label:'LLaMA', company:'Groq',       color:'#f97316', icon:'⚡', free:true  },
  gemini: { label:'Gemini', company:'Google',    color:'#4285F4', icon:'🔵', free:true  },
};

const AGENT_META = {
  queryAgent:   { label:'Query Agent',   icon:'🔍', desc:'Understands intent & expands queries' },
  answerAgent:  { label:'Answer Agent',  icon:'🤖', desc:'Generates AI answers with web search' },
  rankAgent:    { label:'Rank Agent',    icon:'📊', desc:'Re-ranks results & extracts snippets' },
  relatedAgent: { label:'Related Agent', icon:'💡', desc:'Suggests related searches & FAQs' },
};

export default function AgentSettings({ onClose }) {
  const [settings, setSettings]     = useState(null);
  const [available, setAvailable]   = useState({});
  const [config, setConfig]         = useState({});
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    getSettings().then(data => {
      setSettings(data);
      setAvailable(data.available || {});
      setConfig(data.config || {});
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const data = await updateSettings(config);
      setConfig(data.config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_) {}
    setSaving(false);
  }

  async function handleReset() {
    const data = await resetSettings();
    setConfig(data.config);
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <span className={s.headerIcon}>⚙️</span>
            <div>
              <h2 className={s.title}>AI Agent Settings</h2>
              <p className={s.subtitle}>Choose which AI powers each agent</p>
            </div>
          </div>
          <button className={s.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Provider availability legend */}
        <div className={s.legend}>
          <span className={s.legendLabel}>Available providers:</span>
          {Object.entries(PROVIDER_META).map(([k,v]) => (
            <span key={k} className={`${s.providerPill} ${available[k] ? s.providerAvail : s.providerUnavail}`}
              style={available[k] ? { borderColor: v.color+'44', color: v.color } : {}}>
              {v.icon} {v.company}
              {v.free && <span className={s.freeBadge}>FREE</span>}
              {!available[k] && <span className={s.missingBadge}>No Key</span>}
            </span>
          ))}
        </div>

        {/* Agent rows */}
        <div className={s.agents}>
          {Object.entries(AGENT_META).map(([agentKey, agent]) => (
            <div key={agentKey} className={s.agentRow}>
              <div className={s.agentInfo}>
                <span className={s.agentIcon}>{agent.icon}</span>
                <div>
                  <p className={s.agentLabel}>{agent.label}</p>
                  <p className={s.agentDesc}>{agent.desc}</p>
                </div>
              </div>
              <div className={s.providerBtns}>
                {Object.entries(PROVIDER_META).map(([provKey, prov]) => (
                  <button
                    key={provKey}
                    className={`${s.provBtn} ${config[agentKey] === provKey ? s.provBtnActive : ''} ${!available[provKey] ? s.provBtnDisabled : ''}`}
                    style={config[agentKey] === provKey ? { borderColor: prov.color, background: prov.color+'18', color: prov.color } : {}}
                    onClick={() => available[provKey] && setConfig(c => ({ ...c, [agentKey]: provKey }))}
                    disabled={!available[provKey]}
                    title={!available[provKey] ? `Add ${provKey.toUpperCase()}_API_KEY to .env` : prov.company}
                  >
                    {prov.icon} {prov.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* History section */}
        <div className={s.histSection}>
          <p className={s.histTitle}>🕐 Search History</p>
          <p className={s.histDesc}>Your search history is stored locally in MongoDB</p>
          <button className={s.clearHistBtn} onClick={async () => {
            const { clearHistory } = await import('../../utils/api');
            await clearHistory().catch(() => {});
            alert('History cleared!');
          }}>
            🗑️ Clear All History
          </button>
        </div>

        {/* Footer */}
        <div className={s.footer}>
          <button className={s.resetBtn} onClick={handleReset}>↺ Reset Defaults</button>
          <button className={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <span className={s.spinner}/> : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
