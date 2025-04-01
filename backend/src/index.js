const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Import routes
const recommendationsRoutes = require('./routes/recommendations');
const simulateRoutes = require('./routes/simulate');
const dummyDataRoutes = require('./routes/dummy-data');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// Routes
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/dummy-data', dummyDataRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Market Basket Analysis API',
    status: 'active',
    version: '1.0.0'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error [${req.id}]:`, err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      requestId: req.id
    }
  });
});

// Not found middleware
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      status: 404,
      path: req.originalUrl
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app; 