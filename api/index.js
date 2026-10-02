const connectDB = require('../server/src/config/db');
const routes = require('../server/src/routes');
const errorHandler = require('../server/src/middleware/errorHandler');
const express = require('express');
const helmet = require('helmet');

const app = express();

// Global CORS Middleware - Always first
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-branch-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware to ensure DB connection before handling API route
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Vercel Serverless DB Error]', err);
    res.status(500).json({
      success: false,
      error: { code: 'DB_CONNECTION_ERROR', message: 'Failed to connect to database' }
    });
  }
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NX Clinic API', version: 'v1.0.0', timestamp: new Date() });
});

app.get('/api/ready', (req, res) => {
  res.json({ ready: true, database: 'connected' });
});

app.use('/api/v1', routes);
app.use(errorHandler);

module.exports = app;
