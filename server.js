const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN
    : 'http://localhost:3000',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Restaurant Order Booking API',
    version: '1.0',
    endpoints: {
      health: '/health',
      api: '/api/orders'
    }
  });
});

// Routes
app.use('/api/orders', require('./routes/orders'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
