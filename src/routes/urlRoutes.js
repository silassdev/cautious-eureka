const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');

// POST /api/shorten   { originalUrl, customCode?, expiresInDays? }
router.post('/shorten', urlController.shorten);

// GET /api/info/:code
router.get('/info/:code', urlController.info);

module.exports = router;
