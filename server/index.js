require('./config/env');

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { corsOptions } = require('./config/cors');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan('dev'));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use('/media', express.static(path.join(__dirname, 'generated')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tts', require('./routes/tts'));
app.use('/api/ttv', require('./routes/ttv'));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MERN backend is running successfully!',
  });
});

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 15000,
})
  .then(() => {
    if (!process.env.VERCEL) {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('MongoDB connected');
      });
    } else {
      console.log('MongoDB connected');
    }
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;