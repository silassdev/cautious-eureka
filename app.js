require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/urlshort';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'))); // serve index.html/static assets

// DB connect
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB is connected.'))
  .catch(err => console.error('DB Error:', err));

// Schema
const shortSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  longUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Short = mongoose.model('Short', shortSchema);

// Helpers
function normalizeToAbsolute(longUrl, req) {
  if (!longUrl || typeof longUrl !== 'string') throw new Error('Invalid URL');

  longUrl = longUrl.trim();

  // If it's a local path like "/home" or "/dashboard"
  if (/^\//.test(longUrl)) {
    // Convert to absolute on this host
    return `${req.protocol}://${req.get('host')}${longUrl}`;
  }

  // If it already has protocol, return as-is (http:// or https://)
  if (/^https?:\/\//i.test(longUrl)) {
    return longUrl;
  }

  // Try to treat input as host/path without protocol (e.g., "example.com/path")
  // Prepend https:// and validate with URL constructor
  try {
    const candidate = 'https://' + longUrl;
    // Will throw if candidate is not a valid URL
    new URL(candidate);
    return candidate;
  } catch (err) {
    throw new Error('Invalid URL format');
  }
}

// Routes

// Create short URL
app.post('/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl) return res.status(400).json({ error: 'longUrl is required' });

    const normalized = normalizeToAbsolute(longUrl, req);

    // If identical longUrl exists, return existing code
    const existing = await Short.findOne({ longUrl: normalized }).lean();
    if (existing) {
      return res.json({
        code: existing.code,
        shortUrl: `${req.protocol}://${req.get('host')}/${existing.code}`
      });
    }

    const code = nanoid(7);
    await Short.create({ code, longUrl: normalized });

    return res.json({
      code,
      shortUrl: `${req.protocol}://${req.get('host')}/${code}`
    });
  } catch (err) {
    console.error('POST /shorten error:', err.message || err);
    return res.status(400).json({ error: err.message || 'Server error' });
  }
});

// Redirect route (must be after static middleware)
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const doc = await Short.findOne({ code }).lean();
    if (!doc) return res.status(404).send('Short URL not found');

    console.log(`Redirecting ${code} -> ${doc.longUrl}`);
    return res.redirect(302, doc.longUrl);
  } catch (err) {
    console.error('Redirect error:', err);
    return res.status(500).send('Server error');
  }
});

// Start
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
