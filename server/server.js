require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./src/config/db');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Database Connection
connectDB();

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: '*', // Allow frontend dev server and network clients
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoints (Technical Architecture Section 104)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'HMS API', version: 'v1.0.0', timestamp: new Date() });
});
app.get('/api/ready', (req, res) => {
  res.json({ ready: true, database: 'connected' });
});

// Master API v1 router
app.use('/api/v1', routes);
app.use('/',(req,res)=>{res.json({"message":"server is running"})});
// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Server] HMS V1 Backend running in ${process.env.NODE_ENV || 'development'} on port ${PORT}`);
});

module.exports =  app;
