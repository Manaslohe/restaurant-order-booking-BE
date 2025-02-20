const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// Connect to database
connectDB();

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://restaurant-order-booking-nu.vercel.app', 'https://restaurant-order-booking-nu.vercel.app/']
    : 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true
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

// For local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
