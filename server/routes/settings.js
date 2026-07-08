const express = require('express');
const router  = express.Router();
const { getConfig, setConfig, resetConfig, PROVIDER_INFO, AGENT_INFO } = require('../services/agentConfig');
const { getAvailableProviders } = require('../config/aiClients');

// GET /api/settings — get current config + available providers
router.get('/', (req, res) => {
  res.json({
    config: getConfig(),
    available: getAvailableProviders(),
    providers: PROVIDER_INFO,
    agents: AGENT_INFO,
  });
});

// POST /api/settings — update agent config
router.post('/', (req, res) => {
  const { queryAgent, answerAgent, rankAgent, relatedAgent } = req.body;
  const valid = ['claude','openai','groq','gemini'];
  const updates = {};
  if (queryAgent   && valid.includes(queryAgent))   updates.queryAgent   = queryAgent;
  if (answerAgent  && valid.includes(answerAgent))  updates.answerAgent  = answerAgent;
  if (rankAgent    && valid.includes(rankAgent))    updates.rankAgent    = rankAgent;
  if (relatedAgent && valid.includes(relatedAgent)) updates.relatedAgent = relatedAgent;
  const config = setConfig(updates);
  res.json({ config, message: 'Agent configuration updated' });
});

// POST /api/settings/reset
router.post('/reset', (req, res) => {
  const config = resetConfig();
  res.json({ config, message: 'Reset to defaults' });
});

module.exports = router;
