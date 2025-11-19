require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const urlRoutes = require('./routes/urlRoutes');
const Url = require('./models/Url');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60
});
app.use(limiter);


app.use(express.static(path.join(__dirname, '..', 'public')));

// API
app.use('/api', urlRoutes);

// async wrapper
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// redirect short URL
app.get('/:code', asyncHandler(async (req, res) => {
  const { code } = req.params;

  const doc = await Url.findOne({ code });
  if (!doc) return res.status(404).send('Short URL not found');

  doc.clicks = (doc.clicks || 0) + 1;
  await doc.save();

  res.redirect(doc.originalUrl);
}));

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on ${process.env.BASE_URL || `http://localhost:${PORT}`}`)
    );
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
