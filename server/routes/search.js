const express = require('express');
const router  = express.Router();
const {
  search, quickSearch, enrichSearch, generateImage,
  autocomplete, getHistory, clearHistory, deleteHistoryItem, getTrending,
} = require('../controllers/searchController');

router.get('/quick',          quickSearch);    // fast path — web/news/images
router.get('/enrich',         enrichSearch);   // slow path — AI answer/rank/related
router.get('/generate-image', generateImage);  // manual AI image generation
router.get('/',               search);         // legacy combined (compat)
router.get('/autocomplete',   autocomplete);
router.get('/history',        getHistory);
router.delete('/history',     clearHistory);
router.delete('/history/:id', deleteHistoryItem);
router.get('/trending',       getTrending);

module.exports = router;
