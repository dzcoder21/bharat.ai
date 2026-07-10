const express = require('express');
const router  = express.Router();
const { getSuggestions } = require('../controllers/suggestController');

router.get('/', getSuggestions);

module.exports = router;
