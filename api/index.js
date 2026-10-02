const connectDB = require('../server/src/config/db');
const routes = require('../server/src/routes');
const errorHandler = require('../server/src/middleware/errorHandler');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Initialize DB connection
connectDB();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: '*',
  credentials: true
}));
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
