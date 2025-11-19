// routes/shortener.js
const express = require('express');
const router = express.Router();
const ShortUrl = require('../models/ShortUrl');
const { nanoid } = require('nanoid');

function normalizeUrl(url) {
  if (!url) return url;
  url = url.trim();
  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

// Create a short URL
router.post('/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl) return res.status(400).json({ error: 'longUrl required' });

    const normalized = normalizeUrl(longUrl);
    // Optional: check if already exists
    let existing = await ShortUrl.findOne({ longUrl: normalized });
    if (existing) return res.json({ code: existing.code });

    const code = nanoid(7);
    const doc = new ShortUrl({ code, longUrl: normalized });
    await doc.save();
    res.json({ code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Redirect by code
router.get('/:code', async (req, res) => {
  try {
    const code = decodeURIComponent(req.params.code);
    const doc = await ShortUrl.findOne({ code }).lean();
    if (!doc) return res.status(404).send('Not found');

    // Log for debugging
    console.log('Redirecting code', code, 'to', doc.longUrl);

    // temporary redirect 
    return res.redirect(302, doc.longUrl);
  } catch (err) {
    console.error('Redirect error', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
