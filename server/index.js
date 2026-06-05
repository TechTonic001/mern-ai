require('./config/env');

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./lib/db');
const { corsOptions } = require('./config/cors');

const app = express();
const isVercel = Boolean(process.env.VERCEL);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan(isVercel ? 'combined' : 'dev'));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error.message);
    res.status(503).json({ error: 'Database unavailable. Check MONGO_URI and Atlas network access.' });
  }
});

app.use('/media', express.static(path.join(__dirname, 'generated')));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MERN backend is running successfully!',
    environment: isVercel ? 'vercel' : 'local',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, database: 'connected' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tts', require('./routes/tts'));
app.use('/api/ttv', require('./routes/ttv'));

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

if (!isVercel) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('MongoDB connected');
      });
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
