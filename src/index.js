require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const urlRoutes = require('./routes/urlRoutes');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60
});
app.use(limiter);

// serve to frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// routes
app.use('/api', urlRoutes);

// redirect route after static and API
app.get('/:code', async (req, res, next) => {
  const { code } = req.params;
  try {
    const Url = require('./models/Url');
    const doc = await Url.findOne({ code });
    if (!doc) return res.status(404).send('Short URL not found');
    doc.clicks = (doc.clicks || 0) + 1;
    await doc.save();
    return res.redirect(doc.originalUrl);
  } catch (err) {
    next(err);
  }
});

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on ${process.env.BASE_URL || `http://localhost:${PORT}`}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
