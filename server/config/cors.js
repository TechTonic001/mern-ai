const PRODUCTION_FRONTEND = process.env.FRONTEND_URL || 'https://mern-cilent-eight.vercel.app';

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  PRODUCTION_FRONTEND,
];

const parseOrigins = () => {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];
};

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  const allowedOrigins = parseOrigins();
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    // Allow Vercel preview + production frontend deployments
    if (protocol === 'https:' && hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

module.exports = {
  corsOptions,
  parseOrigins,
  isOriginAllowed,
};
