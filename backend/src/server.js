const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase, getStatus } = require('./db/connection');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev/prototype access or CORS_ORIGIN
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getStatus();
  return res.json({
    success: true,
    data: {
      status: 'healthy',
      app: 'THERMAL SENSE API',
      version: '1.0.0',
      prototypeFor: 'DRDO / Indian Armed Forces (SIH 2026)',
      timestamp: new Date().toISOString(),
      database: dbStatus
    }
  });
});

// Routes
const weatherRoutes = require('./routes/weatherRoutes');
const materialRoutes = require('./routes/materialRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const optimizationRoutes = require('./routes/optimizationRoutes');

app.use('/api/weather', weatherRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/simulate', simulationRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/optimize', optimizationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error occurred.'
  });
});

// Start Server
async function startServer() {
  await initializeDatabase();

  const server = app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`  THERMAL SENSE - Backend Server running on port ${PORT}`);
    console.log(`  Target: DRDO / Indian Armed Forces Prototype`);
    console.log(`  CORS Allowed Origin: ${CORS_ORIGIN}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log('====================================================');
  });

  return server;
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}

module.exports = { app, startServer };
